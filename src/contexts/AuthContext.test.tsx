/**
 * Unit tests for AuthContext.
 * 
 * @description Tests authentication context including user state,
 * login/logout actions, and admin role detection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

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

// Store original location
const originalLocation = window.location;

// Test component that uses auth context
const TestAuthConsumer = () => {
  const { user, isLoading, isAdmin, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.userDetails : 'no-user'}</div>
      <div data-testid="is-admin">{isAdmin ? 'admin' : 'not-admin'}</div>
      <button onClick={login} data-testid="login-btn">Login</button>
      <button onClick={logout} data-testid="logout-btn">Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location using Object.defineProperty
    Object.defineProperty(window, 'location', {
      value: { 
        ...originalLocation,
        href: 'http://localhost:4280/',
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.resetAllMocks();
  });

  describe('AuthProvider', () => {
    it('should show loading state initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('should set user when authenticated', async () => {
      const mockUser = {
        userId: 'user-123',
        userDetails: 'test@example.com',
        identityProvider: 'aad',
        userRoles: ['authenticated', 'anonymous'],
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ clientPrincipal: mockUser }),
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('not-admin');
    });

    it('should detect admin role', async () => {
      const mockAdminUser = {
        userId: 'admin-123',
        userDetails: 'admin@example.com',
        identityProvider: 'aad',
        userRoles: ['authenticated', 'admin'],
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ clientPrincipal: mockAdminUser }),
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-admin')).toHaveTextContent('admin');
      });
    });

    it('should handle unauthenticated state', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ clientPrincipal: null }),
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    it('should handle auth check failure gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
  });

  describe('login', () => {
    it('should redirect to Azure AD login', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ clientPrincipal: null }),
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByTestId('login-btn'));

      expect(window.location.href).toBe('/.auth/login/aad');
    });
  });

  describe('logout', () => {
    it('should redirect to logout endpoint', async () => {
      const user = userEvent.setup();
      
      const mockUser = {
        userId: 'user-123',
        userDetails: 'test@example.com',
        identityProvider: 'aad',
        userRoles: ['authenticated'],
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ clientPrincipal: mockUser }),
      });

      render(
        <AuthProvider>
          <TestAuthConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      await user.click(screen.getByTestId('logout-btn'));

      expect(window.location.href).toBe('/.auth/logout');
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestAuthConsumer />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });
});
