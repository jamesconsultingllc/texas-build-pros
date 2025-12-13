/**
 * Unit tests for Services component.
 * 
 * @description Tests the Services section renders correctly with
 * all service cards and their content.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Services from './Services';
import { checkA11y } from '@/test/a11y-utils';

const renderServices = () => {
  return render(
    <BrowserRouter>
      <Services />
    </BrowserRouter>
  );
};

describe('Services', () => {
  it('should render the services section', () => {
    renderServices();
    const section = document.getElementById('services');
    expect(section).toBeInTheDocument();
  });

  it('should display the section heading', () => {
    renderServices();
    expect(screen.getByText('What We Do')).toBeInTheDocument();
  });

  it('should display the section description', () => {
    renderServices();
    expect(screen.getByText(/Two core services.*One commitment to excellence/i)).toBeInTheDocument();
  });

  it('should display Real Estate Investment service card', () => {
    renderServices();
    expect(screen.getByText('Real Estate Investment')).toBeInTheDocument();
    expect(screen.getByText(/Strategic acquisitions/i)).toBeInTheDocument();
  });

  it('should display Custom Home Building service card', () => {
    renderServices();
    expect(screen.getByText('Custom Home Building')).toBeInTheDocument();
  });

  it('should list service features', () => {
    renderServices();
    expect(screen.getByText(/Property acquisition and market analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Value-add repositioning strategies/i)).toBeInTheDocument();
    expect(screen.getByText(/Spec home development for investors/i)).toBeInTheDocument();
  });

  it('should have no accessibility violations', async () => {
    const view = renderServices();
    const results = await checkA11y(view);
    expect(results).toHaveNoViolations();
  });
});
