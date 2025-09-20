import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation, useNavigate } from "react-router-dom";

interface HeroData {
  title: string;
  subtitle: string;
  image_url: string | null;
  button1_text: string;
  button1_link: string;
  button2_text: string;
  button2_link: string;
}

const HeroSection = () => {
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHeroData = async () => {
      const { data, error } = await supabase
        .from("hero_content")
        .select("title, subtitle, image_url, button1_text, button1_link, button2_text, button2_link")
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching hero data:", error);
      } else if (data) {
        setHeroData({
          title: data.title,
          subtitle: data.subtitle,
          image_url: data.image_url || null,
          button1_text: data.button1_text || "View Menu",
          button1_link: data.button1_link || "/menu",
          button2_text: data.button2_text || "Book a Table",
          button2_link: data.button2_link || "/reservations",
        });
      }
      setLoading(false);
    };

    fetchHeroData();
  }, []);

  const displayData = {
    title: heroData?.title || "Watee Baroesa",
    subtitle: heroData?.subtitle || "Where Acehnese Heritage Meets French Abstract Royalty",
    imageUrl: heroData?.image_url || "/placeholder.svg",
    button1_text: heroData?.button1_text || "View Menu",
    button1_link: heroData?.button1_link || "/menu",
    button2_text: heroData?.button2_text || "Book a Table",
    button2_link: heroData?.button2_link || "/reservations",
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    const isHashLink = path.startsWith("/#");
    if (isHashLink) {
      e.preventDefault();
      const hash = path.split('#')[1];
      if (location.pathname === '/') {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        navigate(path);
      }
    }
  };

  if (loading) {
    return (
      <section className="relative h-screen w-full flex items-center justify-center text-center bg-gray-200">
        <Skeleton className="absolute inset-0" />
        <div className="relative z-10 p-8 max-w-4xl mx-auto flex flex-col items-center gap-4">
          <Skeleton className="h-20 w-96" />
          <Skeleton className="h-8 w-full max-w-lg" />
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-14 w-36 rounded-full" />
            <Skeleton className="h-14 w-36 rounded-full" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="hero"
      className="relative h-screen w-full bg-cover bg-center flex items-center justify-center text-center"
      style={{ backgroundImage: `url('${displayData.imageUrl}')`, backgroundAttachment: "fixed" }}
    >
      <div className="absolute inset-0 bg-black/60" aria-hidden="true"></div>
      <div className="relative z-10 p-8 max-w-4xl mx-auto text-pastel-cream">
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-4 text-royal-gold drop-shadow-lg">
          {displayData.title}
        </h1>
        <p className="text-xl md:text-3xl font-light italic mb-8 leading-relaxed">
          {displayData.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red text-lg px-8 py-6 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
            <Link to={displayData.button1_link} onClick={(e) => handleButtonClick(e, displayData.button1_link)}>
              {displayData.button1_text}
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-2 border-royal-gold text-royal-gold bg-transparent hover:bg-royal-gold hover:text-royal-red text-lg px-8 py-6 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
            <Link to={displayData.button2_link} onClick={(e) => handleButtonClick(e, displayData.button2_link)}>
              {displayData.button2_text}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;