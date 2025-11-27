import { useState, useCallback } from 'react';
import { Upload, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  isPrimary: boolean;
}

interface ExistingImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface ImageUploadProps {
  label: string;
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  existingImages?: ExistingImage[];
  onExistingImagesChange?: (images: ExistingImage[]) => void;
  maxImages?: number;
}

const ImageUpload = ({
  label,
  images,
  onImagesChange,
  existingImages = [],
  onExistingImagesChange,
  maxImages = 10
}: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const totalImages = existingImages.length + images.length;

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );

      if (files.length + totalImages > maxImages) {
        alert(`Maximum ${maxImages} images allowed`);
        return;
      }

      const newImages: UploadedImage[] = files.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        isPrimary: totalImages === 0,
      }));

      onImagesChange([...images, ...newImages]);
    },
    [images, totalImages, maxImages, onImagesChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith('image/')
    );

    if (files.length + totalImages > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newImages: UploadedImage[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      isPrimary: totalImages === 0,
    }));

    onImagesChange([...images, ...newImages]);
  };

  const removeExistingImage = (id: string) => {
    if (!onExistingImagesChange) return;

    const updatedImages = existingImages.filter((img) => img.id !== id);

    // If removed image was primary, set first image as primary
    if (existingImages.find((img) => img.id === id)?.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }

    onExistingImagesChange(updatedImages);
  };

  const setExistingPrimary = (id: string) => {
    if (!onExistingImagesChange) return;

    const updatedImages = existingImages.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    onExistingImagesChange(updatedImages);
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    
    // If removed image was primary, set first image as primary
    if (images.find((img) => img.id === id)?.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }
    
    onImagesChange(updatedImages);
  };

  const setPrimary = (id: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">{label}</label>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">
          Drag and drop images here, or click to select
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={`file-input-${label}`}
        />
        <label htmlFor={`file-input-${label}`}>
          <Button type="button" variant="outline" asChild>
            <span>Select Images</span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground mt-2">
          {totalImages} / {maxImages} images
        </p>
      </div>

      {/* Image Preview Grid */}
      {totalImages > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Existing Images */}
          {existingImages.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border"
            >
              <img
                src={image.url}
                alt="Existing"
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={image.isPrimary ? 'default' : 'outline'}
                  onClick={() => setExistingPrimary(image.id)}
                  className="bg-background/90 hover:bg-background"
                >
                  <Star className={`h-4 w-4 ${image.isPrimary ? 'fill-gold text-gold' : ''}`} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeExistingImage(image.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {image.isPrimary && (
                <div className="absolute top-2 right-2 bg-gold text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                Saved
              </div>
            </div>
          ))}

          {/* New Images */}
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border"
            >
              <img
                src={image.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={image.isPrimary ? 'default' : 'outline'}
                  onClick={() => setPrimary(image.id)}
                  className="bg-background/90 hover:bg-background"
                >
                  <Star className={`h-4 w-4 ${image.isPrimary ? 'fill-gold text-gold' : ''}`} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(image.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {image.isPrimary && (
                <div className="absolute top-2 right-2 bg-gold text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                New
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
export type { UploadedImage, ExistingImage };
