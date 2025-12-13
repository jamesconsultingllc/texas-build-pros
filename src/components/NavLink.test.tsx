/**
 * Unit tests for NavLink component.
 * 
 * @description Tests the NavLink wrapper component that adds
 * className support for active/pending states.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NavLink } from './NavLink';
import { checkA11y } from '@/test/a11y-utils';

describe('NavLink', () => {
  it('should render a link with correct text', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test">Test Link</NavLink>
      </MemoryRouter>
    );

    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('should have the correct href', () => {
    render(
      <MemoryRouter>
        <NavLink to="/about">About</NavLink>
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: 'About' });
    expect(link).toHaveAttribute('href', '/about');
  });

  it('should apply base className', () => {
    render(
      <MemoryRouter>
        <NavLink to="/test" className="base-class">Test</NavLink>
      </MemoryRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('base-class');
  });

  it('should apply activeClassName when active', () => {
    render(
      <MemoryRouter initialEntries={['/active']}>
        <NavLink to="/active" className="base" activeClassName="active-class">
          Active Link
        </NavLink>
      </MemoryRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveClass('active-class');
  });

  it('should not apply activeClassName when not active', () => {
    render(
      <MemoryRouter initialEntries={['/other']}>
        <NavLink to="/different" className="base" activeClassName="active-class">
          Inactive Link
        </NavLink>
      </MemoryRouter>
    );

    const link = screen.getByRole('link');
    expect(link).not.toHaveClass('active-class');
  });

  it('should have no accessibility violations', async () => {
    const view = render(
      <MemoryRouter>
        <NavLink to="/test">Test Link</NavLink>
      </MemoryRouter>
    );
    const results = await checkA11y(view);
    expect(results).toHaveNoViolations();
  });
});
