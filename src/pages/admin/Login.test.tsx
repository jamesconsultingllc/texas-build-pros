/**
 * Unit tests for Admin Login page.
 * 
 * @description Tests the admin login page including authentication states
 * and redirect behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminLogin from './Login';
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

const AdminDashboard = () => <div>Admin Dashboard</div>;

const renderLogin = (isAuthenticated = false) => {
  const mockUser = isAuthenticated ? {
    userId: 'user-123',
    userDetails: 'test@example.com',
    identityProvider: 'aad',
    userRoles: ['authenticated', 'admin'],
  } : null;

  mockFetch.mockResolvedValue({
    json: () => Promise.resolve({ clientPrincipal: mockUser }),
  });

  return render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner while checking auth', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AuthProvider>
          <AdminLogin />
        </AuthProvider>
      </MemoryRouter>
    );

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render login card for unauthenticated users', async () => {
    renderLogin(false);

    await waitFor(() => {
      expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    });

    expect(screen.getByText(/Sign in with your Microsoft account/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with microsoft/i })).toBeInTheDocument();
  });

  it('should have return home link', async () => {
    renderLogin(false);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /return to home/i })).toHaveAttribute('href', '/');
    });
  });

  it('should redirect to admin dashboard when authenticated', async () => {
    renderLogin(true);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });
});
