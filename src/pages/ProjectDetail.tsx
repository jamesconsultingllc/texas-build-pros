import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, MapPin, Calendar, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProject } from '@/hooks/use-projects';
import placeholderImage from '@/assets/placeholder.png';

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading, error } = useProject(slug || '');
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              {error ? 'Error Loading Project' : 'Project Not Found'}
            </h1>
            {error && (
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            )}
            <Link to="/portfolio">
              <Button>Back to Portfolio</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const allImages = [...project.beforeImages, ...project.afterImages];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-navy text-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Link to="/portfolio" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Portfolio
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{project.title}</h1>

            <div className="flex flex-wrap gap-4 text-white/80">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {project.location}
              </span>
                <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {project.completionDate 
                  ? `Completed: ${new Date(project.completionDate).toLocaleDateString()}`
                  : 'In Progress'}
                </span>
              {project.squareFootage > 0 && (
                <span className="flex items-center gap-2">
                  <Maximize className="h-5 w-5" />
                  {project.squareFootage.toLocaleString()} sq ft
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Image */}
              <div className="lg:col-span-2">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {allImages.length > 0 && allImages[selectedImage] ? (
                    <img
                      src={allImages[selectedImage]}
                      alt={`${project.title} - Image ${selectedImage + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <img
                        src={placeholderImage}
                        alt={project.title}
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {allImages.map((imageUrl, index) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-primary'
                          : 'border-transparent hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`${project.title} - Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Info Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4">Project Details</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm text-muted-foreground">Purchase Date</dt>
                        <dd className="font-semibold">
                          {new Date(project.purchaseDate).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Completion Date</dt>
                        <dd className="font-semibold">
                          {project.completionDate 
                            ? new Date(project.completionDate).toLocaleDateString()
                            : 'In Progress'}
                        </dd>
                      </div>
                      {project.budget > 0 && (
                        <div>
                          <dt className="text-sm text-muted-foreground">Investment</dt>
                          <dd className="font-semibold">
                            ${project.budget.toLocaleString()}
                          </dd>
                        </div>
                      )}
                      {project.squareFootage > 0 && (
                        <div>
                          <dt className="text-sm text-muted-foreground">Square Footage</dt>
                          <dd className="font-semibold">
                            {project.squareFootage.toLocaleString()} sq ft
                          </dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Project Description */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">About This Project</h2>
                <p className="text-lg text-muted-foreground whitespace-pre-wrap">
                  {project.fullDescription}
                </p>
              </div>

              {project.scopeOfWork && (
                <div>
                  <h3 className="text-2xl font-bold mb-4">Scope of Work</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.scopeOfWork}
                  </p>
                </div>
              )}

              {project.challenges && (
                <div>
                  <h3 className="text-2xl font-bold mb-4">Challenges & Solutions</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.challenges}
                  </p>
                </div>
              )}

              {project.outcomes && (
                <div>
                  <h3 className="text-2xl font-bold mb-4">Outcomes</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {project.outcomes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectDetail;
