export interface ProjectImage {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  order: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  location: string;
  shortDescription: string;
  fullDescription: string;
  scopeOfWork: string;
  challenges: string;
  outcomes: string;
  purchaseDate: string;
  completionDate: string;
  budget: number;
  finalCost: number;
  squareFootage: number;
  status: 'draft' | 'published' | 'archived';
  beforeImages: ProjectImage[];
  afterImages: ProjectImage[];
  primaryBeforeImage: string;
  primaryAfterImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFormData {
  title: string;
  location: string;
  shortDescription: string;
  fullDescription: string;
  scopeOfWork: string;
  challenges: string;
  outcomes: string;
  purchaseDate: string;
  completionDate: string;
  budget: number;
  finalCost: number;
  squareFootage: number;
  status: 'draft' | 'published';
}
