/**
 * Unit tests for Differentiators component.
 * 
 * @description Tests the Differentiators section renders correctly
 * with all feature cards.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Differentiators from './Differentiators';

const renderDifferentiators = () => {
  return render(
    <BrowserRouter>
      <Differentiators />
    </BrowserRouter>
  );
};

describe('Differentiators', () => {
  it('should render the about section', () => {
    renderDifferentiators();
    const section = document.getElementById('about');
    expect(section).toBeInTheDocument();
  });

  it('should display the section heading', () => {
    renderDifferentiators();
    expect(screen.getByText(/Why Choose Legacy Builders/i)).toBeInTheDocument();
  });

  it('should display the section description', () => {
    renderDifferentiators();
    expect(screen.getByText(/professional development and construction firm/i)).toBeInTheDocument();
  });

  it('should display Fast Execution feature', () => {
    renderDifferentiators();
    expect(screen.getByText('Fast Execution')).toBeInTheDocument();
    expect(screen.getByText(/We move quickly without cutting corners/i)).toBeInTheDocument();
  });

  it('should display Budget Discipline feature', () => {
    renderDifferentiators();
    expect(screen.getByText('Budget Discipline')).toBeInTheDocument();
    expect(screen.getByText(/Fixed pricing.*No change-order games/i)).toBeInTheDocument();
  });

  it('should display Total Transparency feature', () => {
    renderDifferentiators();
    expect(screen.getByText('Total Transparency')).toBeInTheDocument();
    expect(screen.getByText(/Clear communication at every phase/i)).toBeInTheDocument();
  });
});
