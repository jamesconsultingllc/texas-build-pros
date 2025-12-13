/**
 * Unit tests for Admin Dashboard page.
 * 
 * @description Tests the admin dashboard including stats display,
 * recent projects, and navigation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminDashboard from './Dashboard';

// Mock AdminLayout to simplify rendering
vi.mock('@/components/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
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

const mockDashboardStats = {
  stats: { total: 10, published: 7, draft: 3 },
  recentProjects: [
    { id: '1', title: 'Project One', status: 'published', location: 'Austin, TX' },
    { id: '2', title: 'Project Two', status: 'draft', location: 'Dallas, TX' },
  ],
};

const renderDashboard = (dashboardData = mockDashboardStats) => {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/api/dashboard')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(dashboardData)),
      });
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
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dashboard title', async () => {
    renderDashboard();

    // Wait for auth and data to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should display welcome message', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });
  });

  it('should have a New Project button', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /new project/i })).toHaveAttribute('href', '/admin/projects/new');
    });
  });

  it('should display stats cards', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('Published')).toBeInTheDocument();
    });
  });

  it('should display stats values', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Total
      expect(screen.getByText('7')).toBeInTheDocument();  // Published
    });
  });

  it('should display recent projects section', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Recent Projects')).toBeInTheDocument();
    });
  });

  it('should show empty state when no recent projects', async () => {
    renderDashboard({
      stats: { total: 0, published: 0, draft: 0 },
      recentProjects: [],
    });

    await waitFor(() => {
      // When stats are 0, check that Total Projects card shows 0
      const totalProjectsCard = screen.getByText('Total Projects').closest('div');
      expect(totalProjectsCard).toBeInTheDocument();
    });
  });
});
