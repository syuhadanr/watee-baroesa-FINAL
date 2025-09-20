"use client";

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  description?: string | null;
}

interface GalleryLightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const GalleryLightbox: React.FC<GalleryLightboxProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
}) => {
  if (!isOpen || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  // Add keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNext, onPrev, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border-none p-2 w-screen h-screen max-w-none flex items-center justify-center text-white">
        {/* Main content area */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Image and Details */}
          <div className="flex flex-col items-center justify-center max-w-[90vw] max-h-[90vh] gap-4">
            <img
              src={currentImage.image_url}
              alt={currentImage.alt_text}
              className="max-w-full max-h-[75vh] object-contain"
            />
            <div className="text-center p-2 bg-black/30 rounded-md">
              <h3 className="text-lg md:text-xl font-bold">{currentImage.alt_text}</h3>
              {currentImage.description && (
                <p className="text-sm md:text-base text-gray-300 mt-1">{currentImage.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white rounded-full bg-black/50 hover:bg-white/20 hover:text-white"
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </Button>

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white rounded-full bg-black/50 hover:bg-white/20 hover:text-white"
            >
              <ChevronLeft className="h-8 w-8" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white rounded-full bg-black/50 hover:bg-white/20 hover:text-white"
            >
              <ChevronRight className="h-8 w-8" />
              <span className="sr-only">Next</span>
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GalleryLightbox;