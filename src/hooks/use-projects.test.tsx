import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { usePublishedProjects, useProject } from './use-projects';
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
      projects: { getAll: vi.fn(), getById: vi.fn(), create: vi.fn() },
    },
  },
}));

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
