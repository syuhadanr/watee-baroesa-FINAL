import React, { useState, useEffect } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tag } from "lucide-react";
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

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  time_period?: string | null;
  image_url?: string | null;
}

const SpecialOffersSection = () => {
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      const { data, error } = await supabase
        .from("special_offers")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching special offers:", error);
      } else {
        setOffers(data || []);
      }
      setLoading(false);
    };

    fetchOffers();
  }, []);

  if (loading) {
    return (
      <section id="offers" className="py-16 bg-pastel-blue text-royal-red">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <Carousel className="w-full max-w-full mx-auto">
            <CarouselContent className="-ml-4">
              {[...Array(4)].map((_, i) => (
                <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <div className="p-1 h-full">
                    <Card className="bg-pastel-cream border-royal-gold shadow-lg flex flex-col overflow-hidden h-full">
                      <AspectRatio ratio={9 / 16} className="bg-muted">
                        <Skeleton className="h-full w-full" />
                      </AspectRatio>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex-grow space-y-3">
                          <div className="flex items-start gap-2">
                            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                            <div className="space-y-2 w-full">
                              <Skeleton className="h-5 w-3/4" />
                              <Skeleton className="h-5 w-1/2" />
                            </div>
                          </div>
                          <Skeleton className="h-4 w-1/2" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                          </div>
                        </div>
                        <Skeleton className="h-10 w-full mt-4" />
                      </div>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>
    );
  }

  return (
    <section id="offers" className="py-16 bg-royal-red text-royal-gold">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-royal-gold mb-4">Special Offers</h2>
          <p className="text-xl text-pastel-cream italic">Exclusive Deals for Our Valued Guests</p>
        </div>
        {offers.length === 0 ? (
          <p className="col-span-full text-center text-xl text-royal-red/80">No special offers available yet. Please add some from the admin panel!</p>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: offers.length > 3,
            }}
            className="w-full max-w-full mx-auto"
          >
            <CarouselContent className="-ml-4">
              {offers.map((offer) => (
                <CarouselItem key={offer.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <div className="p-1 h-full">
                    <Card className="bg-pastel-cream border-royal-gold shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out flex flex-col overflow-hidden h-full">
                      <div className="w-full">
                        <AspectRatio ratio={9 / 16} className="bg-muted">
                          <img
                            src={offer.image_url || "/placeholder.svg"}
                            alt={offer.title}
                            className="object-cover h-full w-full"
                          />
                        </AspectRatio>
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex-grow space-y-3">
                          <div className="flex items-start gap-2">
                            <Tag className="h-8 w-8 text-royal-gold flex-shrink-0" />
                            <CardTitle className="font-bold text-lg text-royal-red line-clamp-2">
                              {offer.title}
                            </CardTitle>
                          </div>
                          {offer.time_period && (
                            <CardDescription className="text-sm text-muted-foreground">
                              {offer.time_period}
                            </CardDescription>
                          )}
                          <p className="text-foreground text-sm line-clamp-3">
                            {offer.description}
                          </p>
                        </div>
                        <Button asChild className="w-full mt-4 bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red transition-colors">
                          <Link to="/reservations">Book Now</Link>
                        </Button>
                      </div>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="text-royal-red hover:text-royal-gold border-royal-red hover:border-royal-gold" />
            <CarouselNext className="text-royal-red hover:text-royal-gold border-royal-red hover:border-royal-gold" />
          </Carousel>
        )}
      </div>
    </section>
  );
};

export default SpecialOffersSection;