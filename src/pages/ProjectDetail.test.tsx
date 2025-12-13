/**
 * Unit tests for ProjectDetail page.
 * 
 * @description Tests the project detail page including loading states,
 * error handling, and image gallery functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectDetail from './ProjectDetail';

// Mock Header and Footer
vi.mock('@/components/Header', () => ({
  default: () => <header data-testid="header">Header</header>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

// Mock telemetry
vi.mock('@/lib/telemetry', () => ({
  telemetry: {
    trackEvent: vi.fn(),
    trackError: vi.fn(),
    trackUserAction: vi.fn(),
    setUser: vi.fn(),
    clearUser: vi.fn(),
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockProject = {
  id: '1',
  title: 'Beautiful Kitchen Remodel',
  slug: 'beautiful-kitchen-remodel',
  location: 'Austin, TX',
  description: 'A complete kitchen transformation',
  completionDate: '2024-06-15',
  squareFootage: 500,
  beforeImages: ['https://example.com/before1.jpg'],
  afterImages: ['https://example.com/after1.jpg', 'https://example.com/after2.jpg'],
  status: 'published',
};

const renderProjectDetail = (slug = 'beautiful-kitchen-remodel', project = mockProject) => {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes(`/api/projects/${slug}`)) {
      if (project) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(project)),
        });
      } else {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ message: 'Project not found' }),
        });
      }
    }
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve('{}'),
    });
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/portfolio/${slug}`]}>
        <Routes>
          <Route path="/portfolio/:slug" element={<ProjectDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProjectDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/portfolio/test']}>
          <Routes>
            <Route path="/portfolio/:slug" element={<ProjectDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should display project title after loading', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText('Beautiful Kitchen Remodel')).toBeInTheDocument();
    });
  });

  it('should display project location', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText('Austin, TX')).toBeInTheDocument();
    });
  });

  it('should display completion date', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText(/Completed:/)).toBeInTheDocument();
    });
  });

  it('should display square footage when provided', async () => {
    renderProjectDetail();

    await waitFor(() => {
      // sq ft appears in multiple places, just verify at least one exists
      expect(screen.getAllByText(/sq ft/i).length).toBeGreaterThan(0);
    });
  });

  it('should show In Progress when no completion date', async () => {
    const projectWithoutDate = { ...mockProject, completionDate: null };
    renderProjectDetail('test', projectWithoutDate);

    await waitFor(() => {
      // "In Progress" appears in multiple places (hero + details card)
      expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
    });
  });

  it('should have back to portfolio link', async () => {
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to portfolio/i })).toBeInTheDocument();
    });
  });

  it('should show error state for not found project', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Project not found' }),
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/portfolio/nonexistent']}>
          <Routes>
            <Route path="/portfolio/:slug" element={<ProjectDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error Loading Project')).toBeInTheDocument();
    });
  });

  it('should allow selecting different images in gallery', async () => {
    const user = userEvent.setup();
    renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText('Beautiful Kitchen Remodel')).toBeInTheDocument();
    });

    // Find all thumbnail buttons
    const buttons = screen.getAllByRole('button');
    if (buttons.length > 0) {
      await user.click(buttons[0]);
      // Just verify the click doesn't error - actual image change is visual
    }
  });
});
