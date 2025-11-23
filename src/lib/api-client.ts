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
        fetchWithAuth<DashboardStats>('/api/admin/dashboard'),
    },
    
    projects: {
      getAll: () => 
        fetchWithAuth<Project[]>('/api/admin/projects'),
      
      getById: (id: string) => 
        fetchWithAuth<Project>(`/api/admin/projects/${id}`),
      
      create: (data: ProjectFormData) =>
        fetchWithAuth<Project>('/api/admin/projects', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      update: (id: string, data: ProjectFormData) =>
        fetchWithAuth<Project>(`/api/admin/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      
      delete: (id: string) =>
        fetchWithAuth<void>(`/api/admin/projects/${id}`, {
          method: 'DELETE',
        }),
    },
    
    images: {
      upload: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/admin/images/upload', {
          method: 'POST',
          body: formData, // Don't set Content-Type, browser sets it with boundary
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new ApiError(response.status, 'Image upload failed');
        }
        
        return response.json() as Promise<{ url: string; thumbnail: string }>;
      },
    },
  },
};

// Types for responses
interface DashboardStats {
  stats: { total: number; published: number; draft: number };
  recentProjects: Project[];
}