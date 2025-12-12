/**
 * @fileoverview Unit tests for the ProjectForm page component.
 * Tests form rendering, validation, submission for create and edit modes.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProjectForm from './ProjectForm';
import * as projectHooks from '@/hooks/use-projects';
import type { Project } from '@/types/project';

// Mock the hooks module
vi.mock('@/hooks/use-projects');

// Mock AdminLayout to simplify testing
vi.mock('@/components/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout">{children}</div>
  ),
}));

// Mock ImageUpload component
vi.mock('@/components/ImageUpload', () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid="image-upload">{label}</div>
  ),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockProject: Project = {
  id: 'project-1',
  title: 'Test Project',
  location: 'Austin, TX',
  shortDescription: 'A test project description',
  fullDescription: 'Full description here',
  scopeOfWork: 'Scope details',
  challenges: 'Challenges faced',
  outcomes: 'Project outcomes',
  purchaseDate: '2024-01-01',
  completionDate: '2024-06-01',
  budget: 100000,
  finalCost: 95000,
  squareFootage: 2500,
  status: 'published',
  beforeImages: ['http://example.com/before1.jpg'],
  afterImages: ['http://example.com/after1.jpg'],
  primaryBeforeImage: 'http://example.com/before1.jpg',
  primaryAfterImage: 'http://example.com/after1.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

function renderProjectForm(id?: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const initialPath = id ? `/admin/projects/${id}` : '/admin/projects/new';

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin/projects/new" element={<ProjectForm />} />
          <Route path="/admin/projects/:id" element={<ProjectForm />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProjectForm', () => {
  const mockCreateProject = { mutateAsync: vi.fn(), isPending: false };
  const mockUpdateProject = { mutateAsync: vi.fn(), isPending: false };
  const mockUploadImage = { mutateAsync: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Default mock implementations
    vi.mocked(projectHooks.useAdminProject).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof projectHooks.useAdminProject>);

    vi.mocked(projectHooks.useCreateProject).mockReturnValue(
      mockCreateProject as unknown as ReturnType<typeof projectHooks.useCreateProject>
    );

    vi.mocked(projectHooks.useUpdateProject).mockReturnValue(
      mockUpdateProject as unknown as ReturnType<typeof projectHooks.useUpdateProject>
    );

    vi.mocked(projectHooks.useImageUpload).mockReturnValue(
      mockUploadImage as unknown as ReturnType<typeof projectHooks.useImageUpload>
    );
  });

  describe('Create Mode', () => {
    it('should render create form with empty fields', async () => {
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument();
      });

      expect(screen.getByText('Add a new project to your portfolio')).toBeInTheDocument();
      expect(screen.getByLabelText(/project title/i)).toHaveValue('');
      expect(screen.getByLabelText(/^location/i)).toHaveValue('');
    });

    it('should render all tabs', async () => {
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /basic info/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('tab', { name: /details/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /project data/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /images/i })).toBeInTheDocument();
    });

    it('should render action buttons', async () => {
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
    });

    it('should navigate to projects list on cancel', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/admin/projects');
    });

    it('should update form fields on input', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/project title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/project title/i);
      await user.type(titleInput, 'New Project Title');

      expect(titleInput).toHaveValue('New Project Title');
    });

    it('should show character count for short description', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByText('0 / 200 characters')).toBeInTheDocument();
      });

      const descInput = screen.getByLabelText(/short description/i);
      await user.type(descInput, 'Test description');

      expect(screen.getByText('16 / 200 characters')).toBeInTheDocument();
    });

    it('should show validation error when title is empty on save', async () => {
      const { toast } = await import('sonner');
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save draft/i }));

      expect(toast.error).toHaveBeenCalledWith('Project title is required');
    });
  });

  describe('Edit Mode', () => {
    it('should show loading spinner while loading project', async () => {
      vi.mocked(projectHooks.useAdminProject).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof projectHooks.useAdminProject>);

      renderProjectForm('project-1');

      expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
      // Loading spinner should be visible
      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });

    it('should populate form with existing project data', async () => {
      vi.mocked(projectHooks.useAdminProject).mockReturnValue({
        data: mockProject,
        isLoading: false,
        error: null,
      } as ReturnType<typeof projectHooks.useAdminProject>);

      renderProjectForm('project-1');

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      expect(screen.getByText('Update project details')).toBeInTheDocument();
      expect(screen.getByLabelText(/project title/i)).toHaveValue('Test Project');
      expect(screen.getByLabelText(/^location/i)).toHaveValue('Austin, TX');
    });

    it('should show edit mode header', async () => {
      vi.mocked(projectHooks.useAdminProject).mockReturnValue({
        data: mockProject,
        isLoading: false,
        error: null,
      } as ReturnType<typeof projectHooks.useAdminProject>);

      renderProjectForm('project-1');

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
        expect(screen.getByText('Update project details')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Details tab', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /details/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /details/i }));

      expect(screen.getByLabelText(/full description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/scope of work/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/challenges/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/outcomes/i)).toBeInTheDocument();
    });

    it('should switch to Project Data tab', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /project data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /project data/i }));

      expect(screen.getByLabelText(/purchase date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/completion date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/budget/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/final cost/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/square footage/i)).toBeInTheDocument();
    });

    it('should switch to Images tab', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /images/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /images/i }));

      expect(screen.getByText('Before Images')).toBeInTheDocument();
      expect(screen.getByText('After Images *')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call createProject on save draft in create mode', async () => {
      const user = userEvent.setup();
      mockCreateProject.mutateAsync.mockResolvedValue({ id: 'new-project' });

      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/project title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/project title/i), 'New Project');
      await user.click(screen.getByRole('button', { name: /save draft/i }));

      await waitFor(() => {
        expect(mockCreateProject.mutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Project',
            status: 'draft',
          })
        );
      });
    });

    it('should validate required fields before publishing', async () => {
      const { toast } = await import('sonner');
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/project title/i)).toBeInTheDocument();
      });

      // Fill only title, missing location and description
      await user.type(screen.getByLabelText(/project title/i), 'New Project');
      await user.click(screen.getByRole('button', { name: /publish/i }));

      expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields before publishing');
    });

    it('should call updateProject on save in edit mode', async () => {
      const user = userEvent.setup();
      mockUpdateProject.mutateAsync.mockResolvedValue({ id: 'project-1' });

      vi.mocked(projectHooks.useAdminProject).mockReturnValue({
        data: mockProject,
        isLoading: false,
        error: null,
      } as ReturnType<typeof projectHooks.useAdminProject>);

      renderProjectForm('project-1');

      await waitFor(() => {
        expect(screen.getByLabelText(/project title/i)).toHaveValue('Test Project');
      });

      // Modify title
      const titleInput = screen.getByLabelText(/project title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');
      
      await user.click(screen.getByRole('button', { name: /save draft/i }));

      await waitFor(() => {
        expect(mockUpdateProject.mutateAsync).toHaveBeenCalledWith({
          id: 'project-1',
          data: expect.objectContaining({
            title: 'Updated Title',
            status: 'draft',
          }),
        });
      });
    });

    it('should show saving state when submission is pending', async () => {
      const pendingCreateProject = { mutateAsync: vi.fn(), isPending: true };
      vi.mocked(projectHooks.useCreateProject).mockReturnValue(
        pendingCreateProject as unknown as ReturnType<typeof projectHooks.useCreateProject>
      );

      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
      });

      // Buttons should be disabled
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /save draft/i })).toBeDisabled();
    });
  });

  describe('Status Toggle', () => {
    it('should toggle publish status with switch', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/publish immediately/i)).toBeInTheDocument();
      });

      const toggle = screen.getByRole('switch');
      expect(toggle).not.toBeChecked();

      await user.click(toggle);

      expect(toggle).toBeChecked();
    });

    it('should reflect published status from existing project', async () => {
      vi.mocked(projectHooks.useAdminProject).mockReturnValue({
        data: mockProject, // status: 'published'
        isLoading: false,
        error: null,
      } as ReturnType<typeof projectHooks.useAdminProject>);

      renderProjectForm('project-1');

      await waitFor(() => {
        const toggle = screen.getByRole('switch');
        expect(toggle).toBeChecked();
      });
    });
  });

  describe('Data Fields', () => {
    it('should update numeric fields correctly', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      // Navigate to Project Data tab
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /project data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /project data/i }));

      const budgetInput = screen.getByLabelText(/budget/i);
      await user.type(budgetInput, '150000');

      expect(budgetInput).toHaveValue(150000);
    });

    it('should update date fields correctly', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      // Navigate to Project Data tab
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /project data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /project data/i }));

      const purchaseDateInput = screen.getByLabelText(/purchase date/i);
      fireEvent.change(purchaseDateInput, { target: { value: '2024-03-15' } });

      expect(purchaseDateInput).toHaveValue('2024-03-15');
    });

    it('should update final cost field', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /project data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /project data/i }));

      const finalCostInput = screen.getByLabelText(/final cost/i);
      await user.type(finalCostInput, '95000');

      expect(finalCostInput).toHaveValue(95000);
    });

    it('should update square footage field', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /project data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /project data/i }));

      const sqftInput = screen.getByLabelText(/square footage/i);
      await user.type(sqftInput, '2500');

      expect(sqftInput).toHaveValue(2500);
    });

    it('should update completion date field', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /project data/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /project data/i }));

      const completionDateInput = screen.getByLabelText(/completion date/i);
      fireEvent.change(completionDateInput, { target: { value: '2024-12-31' } });

      expect(completionDateInput).toHaveValue('2024-12-31');
    });
  });

  describe('Details Tab Fields', () => {
    it('should update full description', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /details/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /details/i }));

      const fullDescInput = screen.getByLabelText(/full description/i);
      await user.type(fullDescInput, 'This is a full description');

      expect(fullDescInput).toHaveValue('This is a full description');
    });

    it('should update scope of work', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /details/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /details/i }));

      const scopeInput = screen.getByLabelText(/scope of work/i);
      await user.type(scopeInput, 'Kitchen renovation');

      expect(scopeInput).toHaveValue('Kitchen renovation');
    });

    it('should update challenges', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /details/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /details/i }));

      const challengesInput = screen.getByLabelText(/challenges/i);
      await user.type(challengesInput, 'Tight timeline');

      expect(challengesInput).toHaveValue('Tight timeline');
    });

    it('should update outcomes', async () => {
      const user = userEvent.setup();
      renderProjectForm();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /details/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /details/i }));

      const outcomesInput = screen.getByLabelText(/outcomes/i);
      await user.type(outcomesInput, 'Client satisfied');

      expect(outcomesInput).toHaveValue('Client satisfied');
    });
  });
});
