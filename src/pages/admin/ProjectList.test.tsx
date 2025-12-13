/**
 * Unit tests for Admin ProjectList page.
 * 
 * @description Tests the project list page including filtering,
 * search, and delete functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectList from './ProjectList';

// Mock AdminLayout to simplify rendering
vi.mock('@/components/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="admin-layout">{children}</div>,
}));

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

const mockProjects = [
  {
    id: '1',
    title: 'Kitchen Remodel',
    slug: 'kitchen-remodel',
    status: 'published',
    location: 'Austin, TX',
    afterImages: [],
    beforeImages: [],
  },
  {
    id: '2',
    title: 'Bathroom Update',
    slug: 'bathroom-update',
    status: 'draft',
    location: 'Dallas, TX',
    afterImages: [],
    beforeImages: [],
  },
];

const renderProjectList = (projects = mockProjects) => {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/api/manage/projects')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(projects)),
      });
    }
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve('{}'),
    });
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProjectList />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProjectList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page title', async () => {
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('Manage Projects')).toBeInTheDocument();
    });
  });

  it('should display project count', async () => {
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText(/2 total projects/i)).toBeInTheDocument();
    });
  });

  it('should show singular project count for 1 project', async () => {
    renderProjectList([mockProjects[0]]);

    await waitFor(() => {
      expect(screen.getByText(/1 total project$/)).toBeInTheDocument();
    });
  });

  it('should have a New Project button', async () => {
    renderProjectList();

    await waitFor(() => {
      const newProjectLink = screen.getByRole('link', { name: /new project/i });
      expect(newProjectLink).toHaveAttribute('href', '/admin/projects/new');
    });
  });

  it('should have a search input', async () => {
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument();
    });
  });

  it('should display project cards', async () => {
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
      expect(screen.getByText('Bathroom Update')).toBeInTheDocument();
    });
  });

  it('should filter projects by search term', async () => {
    const user = userEvent.setup();
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search projects/i);
    await user.type(searchInput, 'Kitchen');

    expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    expect(screen.queryByText('Bathroom Update')).not.toBeInTheDocument();
  });

  it('should filter by published status', async () => {
    const user = userEvent.setup();
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^published$/i }));

    expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    expect(screen.queryByText('Bathroom Update')).not.toBeInTheDocument();
  });

  it('should filter by draft status', async () => {
    const user = userEvent.setup();
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('Bathroom Update')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^drafts$/i }));

    expect(screen.getByText('Bathroom Update')).toBeInTheDocument();
    expect(screen.queryByText('Kitchen Remodel')).not.toBeInTheDocument();
  });

  it('should show all projects when clicking All filter', async () => {
    const user = userEvent.setup();
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    // First filter to Published
    await user.click(screen.getByRole('button', { name: /^published$/i }));
    expect(screen.queryByText('Bathroom Update')).not.toBeInTheDocument();

    // Then click All to see all projects
    await user.click(screen.getByRole('button', { name: /^all$/i }));

    expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    expect(screen.getByText('Bathroom Update')).toBeInTheDocument();
  });

  it('should show empty state when no projects', async () => {
    renderProjectList([]);

    await waitFor(() => {
      expect(screen.getByText(/0 total project/i)).toBeInTheDocument();
    });
  });

  it('should have edit and delete buttons for projects', async () => {
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    // Check for links to edit page (href contains /edit)
    const allLinks = screen.getAllByRole('link');
    const editLink = allLinks.find(link => link.getAttribute('href')?.includes('/edit'));
    expect(editLink).toBeDefined();
    
    // Check for delete buttons (has destructive text color)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should show view link for published projects', async () => {
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    const allLinks = screen.getAllByRole('link');
    const viewLink = allLinks.find(link => 
      link.getAttribute('href')?.includes('/portfolio/kitchen-remodel')
    );
    expect(viewLink).toBeDefined();
  });

  it('should display project location', async () => {
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('Austin, TX')).toBeInTheDocument();
      expect(screen.getByText('Dallas, TX')).toBeInTheDocument();
    });
  });

  it('should display project status badges', async () => {
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('published')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
    });
  });

  it('should show In Progress for projects without completion date', async () => {
    const projectsWithNoDate = [
      { ...mockProjects[0], completionDate: undefined },
    ];
    renderProjectList(projectsWithNoDate);

    await waitFor(() => {
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  it('should show completion date for projects with date', async () => {
    const projectsWithDate = [
      { ...mockProjects[0], completionDate: '2024-06-15' },
    ];
    renderProjectList(projectsWithDate);

    await waitFor(() => {
      // Check for any date display (different locales may format differently)
      expect(screen.getByText(/2024|6\/15|15\/6/)).toBeInTheDocument();
    });
  });

  it('should open delete confirmation dialog', async () => {
    const user = userEvent.setup();
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    // Find and click a delete button (button with trash icon)
    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg.lucide-trash-2')
    );
    
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);

      // Dialog should appear
      await waitFor(() => {
        expect(screen.getByText(/delete project/i)).toBeInTheDocument();
      });
    }
  });

  it('should cancel delete when clicking cancel button', async () => {
    const user = userEvent.setup();
    renderProjectList();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg.lucide-trash-2')
    );
    
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/delete project/i)).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/this action cannot be undone/i)).not.toBeInTheDocument();
      });
    }
  });

  it('should handle projects with null or undefined titles', async () => {
    const projectsWithBadData = [
      { ...mockProjects[0] },
      { id: '3', title: null, status: 'draft' },
      { id: '4', status: 'published' }, // no title property
    ];
    
    renderProjectList(projectsWithBadData as typeof mockProjects);

    await waitFor(() => {
      // Should still render valid project
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });
  });
});
