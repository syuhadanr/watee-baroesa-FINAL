import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import MenuSection from "@/components/MenuSection";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import GallerySection from "@/components/GallerySection";
import ReviewsSection from "@/components/ReviewsSection";
import NewsletterSection from "@/components/NewsletterSection";
import SpecialOffersSection from "@/components/SpecialOffersSection";
import ContactSection from "@/components/ContactSection";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1); // Remove '#'
      const element = document.getElementById(id);
      if (element) {
        // Use a timeout to ensure the element is rendered and the page has settled
        // before attempting to scroll, especially after a route change.
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100); 
      }
    } else {
      // Scroll to top when navigating to the root path without a hash
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen bg-pastel-cream">
      <HeroSection />
      <MenuSection isHomePage={true} />
      <SpecialOffersSection />
      <ReviewsSection /> 
      <GallerySection />         
      <AboutSection />
      <NewsletterSection />
      <ContactSection />
    </div>
  );
};

export default Index;