/**
 * Unit tests for CallToAction component.
 * 
 * @description Tests the CallToAction section renders correctly
 * with contact information and form.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CallToAction from './CallToAction';
import { checkA11y } from '@/test/a11y-utils';

// Mock ContactForm to simplify testing
vi.mock('./ContactForm', () => ({
  default: () => <div data-testid="contact-form">Contact Form</div>,
}));

const renderCallToAction = () => {
  return render(
    <BrowserRouter>
      <CallToAction />
    </BrowserRouter>
  );
};

describe('CallToAction', () => {
  it('should render the contact section', () => {
    renderCallToAction();
    const section = document.getElementById('contact');
    expect(section).toBeInTheDocument();
  });

  it('should display the heading', () => {
    renderCallToAction();
    expect(screen.getByText(/Ready to Build Your Legacy/i)).toBeInTheDocument();
  });

  it('should display phone number', () => {
    renderCallToAction();
    expect(screen.getByText('(214) 997-3361')).toBeInTheDocument();
    expect(screen.getByText('Call Us')).toBeInTheDocument();
  });

  it('should display email', () => {
    renderCallToAction();
    expect(screen.getByText('Email Us')).toBeInTheDocument();
    const emailLink = screen.getByRole('link', { name: /contact@lbinvestmentsllc.com/i });
    expect(emailLink).toHaveAttribute('href', 'mailto:contact@lbinvestmentsllc.com');
  });

  it('should render the contact form', () => {
    renderCallToAction();
    expect(screen.getByTestId('contact-form')).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const view = renderCallToAction();
    const results = await checkA11y(view);
    expect(results).toHaveNoViolations();
  });
});
