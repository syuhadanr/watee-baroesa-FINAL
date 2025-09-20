import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
}

const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("id, name, rating, comment")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(9); // Fetch more reviews for the carousel

    if (error) {
      console.error("Error fetching reviews:", error);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReviewSuccess = () => {
    setIsFormOpen(false);
  };

  if (loading) {
    return (
      <section id="reviews" className="py-16 bg-pastel-cream text-royal-red">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="flex space-x-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full md:w-1/2 lg:w-1/3 flex-shrink-0 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reviews" className="py-16 bg-pastel-cream text-royal-red">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-royal-red mb-4">What Our Guests Say</h2>
          <p className="text-xl text-royal-gold italic">Voices of Delight</p>
        </div>
        
        {reviews.length === 0 ? (
          <p className="text-center text-xl text-royal-red/80">No reviews available yet.</p>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-full mx-auto"
          >
            <CarouselContent className="-ml-4">
              {reviews.map((review) => (
                <CarouselItem key={review.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <Card className="bg-white border-royal-gold shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out h-full flex flex-col">
                      <CardContent className="p-6 flex flex-col flex-grow">
                        <StarRating value={review.rating} isEditable={false} className="mb-4" />
                        <p className="text-lg italic mb-4 text-royal-red/90 flex-grow">"{review.comment}"</p>
                        <p className="font-semibold text-royal-red mt-auto">- {review.name}</p>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="text-royal-red hover:text-royal-gold border-royal-red hover:border-royal-gold" />
            <CarouselNext className="text-royal-red hover:text-royal-gold border-royal-red hover:border-royal-gold" />
          </Carousel>
        )}

        <div className="text-center mt-12">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-royal-gold text-royal-red hover:bg-royal-red hover:text-pastel-cream text-lg px-8 py-6 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
                Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-pastel-cream border-royal-gold">
              <DialogHeader>
                <DialogTitle className="text-royal-red text-2xl">Share Your Experience</DialogTitle>
              </DialogHeader>
              <ReviewForm onSuccess={handleReviewSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;