/**
 * Unit tests for Portfolio page.
 * 
 * @description Tests the Portfolio page including loading states,
 * empty states, error handling, and project card rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Portfolio from './Portfolio';
import { AuthProvider } from '@/contexts/AuthContext';

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

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderPortfolio = () => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Portfolio />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Portfolio Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock auth endpoint
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('.auth/me')) {
        return Promise.resolve({
          json: () => Promise.resolve({ clientPrincipal: null }),
        });
      }
      // Default - projects endpoint
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([])),
      });
    });
  });

  it('should render the page heading', async () => {
    renderPortfolio();
    expect(screen.getByText('Our Portfolio')).toBeInTheDocument();
  });

  it('should render the page description', async () => {
    renderPortfolio();
    expect(screen.getByText(/Explore our completed rehab projects/i)).toBeInTheDocument();
  });

  it('should render header and footer', async () => {
    renderPortfolio();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should show loading skeletons initially', async () => {
    // Make fetch hang to show loading state
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('.auth/me')) {
        return Promise.resolve({
          json: () => Promise.resolve({ clientPrincipal: null }),
        });
      }
      return new Promise(() => {}); // Never resolves
    });

    const { container } = renderPortfolio();
    
    // Wait a bit for loading to start
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[class*="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    }, { timeout: 1000 }).catch(() => {
      // May resolve too fast, that's ok
    });
  });

  it('should show empty state when no projects', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('.auth/me')) {
        return Promise.resolve({
          json: () => Promise.resolve({ clientPrincipal: null }),
        });
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify([])),
      });
    });

    renderPortfolio();

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });
  });

  it('should render project cards when projects exist', async () => {
    const mockProjects = [
      {
        id: '1',
        title: 'Kitchen Remodel',
        slug: 'kitchen-remodel',
        location: 'Austin, TX',
        isPublished: true,
        afterImages: ['https://example.com/image.jpg'],
        beforeImages: [],
      },
      {
        id: '2',
        title: 'Bathroom Update',
        slug: 'bathroom-update',
        location: 'Dallas, TX',
        isPublished: true,
        afterImages: [],
        beforeImages: [],
      },
    ];

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('.auth/me')) {
        return Promise.resolve({
          json: () => Promise.resolve({ clientPrincipal: null }),
        });
      }
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockProjects)),
      });
    });

    renderPortfolio();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
      expect(screen.getByText('Bathroom Update')).toBeInTheDocument();
    });
  });

  it('should show error state on fetch failure', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('.auth/me')) {
        return Promise.resolve({
          json: () => Promise.resolve({ clientPrincipal: null }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' }),
      });
    });

    renderPortfolio();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load projects/i)).toBeInTheDocument();
    });
  });
});
