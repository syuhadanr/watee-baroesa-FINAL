import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import GalleryLightbox from "./GalleryLightbox";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  description?: string | null;
}

const GallerySection = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching gallery images:", error);
      } else {
        setGalleryImages(data || []);
      }
      setLoading(false);
    };

    fetchGalleryImages();
  }, []);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const goToNext = () => {
    setSelectedImageIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
  };

  const goToPrev = () => {
    setSelectedImageIndex((prevIndex) => (prevIndex - 1 + galleryImages.length) % galleryImages.length);
  };

  if (loading) {
    return (
      <section id="gallery" className="py-16 bg-royal-red">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4 bg-pastel-cream/20" />
            <Skeleton className="h-6 w-96 mx-auto bg-pastel-cream/20" />
          </div>
          <div className="relative">
            <div className="flex -ml-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <div className="p-1">
                    <Skeleton className="h-64 w-full rounded-lg bg-pastel-cream/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-16 bg-royal-red">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-royal-gold mb-4">Our Gallery</h2>
          <p className="text-xl text-pastel-cream italic">A Glimpse into Our World</p>
        </div>
        {galleryImages.length === 0 ? (
          <p className="col-span-full text-center text-xl text-pastel-cream/80">No gallery images available yet. Please add some from the admin panel!</p>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: galleryImages.length > 4,
            }}
            className="w-full max-w-full mx-auto"
          >
            <CarouselContent className="-ml-4">
              {galleryImages.map((image, index) => (
                <CarouselItem key={image.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <div className="p-1">
                    <Card
                      className="overflow-hidden border-royal-gold shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer group"
                      onClick={() => openLightbox(index)}
                    >
                      <CardContent className="p-0">
                        <AspectRatio ratio={3 / 4}>
                          <img
                            src={image.image_url}
                            alt={image.alt_text}
                            className="object-cover h-full w-full transition-transform duration-300 group-hover:scale-105"
                          />
                        </AspectRatio>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="text-pastel-cream hover:text-royal-gold border-pastel-cream hover:border-royal-gold" />
            <CarouselNext className="text-pastel-cream hover:text-royal-gold border-pastel-cream hover:border-royal-gold" />
          </Carousel>
        )}
      </div>
      {galleryImages.length > 0 && (
        <GalleryLightbox
          images={galleryImages}
          currentIndex={selectedImageIndex}
          isOpen={isLightboxOpen}
          onClose={closeLightbox}
          onNext={goToNext}
          onPrev={goToPrev}
        />
      )}
    </section>
  );
};

export default GallerySection;