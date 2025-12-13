import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectCard from './ProjectCard';
import type { Project } from '@/types/project';
import { checkA11y } from '@/test/a11y-utils';

// Helper to create a mock project with required fields
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: '1',
  title: 'Kitchen Remodel',
  slug: 'kitchen-remodel',
  location: 'Austin, TX',
  shortDescription: 'A beautiful kitchen transformation',
  fullDescription: 'Full description here',
  scopeOfWork: 'Complete kitchen renovation',
  challenges: 'Working with existing plumbing',
  outcomes: 'Beautiful new kitchen',
  purchaseDate: '2024-01-01',
  completionDate: '2024-06-15',
  budget: 50000,
  finalCost: 48000,
  squareFootage: 200,
  status: 'published',
  beforeImages: [],
  afterImages: ['https://example.com/after1.jpg'],
  primaryBeforeImage: '',
  primaryAfterImage: 'https://example.com/after1.jpg',
  createdAt: '2024-01-01',
  updatedAt: '2024-06-15',
  ...overrides,
});

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProjectCard', () => {
  it('should render project title', () => {
    const project = createMockProject({ title: 'Master Bath Renovation' });
    
    renderWithRouter(<ProjectCard project={project} />);
    
    expect(screen.getByText('Master Bath Renovation')).toBeInTheDocument();
  });

  it('should render project location', () => {
    const project = createMockProject({ location: 'Dallas, TX' });
    
    renderWithRouter(<ProjectCard project={project} />);
    
    expect(screen.getByText('Dallas, TX')).toBeInTheDocument();
  });

  it('should render short description', () => {
    const project = createMockProject({ 
      shortDescription: 'Complete bathroom overhaul with modern fixtures' 
    });
    
    renderWithRouter(<ProjectCard project={project} />);
    
    expect(screen.getByText('Complete bathroom overhaul with modern fixtures')).toBeInTheDocument();
  });

  it('should format completion date correctly', () => {
    const project = createMockProject({ completionDate: '2024-03-15' });
    
    renderWithRouter(<ProjectCard project={project} />);
    
    expect(screen.getByText('Mar 2024')).toBeInTheDocument();
  });

  it('should show "In Progress" when no completion date', () => {
    const project = createMockProject({ completionDate: undefined });
    
    renderWithRouter(<ProjectCard project={project} />);
    
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should link to project detail page', () => {
    const project = createMockProject({ slug: 'my-project' });
    
    renderWithRouter(<ProjectCard project={project} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/portfolio/my-project');
  });

  it('should display "View Details" call to action', () => {
    const project = createMockProject();
    
    renderWithRouter(<ProjectCard project={project} />);
    
    expect(screen.getByText('View Details →')).toBeInTheDocument();
  });

  it('should render primary after image when available', () => {
    const project = createMockProject({ 
      primaryAfterImage: 'https://example.com/primary.jpg',
      afterImages: ['https://example.com/other.jpg'],
    });
    
    renderWithRouter(<ProjectCard project={project} />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/primary.jpg');
  });

  it('should fall back to first after image when no primary', () => {
    const project = createMockProject({
      primaryAfterImage: null,
      afterImages: ['https://example.com/first.jpg', 'https://example.com/second.jpg'],
    });

    renderWithRouter(<ProjectCard project={project} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/first.jpg');
  });

  it('should have no accessibility violations', async () => {
    const project = createMockProject();
    const view = render(<BrowserRouter><ProjectCard project={project} /></BrowserRouter>);
    const results = await checkA11y(view);
    expect(results).toHaveNoViolations();
  });
});
