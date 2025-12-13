/**
 * Unit tests for AdminLayout component.
 * 
 * @description Tests the AdminLayout component which provides
 * the sidebar navigation and layout structure for admin pages.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from './AdminLayout';
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

const mockUser = {
  userId: 'admin-123',
  userDetails: 'admin@example.com',
  identityProvider: 'aad',
  userRoles: ['authenticated', 'admin'],
};

const renderAdminLayout = (content = <div>Admin Content</div>) => {
  mockFetch.mockResolvedValue({
    json: () => Promise.resolve({ clientPrincipal: mockUser }),
  });

  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthProvider>
        <AdminLayout>{content}</AdminLayout>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the sidebar', async () => {
    renderAdminLayout();

    await waitFor(() => {
      const sidebar = document.querySelector('aside');
      expect(sidebar).toBeInTheDocument();
    });
  });

  it('should display navigation items', async () => {
    renderAdminLayout();

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });
  });

  it('should render children content', async () => {
    renderAdminLayout(<div>Test Admin Content</div>);

    await waitFor(() => {
      expect(screen.getByText('Test Admin Content')).toBeInTheDocument();
    });
  });

  it('should display user info', async () => {
    renderAdminLayout();

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });
  });

  it('should have logout button', async () => {
    renderAdminLayout();

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  it('should have a link back to home', async () => {
    renderAdminLayout();

    await waitFor(() => {
      const homeLink = screen.getByRole('link', { name: /view site/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  it('should have correct navigation links', async () => {
    renderAdminLayout();

    await waitFor(() => {
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      const projectsLink = screen.getByRole('link', { name: /projects/i });
      
      expect(dashboardLink).toHaveAttribute('href', '/admin');
      expect(projectsLink).toHaveAttribute('href', '/admin/projects');
    });
  });
});
