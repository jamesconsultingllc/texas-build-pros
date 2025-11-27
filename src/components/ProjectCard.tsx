import { Link } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { Project } from '@/types/project';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import placeholderImage from '@/assets/placeholder.png';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  // Use primaryAfterImage if set, otherwise use the first after image
  const primaryImage = project.primaryAfterImage || project.afterImages[0];

  const formattedDate = project.completionDate 
    ? new Date(project.completionDate).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'In Progress';

  return (
    <Link to={`/portfolio/${project.slug}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full">
        <div className="aspect-video relative overflow-hidden bg-muted">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={`${project.title} - ${project.location}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
        
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">
            {project.title}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {project.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>
          </div>
          
          <p className="text-muted-foreground line-clamp-3">
            {project.shortDescription}
          </p>
        </CardContent>
        
        <CardFooter className="px-6 pb-6">
          <span className="text-primary font-semibold hover:underline">
            View Details →
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProjectCard;
