/**
 * API helpers for E2E tests.
 * 
 * @description Provides utilities for creating and cleaning up test data
 * via the API. All test data created through these helpers is tracked
 * and automatically cleaned up after tests complete.
 * 
 * @example
 * // In step definitions
 * const project = await this.apiHelpers.createTestProject({
 *   title: 'Test Project',
 *   status: 'draft'
 * });
 * // Project ID is tracked and will be cleaned up automatically
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

/**
 * Helper class for API interactions in E2E tests.
 * 
 * @description Tracks all created resources and provides cleanup functionality.
 * Resources are automatically cleaned up when cleanup() is called in After hooks.
 */
export class ApiHelpers {
  private baseUrl: string;
  private createdProjectIds: string[] = [];
  private uploadedImages: UploadedImage[] = [];

  constructor(baseUrl: string) {
    // API routes are proxied through SWA CLI, so use same base URL
    this.baseUrl = baseUrl;
  }

  /**
   * Gets the list of project IDs created during this test session.
   * 
   * @returns Array of project IDs that need cleanup
   */
  getCreatedProjectIds(): string[] {
    return [...this.createdProjectIds];
  }

  /**
   * Gets the list of images uploaded during this test session.
   * 
   * @returns Array of uploaded image info that needs cleanup
   */
  getUploadedImages(): UploadedImage[] {
    return [...this.uploadedImages];
  }

  /**
   * Creates a test project via the API.
   * 
   * @description Creates a new project with the provided data.
   * The project ID is automatically tracked for cleanup.
   * 
   * @param data - Project form data (title is required)
   * @returns The created project object
   * @throws Error if the API request fails
   * 
   * @example
   * const project = await apiHelpers.createTestProject({
   *   title: 'E2E Test Project',
   *   status: 'draft',
   *   shortDescription: 'Test description'
   * });
   */
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
      headers: {
        'Content-Type': 'application/json',
      },
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

  /**
   * Deletes a project via the API.
   * 
   * @description Deletes a project by ID. Also removes it from the tracked list.
   * 
   * @param projectId - The ID of the project to delete
   * @throws Error if the API request fails (404 errors are silently ignored)
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/manage/projects/${projectId}`, {
        method: 'DELETE',
      });

      // 404 is OK - project might already be deleted
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        console.warn(`Warning: Failed to delete project ${projectId}: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.warn(`Warning: Error deleting project ${projectId}:`, error);
    }

    // Remove from tracked list regardless
    this.createdProjectIds = this.createdProjectIds.filter(id => id !== projectId);
  }

  /**
   * Tracks an uploaded image for cleanup.
   * 
   * @description Use this when uploading images via the UI to ensure they're cleaned up.
   * 
   * @param imageInfo - Information about the uploaded image
   */
  trackUploadedImage(imageInfo: UploadedImage): void {
    this.uploadedImages.push(imageInfo);
  }

  /**
   * Cleans up all resources created during the test.
   * 
   * @description Deletes all tracked projects and images.
   * Should be called in After hooks.
   * 
   * @returns Number of resources cleaned up
   */
  async cleanup(): Promise<{ projectsDeleted: number; imagesDeleted: number }> {
    let projectsDeleted = 0;
    let imagesDeleted = 0;

    // Delete all tracked projects (which also deletes their images via the API)
    for (const projectId of [...this.createdProjectIds]) {
      try {
        await this.deleteProject(projectId);
        projectsDeleted++;
      } catch (error) {
        console.warn(`Cleanup warning: Could not delete project ${projectId}:`, error);
      }
    }

    // Note: Images associated with projects are deleted by the API's DeleteProject endpoint
    // If we need to delete standalone images, we would add that logic here
    imagesDeleted = this.uploadedImages.length;
    this.uploadedImages = [];

    // Clear the tracking arrays
    this.createdProjectIds = [];

    return { projectsDeleted, imagesDeleted };
  }

  /**
   * Gets all projects from the API.
   * 
   * @description Fetches all projects, useful for verification in tests.
   * 
   * @returns Array of all projects
   */
  async getAllProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/api/manage/projects`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status}`);
    }

    return await response.json() as Project[];
  }

  /**
   * Gets a single project by ID.
   * 
   * @param projectId - The ID of the project to fetch
   * @returns The project or null if not found
   */
  async getProject(projectId: string): Promise<Project | null> {
    const response = await fetch(`${this.baseUrl}/api/manage/projects/${projectId}`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.status}`);
    }

    return await response.json() as Project;
  }
}
