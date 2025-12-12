import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { 
  usePublishedProjects, 
  useProject,
  useAdminDashboard,
  useAdminProjects,
  useAdminProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useImageUpload,
} from './use-projects';
import { api } from '@/lib/api-client';
import type { ReactNode } from 'react';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  api: {
    projects: {
      getPublished: vi.fn(),
      getBySlug: vi.fn(),
    },
    admin: {
      dashboard: { getStats: vi.fn() },
      projects: { 
        getAll: vi.fn(), 
        getById: vi.fn(), 
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      images: {
        upload: vi.fn(),
      },
    },
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test wrapper with providers
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('usePublishedProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    vi.mocked(api.projects.getPublished).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => usePublishedProjects(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return projects after fetch completes', async () => {
    const mockProjects = [
      { id: '1', title: 'Project 1', slug: 'project-1', isPublished: true },
      { id: '2', title: 'Project 2', slug: 'project-2', isPublished: true },
    ];

    vi.mocked(api.projects.getPublished).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => usePublishedProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProjects);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('Network error');
    vi.mocked(api.projects.getPublished).mockRejectedValue(error);

    const { result } = renderHook(() => usePublishedProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch when slug is empty', () => {
    const { result } = renderHook(() => useProject(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(api.projects.getBySlug).not.toHaveBeenCalled();
  });

  it('should fetch project by slug', async () => {
    const mockProject = {
      id: '1',
      title: 'Kitchen Remodel',
      slug: 'kitchen-remodel',
      location: 'Austin, TX',
    };

    vi.mocked(api.projects.getBySlug).mockResolvedValue(mockProject);

    const { result } = renderHook(() => useProject('kitchen-remodel'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProject);
    expect(api.projects.getBySlug).toHaveBeenCalledWith('kitchen-remodel');
  });

  it('should return undefined for non-existent project', async () => {
    vi.mocked(api.projects.getBySlug).mockResolvedValue(null);

    const { result } = renderHook(() => useProject('non-existent'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });
});

describe('useAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch dashboard stats', async () => {
    const mockStats = {
      totalProjects: 10,
      publishedProjects: 5,
      draftProjects: 5,
    };

    vi.mocked(api.admin.dashboard.getStats).mockResolvedValue(mockStats);

    const { result } = renderHook(() => useAdminDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStats);
  });

  it('should handle dashboard fetch error', async () => {
    vi.mocked(api.admin.dashboard.getStats).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useAdminDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useAdminProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all admin projects', async () => {
    const mockProjects = [
      { id: '1', title: 'Project 1', isPublished: true },
      { id: '2', title: 'Project 2', isPublished: false },
    ];

    vi.mocked(api.admin.projects.getAll).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useAdminProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProjects);
  });
});

describe('useAdminProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch when id is undefined', () => {
    const { result } = renderHook(() => useAdminProject(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(api.admin.projects.getById).not.toHaveBeenCalled();
  });

  it('should fetch project by id', async () => {
    const mockProject = { id: '123', title: 'Kitchen Remodel' };

    vi.mocked(api.admin.projects.getById).mockResolvedValue(mockProject);

    const { result } = renderHook(() => useAdminProject('123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProject);
    expect(api.admin.projects.getById).toHaveBeenCalledWith('123');
  });
});

describe('useCreateProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should create project and navigate on success', async () => {
    const newProject = { id: 'new-1', title: 'New Project' };
    vi.mocked(api.admin.projects.create).mockResolvedValue(newProject);

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ title: 'New Project', location: 'Austin, TX' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/projects');
  });

  it('should show error toast on failure', async () => {
    const { toast } = await import('sonner');
    vi.mocked(api.admin.projects.create).mockRejectedValue(new Error('Failed to create'));

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ title: 'New Project', location: 'Austin, TX' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useUpdateProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should update project and navigate on success', async () => {
    const updatedProject = { id: '123', title: 'Updated Project' };
    vi.mocked(api.admin.projects.update).mockResolvedValue(updatedProject);

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ 
        id: '123', 
        data: { title: 'Updated Project', location: 'Dallas, TX' } 
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/projects');
  });

  it('should show error toast on update failure', async () => {
    const { toast } = await import('sonner');
    vi.mocked(api.admin.projects.update).mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ 
        id: '123', 
        data: { title: 'Updated Project', location: 'Dallas, TX' } 
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useDeleteProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete project and show success toast', async () => {
    const { toast } = await import('sonner');
    vi.mocked(api.admin.projects.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('123');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith('Project deleted successfully!');
  });

  it('should show error toast on delete failure', async () => {
    const { toast } = await import('sonner');
    vi.mocked(api.admin.projects.delete).mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteProject(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('123');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalled();
  });
});

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload image successfully', async () => {
    const uploadResult = { url: 'https://storage.example.com/image.jpg' };
    vi.mocked(api.admin.images.upload).mockResolvedValue(uploadResult);

    const { result } = renderHook(() => useImageUpload(), {
      wrapper: createWrapper(),
    });

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      result.current.mutate(mockFile);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(uploadResult);
  });

  it('should show error toast on upload failure', async () => {
    const { toast } = await import('sonner');
    vi.mocked(api.admin.images.upload).mockRejectedValue(new Error('Upload failed'));

    const { result } = renderHook(() => useImageUpload(), {
      wrapper: createWrapper(),
    });

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      result.current.mutate(mockFile);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalled();
  });
});
