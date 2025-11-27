import { toast } from 'sonner';
import type { Project, ProjectFormData } from '@/types/project';

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // Important for Azure Static Web Apps auth
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || `Request failed with status ${response.status}`,
      errorData
    );
  }

  // Handle empty responses (like DELETE)
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Typed API client
export const api = {
  projects: {
    getPublished: () => 
      fetchWithAuth<Project[]>('/api/projects?status=published'),
    
    getBySlug: (slug: string) => 
      fetchWithAuth<Project>(`/api/projects/${slug}`),
  },
  
  admin: {
    dashboard: {
      getStats: () =>
        fetchWithAuth<DashboardStats>('/api/dashboard'),
    },

    projects: {
      getAll: () =>
        fetchWithAuth<Project[]>('/api/manage/projects'),

      getById: (id: string) =>
        fetchWithAuth<Project>(`/api/manage/projects/${id}`),

      create: (data: ProjectFormData) =>
        fetchWithAuth<Project>('/api/manage/projects', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      update: (id: string, data: ProjectFormData) =>
        fetchWithAuth<Project>(`/api/manage/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),

      delete: (id: string) =>
        fetchWithAuth<void>(`/api/manage/projects/${id}`, {
          method: 'DELETE',
        }),
    },

    images: {
      upload: async (file: File): Promise<string> => {
        // Step 1: Get SAS token from API
        const sasResponse = await fetchWithAuth<{ sasUrl: string; blobUrl: string }>(
          '/api/manage/images/sas-token',
          {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type,
            }),
          }
        );

        // Step 2: Upload file directly to Azure Blob Storage using SAS token
        const uploadResponse = await fetch(sasResponse.sasUrl, {
          method: 'PUT',
          headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new ApiError(uploadResponse.status, 'Failed to upload image to storage');
        }

        // Step 3: Return the blob URL (without SAS token)
        return sasResponse.blobUrl;
      },
    },
  },
};

// Types for responses
interface DashboardStats {
  stats: { total: number; published: number; draft: number };
  recentProjects: Project[];
}