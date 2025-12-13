/**
 * @fileoverview Unit tests for the ImageUpload component.
 * Tests drag-and-drop functionality, file selection, image management, and primary selection.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImageUpload, { type UploadedImage, type ExistingImage } from './ImageUpload';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test-preview-url');
global.URL.revokeObjectURL = vi.fn();

describe('ImageUpload', () => {
  const defaultProps = {
    label: 'Test Images',
    images: [] as UploadedImage[],
    onImagesChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render label correctly', () => {
      render(<ImageUpload {...defaultProps} />);
      
      expect(screen.getByText('Test Images')).toBeInTheDocument();
    });

    it('should show image count 0/10 by default', () => {
      render(<ImageUpload {...defaultProps} />);
      
      expect(screen.getByText('0 / 10 images')).toBeInTheDocument();
    });

    it('should show custom max images count', () => {
      render(<ImageUpload {...defaultProps} maxImages={5} />);
      
      expect(screen.getByText('0 / 5 images')).toBeInTheDocument();
    });

    it('should show drop zone instructions', () => {
      render(<ImageUpload {...defaultProps} />);
      
      expect(screen.getByText(/drag and drop images here/i)).toBeInTheDocument();
      expect(screen.getByText('Select Images')).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should call onImagesChange when files are selected', async () => {
      const onImagesChange = vi.fn();
      render(<ImageUpload {...defaultProps} onImagesChange={onImagesChange} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(input, 'files', {
        value: [file],
      });

      fireEvent.change(input);

      expect(onImagesChange).toHaveBeenCalledWith([
        expect.objectContaining({
          file,
          preview: 'blob:test-preview-url',
          isPrimary: true, // First image should be primary
        }),
      ]);
    });

    it('should filter non-image files', () => {
      const onImagesChange = vi.fn();
      render(<ImageUpload {...defaultProps} onImagesChange={onImagesChange} />);

      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(input, 'files', {
        value: [imageFile, textFile],
      });

      fireEvent.change(input);

      // Should only include the image file
      expect(onImagesChange).toHaveBeenCalledWith([
        expect.objectContaining({
          file: imageFile,
        }),
      ]);
    });

    it('should show alert when max images exceeded', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const existingImages: ExistingImage[] = [
        { id: '1', url: 'http://example.com/1.jpg', isPrimary: true },
        { id: '2', url: 'http://example.com/2.jpg', isPrimary: false },
      ];

      render(
        <ImageUpload
          {...defaultProps}
          maxImages={3}
          existingImages={existingImages}
        />
      );

      const file1 = new File(['test'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test'], 'test2.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(input, 'files', {
        value: [file1, file2],
      });

      fireEvent.change(input);

      expect(alertSpy).toHaveBeenCalledWith('Maximum 3 images allowed');
      alertSpy.mockRestore();
    });
  });

  describe('Drag and Drop', () => {
    it('should highlight drop zone on drag over', () => {
      render(<ImageUpload {...defaultProps} />);
      
      const dropZone = screen.getByText(/drag and drop images here/i).closest('div');
      
      fireEvent.dragOver(dropZone!);
      
      expect(dropZone).toHaveClass('border-primary');
    });

    it('should remove highlight on drag leave', () => {
      render(<ImageUpload {...defaultProps} />);
      
      const dropZone = screen.getByText(/drag and drop images here/i).closest('div');
      
      fireEvent.dragOver(dropZone!);
      fireEvent.dragLeave(dropZone!);
      
      expect(dropZone).not.toHaveClass('border-primary');
    });

    it('should handle file drop', () => {
      const onImagesChange = vi.fn();
      render(<ImageUpload {...defaultProps} onImagesChange={onImagesChange} />);
      
      const dropZone = screen.getByText(/drag and drop images here/i).closest('div');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const dataTransfer = {
        files: [file],
      };
      
      fireEvent.drop(dropZone!, { dataTransfer });
      
      expect(onImagesChange).toHaveBeenCalledWith([
        expect.objectContaining({
          file,
          preview: 'blob:test-preview-url',
          isPrimary: true,
        }),
      ]);
    });

    it('should show alert when dropping too many files', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      render(<ImageUpload {...defaultProps} maxImages={1} />);
      
      const dropZone = screen.getByText(/drag and drop images here/i).closest('div');
      const file1 = new File(['test'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test'], 'test2.jpg', { type: 'image/jpeg' });
      
      const dataTransfer = {
        files: [file1, file2],
      };
      
      fireEvent.drop(dropZone!, { dataTransfer });
      
      expect(alertSpy).toHaveBeenCalledWith('Maximum 1 images allowed');
      alertSpy.mockRestore();
    });
  });

  describe('Image Preview', () => {
    it('should display uploaded images', () => {
      const images: UploadedImage[] = [
        { id: '1', file: new File([''], 'test.jpg'), preview: 'blob:preview1', isPrimary: true },
        { id: '2', file: new File([''], 'test2.jpg'), preview: 'blob:preview2', isPrimary: false },
      ];

      render(<ImageUpload {...defaultProps} images={images} />);

      const previewImages = screen.getAllByAltText('Preview');
      expect(previewImages).toHaveLength(2);
      expect(previewImages[0]).toHaveAttribute('src', 'blob:preview1');
      expect(previewImages[1]).toHaveAttribute('src', 'blob:preview2');
    });

    it('should display existing images', () => {
      const existingImages: ExistingImage[] = [
        { id: '1', url: 'http://example.com/1.jpg', isPrimary: true },
        { id: '2', url: 'http://example.com/2.jpg', isPrimary: false },
      ];

      render(<ImageUpload {...defaultProps} existingImages={existingImages} />);

      const existingImgs = screen.getAllByAltText('Existing');
      expect(existingImgs).toHaveLength(2);
      expect(existingImgs[0]).toHaveAttribute('src', 'http://example.com/1.jpg');
    });

    it('should show total count including existing images', () => {
      const images: UploadedImage[] = [
        { id: '1', file: new File([''], 'test.jpg'), preview: 'blob:preview1', isPrimary: false },
      ];
      const existingImages: ExistingImage[] = [
        { id: '2', url: 'http://example.com/2.jpg', isPrimary: true },
      ];

      render(
        <ImageUpload
          {...defaultProps}
          images={images}
          existingImages={existingImages}
        />
      );

      expect(screen.getByText('2 / 10 images')).toBeInTheDocument();
    });
  });

  describe('Image Management', () => {
    it('should remove uploaded image when clicking remove button', async () => {
      const onImagesChange = vi.fn();
      const images: UploadedImage[] = [
        { id: '1', file: new File([''], 'test.jpg'), preview: 'blob:preview1', isPrimary: true },
        { id: '2', file: new File([''], 'test2.jpg'), preview: 'blob:preview2', isPrimary: false },
      ];

      render(<ImageUpload {...defaultProps} images={images} onImagesChange={onImagesChange} />);

      // Find all remove buttons (X icons) - they are in the overlay that appears on hover
      const removeButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg.lucide-x')
      );
      
      await userEvent.click(removeButtons[0]);

      // Should remove first image and set second as primary
      expect(onImagesChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: '2', isPrimary: true }),
      ]);
    });

    it('should remove existing image when clicking remove button', async () => {
      const onExistingImagesChange = vi.fn();
      const existingImages: ExistingImage[] = [
        { id: '1', url: 'http://example.com/1.jpg', isPrimary: true },
        { id: '2', url: 'http://example.com/2.jpg', isPrimary: false },
      ];

      render(
        <ImageUpload
          {...defaultProps}
          existingImages={existingImages}
          onExistingImagesChange={onExistingImagesChange}
        />
      );

      // Find remove buttons for existing images
      const removeButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg.lucide-x')
      );
      
      await userEvent.click(removeButtons[0]);

      // Should remove first image and set second as primary
      expect(onExistingImagesChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: '2', isPrimary: true }),
      ]);
    });

    it('should set uploaded image as primary when clicking star button', async () => {
      const onImagesChange = vi.fn();
      const images: UploadedImage[] = [
        { id: '1', file: new File([''], 'test.jpg'), preview: 'blob:preview1', isPrimary: true },
        { id: '2', file: new File([''], 'test2.jpg'), preview: 'blob:preview2', isPrimary: false },
      ];

      render(<ImageUpload {...defaultProps} images={images} onImagesChange={onImagesChange} />);

      // Find star buttons
      const starButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg.lucide-star')
      );
      
      // Click the second star button (for the non-primary image)
      await userEvent.click(starButtons[1]);

      expect(onImagesChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: '1', isPrimary: false }),
        expect.objectContaining({ id: '2', isPrimary: true }),
      ]);
    });

    it('should set existing image as primary when clicking star button', async () => {
      const onExistingImagesChange = vi.fn();
      const existingImages: ExistingImage[] = [
        { id: '1', url: 'http://example.com/1.jpg', isPrimary: true },
        { id: '2', url: 'http://example.com/2.jpg', isPrimary: false },
      ];

      render(
        <ImageUpload
          {...defaultProps}
          existingImages={existingImages}
          onExistingImagesChange={onExistingImagesChange}
        />
      );

      // Find star buttons
      const starButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg.lucide-star')
      );
      
      // Click the second star button
      await userEvent.click(starButtons[1]);

      expect(onExistingImagesChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: '1', isPrimary: false }),
        expect.objectContaining({ id: '2', isPrimary: true }),
      ]);
    });
  });

  describe('Primary Badge Display', () => {
    it('should show primary badge on primary uploaded image', () => {
      const images: UploadedImage[] = [
        { id: '1', file: new File([''], 'test.jpg'), preview: 'blob:preview1', isPrimary: true },
      ];

      render(<ImageUpload {...defaultProps} images={images} />);

      expect(screen.getByText('Primary')).toBeInTheDocument();
    });

    it('should show primary badge on primary existing image', () => {
      const existingImages: ExistingImage[] = [
        { id: '1', url: 'http://example.com/1.jpg', isPrimary: true },
      ];

      render(<ImageUpload {...defaultProps} existingImages={existingImages} />);

      expect(screen.getByText('Primary')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty images array', () => {
      render(<ImageUpload {...defaultProps} images={[]} existingImages={[]} />);
      
      expect(screen.getByText('0 / 10 images')).toBeInTheDocument();
      // Should not render the image grid
      expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
      expect(screen.queryByAltText('Existing')).not.toBeInTheDocument();
    });

    it('should not call onExistingImagesChange if not provided', async () => {
      const existingImages: ExistingImage[] = [
        { id: '1', url: 'http://example.com/1.jpg', isPrimary: true },
      ];

      // Render without onExistingImagesChange
      render(
        <ImageUpload
          {...defaultProps}
          existingImages={existingImages}
        />
      );

      const removeButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg.lucide-x')
      );
      
      // This should not throw even without the callback
      await userEvent.click(removeButtons[0]);

      // No errors should occur
    });

    it('should set first new image as primary when no existing images', () => {
      const onImagesChange = vi.fn();
      render(<ImageUpload {...defaultProps} onImagesChange={onImagesChange} />);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(input, 'files', {
        value: [file],
      });

      fireEvent.change(input);

      expect(onImagesChange).toHaveBeenCalledWith([
        expect.objectContaining({
          isPrimary: true,
        }),
      ]);
    });

    it('should not set first new image as primary when existing images exist', () => {
      const onImagesChange = vi.fn();
      const existingImages: ExistingImage[] = [
        { id: '1', url: 'http://example.com/1.jpg', isPrimary: true },
      ];

      render(
        <ImageUpload
          {...defaultProps}
          onImagesChange={onImagesChange}
          existingImages={existingImages}
        />
      );

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(input, 'files', {
        value: [file],
      });

      fireEvent.change(input);

      expect(onImagesChange).toHaveBeenCalledWith([
        expect.objectContaining({
          isPrimary: false, // Should not be primary since existing image already is
        }),
      ]);
    });
  });
});
