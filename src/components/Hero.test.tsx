/**
 * Unit tests for Hero component.
 * 
 * @description Tests the Hero section renders correctly with
 * heading, description, and call-to-action buttons.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Hero from './Hero';

const renderHero = () => {
  return render(
    <BrowserRouter>
      <Hero />
    </BrowserRouter>
  );
};

describe('Hero', () => {
  it('should render the hero section', () => {
    renderHero();
    // Section element is rendered
    const section = document.querySelector('section');
    expect(section).toBeInTheDocument();
  });

  it('should display the main heading', () => {
    renderHero();
    expect(screen.getByText(/Building Legacies/i)).toBeInTheDocument();
    expect(screen.getByText(/Delivering Results/i)).toBeInTheDocument();
  });

  it('should display the description text', () => {
    renderHero();
    expect(screen.getByText(/Strategic real estate investment/i)).toBeInTheDocument();
  });

  it('should have a Start Your Project CTA button', () => {
    renderHero();
    const ctaLink = screen.getByRole('link', { name: /Start Your Project/i });
    expect(ctaLink).toHaveAttribute('href', '#contact');
  });

  it('should have a View Our Work button', () => {
    renderHero();
    const portfolioLink = screen.getByRole('link', { name: /View Our Work/i });
    expect(portfolioLink).toHaveAttribute('href', '/portfolio');
  });
});
