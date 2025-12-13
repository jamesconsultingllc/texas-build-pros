/**
 * Unit tests for API client.
 * 
 * @description Tests the API client functions including error handling,
 * authentication, and proper request/response processing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './api-client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('api-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('projects.getPublished', () => {
    it('should fetch published projects successfully', async () => {
      const mockProjects = [
        { id: '1', title: 'Project 1', isPublished: true },
        { id: '2', title: 'Project 2', isPublished: true },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockProjects)),
      });

      const result = await api.projects.getPublished();

      expect(result).toEqual(mockProjects);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects?status=published',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        })
      );
    });

    it('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      await expect(api.projects.getPublished()).rejects.toThrow('Server error');
    });
  });

  describe('projects.getBySlug', () => {
    it('should fetch project by slug', async () => {
      const mockProject = { id: '1', title: 'Kitchen Remodel', slug: 'kitchen-remodel' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockProject)),
      });

      const result = await api.projects.getBySlug('kitchen-remodel');

      expect(result).toEqual(mockProject);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/kitchen-remodel',
        expect.any(Object)
      );
    });
  });

  describe('admin.dashboard.getStats', () => {
    it('should fetch dashboard stats', async () => {
      const mockStats = {
        stats: { total: 10, published: 5, draft: 5 },
        recentProjects: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockStats)),
      });

      const result = await api.admin.dashboard.getStats();

      expect(result).toEqual(mockStats);
      expect(mockFetch).toHaveBeenCalledWith('/api/dashboard', expect.any(Object));
    });
  });

  describe('admin.projects', () => {
    it('should fetch all admin projects', async () => {
      const mockProjects = [{ id: '1', title: 'Project 1' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockProjects)),
      });

      const result = await api.admin.projects.getAll();

      expect(result).toEqual(mockProjects);
      expect(mockFetch).toHaveBeenCalledWith('/api/manage/projects', expect.any(Object));
    });

    it('should fetch project by id', async () => {
      const mockProject = { id: '123', title: 'Project' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockProject)),
      });

      const result = await api.admin.projects.getById('123');

      expect(result).toEqual(mockProject);
      expect(mockFetch).toHaveBeenCalledWith('/api/manage/projects/123', expect.any(Object));
    });

    it('should create a project', async () => {
      const newProject = { id: 'new-1', title: 'New Project' };
      const projectData = { title: 'New Project', location: 'Austin, TX' } as Parameters<typeof api.admin.projects.create>[0];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(newProject)),
      });

      const result = await api.admin.projects.create(projectData);

      expect(result).toEqual(newProject);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/manage/projects',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(projectData),
        })
      );
    });

    it('should update a project', async () => {
      const updatedProject = { id: '123', title: 'Updated Project' };
      const projectData = { title: 'Updated Project', location: 'Dallas, TX' } as Parameters<typeof api.admin.projects.update>[1];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(updatedProject)),
      });

      const result = await api.admin.projects.update('123', projectData);

      expect(result).toEqual(updatedProject);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/manage/projects/123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(projectData),
        })
      );
    });

    it('should delete a project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      const result = await api.admin.projects.delete('123');

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/manage/projects/123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('admin.images.upload', () => {
    it('should upload image with SAS token', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const sasResponse = {
        sasUrl: 'https://storage.blob.core.windows.net/images/test.jpg?sas=token',
        blobUrl: 'https://storage.blob.core.windows.net/images/test.jpg',
      };

      // First call: get SAS token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(sasResponse)),
      });

      // Second call: upload to blob storage
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await api.admin.images.upload(mockFile);

      expect(result).toBe(sasResponse.blobUrl);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Verify SAS token request
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        '/api/manage/images/sas-token',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ fileName: 'test.jpg', contentType: 'image/jpeg' }),
        })
      );

      // Verify blob upload
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        sasResponse.sasUrl,
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': 'image/jpeg',
          },
        })
      );
    });

    it('should throw error if blob upload fails', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const sasResponse = {
        sasUrl: 'https://storage.blob.core.windows.net/images/test.jpg?sas=token',
        blobUrl: 'https://storage.blob.core.windows.net/images/test.jpg',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(sasResponse)),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      await expect(api.admin.images.upload(mockFile)).rejects.toThrow('Failed to upload image to storage');
    });
  });

  describe('error handling', () => {
    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.reject(new Error('Not JSON')),
      });

      await expect(api.projects.getPublished()).rejects.toThrow('Request failed with status 404');
    });
  });
});
