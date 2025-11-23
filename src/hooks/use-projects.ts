import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Project, ProjectFormData } from '@/types/project';

// Public hooks
export function usePublishedProjects() {
  return useQuery({
    queryKey: ['projects', 'published'],
    queryFn: api.projects.getPublished,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: ['projects', slug],
    queryFn: () => api.projects.getBySlug(slug),
    enabled: !!slug,
  });
}

// Admin hooks
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: api.admin.dashboard.getStats,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}

export function useAdminProjects() {
  return useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: api.admin.projects.getAll,
  });
}

export function useAdminProject(id?: string) {
  return useQuery({
    queryKey: ['admin', 'projects', id],
    queryFn: () => api.admin.projects.getById(id!),
    enabled: !!id,
  });
}

// Mutations
export function useCreateProject() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: api.admin.projects.create,
    onSuccess: (newProject) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      
      toast.success('Project created successfully!');
      navigate('/admin/projects');
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectFormData }) =>
      api.admin.projects.update(id, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
      queryClient.invalidateQueries({ 
        queryKey: ['admin', 'projects', updatedProject.id] 
      });
      
      toast.success('Project updated successfully!');
      navigate('/admin/projects');
    },
    onError: (error) => {
      toast.error(`Failed to update project: ${error.message}`);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.admin.projects.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      
      toast.success('Project deleted successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message}`);
    },
  });
}

export function useImageUpload() {
  return useMutation({
    mutationFn: api.admin.images.upload,
    onError: (error) => {
      toast.error(`Failed to upload image: ${error.message}`);
    },
  });
}