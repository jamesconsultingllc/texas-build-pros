import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import ImageUpload from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ProjectFormData } from '@/types/project';
import { useAdminProject, useCreateProject, useUpdateProject, useImageUpload } from '@/hooks/use-projects';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
}

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Hooks
  const { data: existingProject, isLoading } = useAdminProject(id);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const uploadImage = useImageUpload();

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    location: '',
    shortDescription: '',
    fullDescription: '',
    scopeOfWork: '',
    challenges: '',
    outcomes: '',
    purchaseDate: '',
    completionDate: '',
    budget: 0,
    finalCost: 0,
    squareFootage: 0,
    status: 'draft',
  });

  const [beforeImages, setBeforeImages] = useState<UploadedImage[]>([]);
  const [afterImages, setAfterImages] = useState<UploadedImage[]>([]);

  // Load existing project data when editing
  useEffect(() => {
    if (existingProject) {
      setFormData({
        title: existingProject.title,
        location: existingProject.location,
        shortDescription: existingProject.shortDescription,
        fullDescription: existingProject.fullDescription,
        scopeOfWork: existingProject.scopeOfWork,
        challenges: existingProject.challenges,
        outcomes: existingProject.outcomes,
        purchaseDate: existingProject.purchaseDate,
        completionDate: existingProject.completionDate,
        budget: existingProject.budget,
        finalCost: existingProject.finalCost,
        squareFootage: existingProject.squareFootage,
        status: existingProject.status === 'archived' ? 'draft' : existingProject.status,
      });
      // TODO: Load existing images from project data
    }
  }, [existingProject]);

  const handleSubmit = async (publishNow: boolean) => {
    // Title is always required (for both draft and publish)
    if (!formData.title) {
      toast.error('Project title is required');
      return;
    }

    // Additional validation when publishing
    if (publishNow) {
      if (!formData.location || !formData.shortDescription) {
        toast.error('Please fill in all required fields before publishing');
        return;
      }

      if (afterImages.length === 0) {
        toast.error('Please upload at least one after image before publishing');
        return;
      }
    }

    try {
      const submitData: ProjectFormData = {
        ...formData,
        status: publishNow ? 'published' : 'draft',
      };

      // TODO: Upload images first if there are new images
      // For now, we'll save without images and implement image upload separately

      if (isEditing && id) {
        await updateProject.mutateAsync({ id, data: submitData });
      } else {
        await createProject.mutateAsync(submitData);
      }

      // Success toasts and navigation are handled by the mutation hooks
    } catch (error) {
      // Error toasts are handled by the mutation hooks
      // Additional error handling can be done here if needed
      console.error('Failed to save project:', error);
    }
  };

  const isSaving = createProject.isPending || updateProject.isPending;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEditing ? 'Edit Project' : 'Create New Project'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing ? 'Update project details' : 'Add a new project to your portfolio'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/projects')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={isSaving}
            >
              Save Draft
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              disabled={isSaving}
              className="bg-gold hover:bg-gold-light"
            >
              {isSaving ? 'Saving...' : 'Publish'}
            </Button>
          </div>
        </div>

        {/* Form */}
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="data">Project Data</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          {/* Basic Information */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Modern Downtown Renovation"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Austin, TX"
                  />
                </div>

                <div>
                  <Label htmlFor="shortDescription">
                    Short Description * <span className="text-muted-foreground">(~200 characters)</span>
                  </Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, shortDescription: e.target.value })
                    }
                    placeholder="Brief summary for the portfolio card..."
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.shortDescription.length} / 200 characters
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={formData.status === 'published'}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, status: checked ? 'published' : 'draft' })
                    }
                  />
                  <Label htmlFor="status">Publish immediately</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Details */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="fullDescription">Full Description</Label>
                  <Textarea
                    id="fullDescription"
                    value={formData.fullDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, fullDescription: e.target.value })
                    }
                    placeholder="Detailed project description..."
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="scopeOfWork">Scope of Work</Label>
                  <Textarea
                    id="scopeOfWork"
                    value={formData.scopeOfWork}
                    onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })}
                    placeholder="What work was included in this project..."
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="challenges">Challenges & Solutions</Label>
                  <Textarea
                    id="challenges"
                    value={formData.challenges}
                    onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                    placeholder="Challenges faced and how they were solved..."
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="outcomes">Outcomes</Label>
                  <Textarea
                    id="outcomes"
                    value={formData.outcomes}
                    onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
                    placeholder="Results and outcomes of the project..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Project Data */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Project Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) =>
                        setFormData({ ...formData, purchaseDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="completionDate">Completion Date</Label>
                    <Input
                      id="completionDate"
                      type="date"
                      value={formData.completionDate}
                      onChange={(e) =>
                        setFormData({ ...formData, completionDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="budget">Budget / Investment ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: Number(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="finalCost">Final Cost ($)</Label>
                    <Input
                      id="finalCost"
                      type="number"
                      value={formData.finalCost || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, finalCost: Number(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="squareFootage">Square Footage</Label>
                    <Input
                      id="squareFootage"
                      type="number"
                      value={formData.squareFootage || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, squareFootage: Number(e.target.value) })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images */}
          <TabsContent value="images">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Before Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    label="Upload Before Images"
                    images={beforeImages}
                    onImagesChange={setBeforeImages}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>After Images *</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    label="Upload After Images"
                    images={afterImages}
                    onImagesChange={setAfterImages}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ProjectForm;
