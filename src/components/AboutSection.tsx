import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface AboutContent {
  title: string;
  content: string;
  image_url?: string | null;
}

const AboutSection = () => {
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAboutContent = async () => {
      const { data, error } = await supabase
        .from("about_sections")
        .select("title, content, image_url")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error("Error fetching about content:", error);
      } else if (data) {
        setAboutContent(data);
      }
      setLoading(false);
    };

    fetchAboutContent();
  }, []);

  const displayData = {
    title: aboutContent?.title || "Our Story",
    content: aboutContent?.content || "<p>Watee Baroesa is more than just a restaurant; it's a celebration of heritage, a fusion of two worlds. Born from the rich culinary traditions of Aceh, Indonesia, and infused with the sophisticated elegance of French abstract royalty, we offer an unparalleled dining experience.</p><p>Our journey began with a passion for preserving the authentic flavors of Acehnese cuisine – the aromatic spices, the slow-cooked perfection, the vibrant colors. We meticulously source ingredients to bring you dishes like 'Mie Aceh Royale' and 'Ayam Tangkap à la Française,' where traditional recipes meet innovative techniques.</p><p>The ambiance of Watee Baroesa transports you to a realm of abstract French grandeur, with deep reds, shimmering gold accents, and soft pastel backdrops creating a luxurious yet inviting atmosphere. Every detail, from the decor to the plating, is designed to evoke a sense of timeless elegance. Join us to savor unique dishes that tell a story, where every bite is a testament to the harmonious blend of Acehnese soul and French artistry.</p>",
    imageUrl: aboutContent?.image_url || "/placeholder.svg",
  };

  if (loading) {
    return (
      <section id="about" className="py-16 bg-pastel-cream text-royal-red">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="py-16 bg-pastel-cream text-royal-red">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-royal-red mb-4">{displayData.title}</h2>
          <p className="text-xl text-royal-gold italic">A Culinary Journey Through Time and Culture</p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-lg leading-relaxed">
            {/* WARNING: Using dangerouslySetInnerHTML can expose your application to XSS attacks
                if the content is not sanitized. Since this content is managed by an authenticated
                admin, we assume it's safe. For user-generated content, always sanitize! */}
            <div dangerouslySetInnerHTML={{ __html: displayData.content }} />
          </div>
          <div className="relative h-96 w-full rounded-lg overflow-hidden shadow-xl">
            <img
              src={displayData.imageUrl}
              alt={displayData.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-royal-red/50 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;