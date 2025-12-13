/**
 * API helpers for E2E tests.
 * 
 * @description Provides utilities for creating and cleaning up test data
 * via the API. Authentication is handled via the x-ms-client-principal header.
 */

interface ProjectFormData {
  title: string;
  location?: string;
  shortDescription?: string;
  fullDescription?: string;
  scopeOfWork?: string[];
  challenges?: string;
  outcomes?: string;
  purchaseDate?: string;
  completionDate?: string;
  budget?: number;
  finalCost?: number;
  squareFootage?: number;
  status?: 'draft' | 'published' | 'archived';
  beforeImages?: string[];
  afterImages?: string[];
  primaryBeforeImage?: string;
  primaryAfterImage?: string;
}

interface Project extends ProjectFormData {
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface UploadedImage {
  url: string;
  blobName: string;
}

interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
  claims?: Array<{ typ: string; val: string }>;
}

/**
 * Helper class for API interactions in E2E tests.
 */
export class ApiHelpers {
  private baseUrl: string;
  private createdProjectIds: string[] = [];
  private uploadedImages: UploadedImage[] = [];
  private authHeaders: Record<string, string> = {};

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.setAdminAuth();
  }

  /**
   * Sets authentication headers for admin API requests.
   */
  setAdminAuth(userId: string = 'test-admin', userDetails: string = 'test-admin@test.com'): void {
    const clientPrincipal: ClientPrincipal = {
      identityProvider: 'aad',
      userId,
      userDetails,
      userRoles: ['authenticated', 'anonymous', 'admin'],
      claims: [],
    };
    const encodedPrincipal = Buffer.from(JSON.stringify(clientPrincipal)).toString('base64');
    this.authHeaders = { 'x-ms-client-principal': encodedPrincipal };
  }

  /**
   * Sets authentication headers for a regular (non-admin) user.
   */
  setUserAuth(userId: string = 'test-user', userDetails: string = 'test-user@test.com'): void {
    const clientPrincipal: ClientPrincipal = {
      identityProvider: 'aad',
      userId,
      userDetails,
      userRoles: ['authenticated', 'anonymous'],
      claims: [],
    };
    const encodedPrincipal = Buffer.from(JSON.stringify(clientPrincipal)).toString('base64');
    this.authHeaders = { 'x-ms-client-principal': encodedPrincipal };
  }

  /**
   * Clears authentication headers (simulates unauthenticated request).
   */
  clearAuth(): void {
    this.authHeaders = {};
  }

  getAuthHeaders(): Record<string, string> {
    return { ...this.authHeaders };
  }

  getCreatedProjectIds(): string[] {
    return [...this.createdProjectIds];
  }

  getUploadedImages(): UploadedImage[] {
    return [...this.uploadedImages];
  }

  async createTestProject(data: Partial<ProjectFormData>): Promise<Project> {
    const projectData: ProjectFormData = {
      title: data.title || `E2E Test Project ${Date.now()}`,
      location: data.location || 'Test Location',
      shortDescription: data.shortDescription || 'Test short description',
      fullDescription: data.fullDescription || 'Test full description',
      status: data.status || 'draft',
      ...data,
    };

    const response = await fetch(`${this.baseUrl}/api/manage/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create test project: ${response.status} ${errorText}`);
    }

    const project = await response.json() as Project;
    this.createdProjectIds.push(project.id);
    return project;
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/manage/projects/${projectId}`, {
        method: 'DELETE',
        headers: { ...this.authHeaders },
      });
      if (!response.ok && response.status !== 404) {
        console.warn(`Warning: Failed to delete project ${projectId}: ${response.status}`);
      }
    } catch (error) {
      console.warn(`Warning: Error deleting project ${projectId}:`, error);
    }
    this.createdProjectIds = this.createdProjectIds.filter(id => id !== projectId);
  }

  trackUploadedImage(imageInfo: UploadedImage): void {
    this.uploadedImages.push(imageInfo);
  }

  async cleanup(): Promise<{ projectsDeleted: number; imagesDeleted: number }> {
    let projectsDeleted = 0;
    this.setAdminAuth();
    for (const projectId of [...this.createdProjectIds]) {
      try {
        await this.deleteProject(projectId);
        projectsDeleted++;
      } catch (error) {
        console.warn(`Cleanup warning: Could not delete project ${projectId}:`, error);
      }
    }
    const imagesDeleted = this.uploadedImages.length;
    this.uploadedImages = [];
    this.createdProjectIds = [];
    return { projectsDeleted, imagesDeleted };
  }

  async getAllProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/api/manage/projects`, {
      headers: { ...this.authHeaders },
    });
    if (!response.ok) throw new Error(`Failed to fetch projects: ${response.status}`);
    return await response.json() as Project[];
  }

  async getProject(projectId: string): Promise<Project | null> {
    const response = await fetch(`${this.baseUrl}/api/manage/projects/${projectId}`, {
      headers: { ...this.authHeaders },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to fetch project: ${response.status}`);
    return await response.json() as Project;
  }

  async getPublishedProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/api/projects`);
    if (!response.ok) throw new Error(`Failed to fetch published projects: ${response.status}`);
    return await response.json() as Project[];
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    const response = await fetch(`${this.baseUrl}/api/projects/${slug}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Failed to fetch project by slug: ${response.status}`);
    return await response.json() as Project;
  }
}
