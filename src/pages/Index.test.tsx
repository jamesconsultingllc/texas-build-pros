/**
 * Unit tests for Index (Home) page.
 * 
 * @description Tests the Index page renders all major sections
 * including Header, Hero, Services, and Footer.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from './Index';
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

// Mock fetch for auth
global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ clientPrincipal: null }),
});

const renderIndex = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Index />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Index Page', () => {
  it('should render without crashing', () => {
    renderIndex();
    expect(document.body).toBeInTheDocument();
  });

  it('should render the header', () => {
    renderIndex();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should render the hero section', () => {
    renderIndex();
    expect(screen.getByText(/Building Legacies/i)).toBeInTheDocument();
  });

  it('should render the services section', () => {
    renderIndex();
    expect(screen.getByText('What We Do')).toBeInTheDocument();
  });

  it('should render the footer', () => {
    renderIndex();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should have proper page structure', () => {
    const { container } = renderIndex();
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
  });
});
