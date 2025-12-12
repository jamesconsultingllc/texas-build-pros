/**
 * Unit tests for ProtectedRoute component.
 * 
 * @description Tests the ProtectedRoute component which handles
 * authentication checks and access control for admin routes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
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

const ProtectedContent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

const renderWithAuth = (authState: { user: object | null; isAdmin: boolean }) => {
  const mockUser = authState.user ? {
    userId: 'user-123',
    userDetails: 'test@example.com',
    identityProvider: 'aad',
    userRoles: authState.isAdmin ? ['authenticated', 'admin'] : ['authenticated'],
    ...(authState.user as object),
  } : null;

  mockFetch.mockResolvedValue({
    json: () => Promise.resolve({ clientPrincipal: mockUser }),
  });

  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner while checking auth', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should show loading state (spinner)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', async () => {
    renderWithAuth({ user: null, isAdmin: false });

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('should show access denied for non-admin users', async () => {
    renderWithAuth({ user: { userId: '123' }, isAdmin: false });

    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to home/i })).toHaveAttribute('href', '/');
  });

  it('should render protected content for admin users', async () => {
    renderWithAuth({ user: { userId: '123' }, isAdmin: true });

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
