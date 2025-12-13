/**
 * Unit tests for Footer component.
 * 
 * @description Tests the Footer component renders correctly with
 * all expected sections: logo, services, contact info, and copyright.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';
import { checkA11y } from '@/test/a11y-utils';

const renderFooter = () => {
  return render(
    <BrowserRouter>
      <Footer />
    </BrowserRouter>
  );
};

describe('Footer', () => {
  it('should render the footer element', () => {
    renderFooter();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should display services section', () => {
    renderFooter();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Real Estate Investment')).toBeInTheDocument();
    expect(screen.getByText('Custom Home Building')).toBeInTheDocument();
    expect(screen.getByText('Property Development')).toBeInTheDocument();
    expect(screen.getByText('Major Renovations')).toBeInTheDocument();
  });

  it('should display contact section', () => {
    renderFooter();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('(214) 997-3361')).toBeInTheDocument();
  });

  it('should display email link', () => {
    renderFooter();
    const emailLink = screen.getByRole('link', { name: /contact@lbinvestmentsllc.com/i });
    expect(emailLink).toHaveAttribute('href', 'mailto:contact@lbinvestmentsllc.com');
  });

  it('should display copyright with current year', () => {
    renderFooter();
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    expect(screen.getByText(/Legacy Builders.*All rights reserved/i)).toBeInTheDocument();
  });

  it('should have accessible home link', () => {
    renderFooter();
    const homeLink = screen.getByRole('link', { name: /go to home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should have no accessibility violations', async () => {
    const view = renderFooter();
    const results = await checkA11y(view);
    expect(results).toHaveNoViolations();
  });
});
