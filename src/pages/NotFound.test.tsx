/**
 * Unit tests for NotFound page.
 * 
 * @description Tests the 404 Not Found page renders correctly.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from './NotFound';
import { checkA11y } from '@/test/a11y-utils';

const renderNotFound = () => {
  return render(
    <BrowserRouter>
      <NotFound />
    </BrowserRouter>
  );
};

describe('NotFound Page', () => {
  it('should render 404 message', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('should display not found message', () => {
    renderNotFound();
    expect(screen.getByText(/page not found/i) || screen.getByText(/Oops/i)).toBeTruthy();
  });

  it('should have a link to return home', () => {
    renderNotFound();
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should have no accessibility violations', async () => {
    const view = renderNotFound();
    const results = await checkA11y(view);
    expect(results).toHaveNoViolations();
  });
});
