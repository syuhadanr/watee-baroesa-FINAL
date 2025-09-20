import React, { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: "appetizer" | "main" | "dessert" | "drink";
  type: "acehnese" | "french" | "other";
  image_url?: string | null;
}

interface MenuSectionProps {
  isHomePage?: boolean;
  viewMode?: 'grid' | 'list'; // New prop for view mode
}

const MenuSection: React.FC<MenuSectionProps> = ({ isHomePage = false, viewMode = 'grid' }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MenuItem["category"] | "all">("all");
  const [activeType, setActiveType] = useState<MenuItem["type"] | "all">("all");

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching menu items:", error);
    } else {
      setMenuItems(data || []);
    }
    setLoading(false);
  };

  const filteredItems = menuItems.filter((item) => {
    const categoryMatch = activeCategory === "all" || item.category === activeCategory;
    const typeMatch = activeType === "all" || item.type === activeType;
    return categoryMatch && typeMatch;
  });

  const itemsToDisplay = isHomePage ? filteredItems.slice(0, 6) : filteredItems;

  if (loading) {
    return (
      <section id="menu" className="py-16 bg-pastel-cream text-royal-red">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-pastel-cream border-royal-gold shadow-lg flex flex-col overflow-hidden h-full">
                <AspectRatio ratio={16 / 9} className="bg-muted">
                  <Skeleton className="h-full w-full" />
                </AspectRatio>
                <div className="p-6 flex flex-col flex-grow space-y-3">
                  <div className="flex flex-row items-center justify-between">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-1/4 ml-2" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="mt-auto flex justify-end">
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-16 bg-pastel-cream text-royal-red">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-royal-red mb-4">Our Exquisite Menu</h2>
          <p className="text-xl text-royal-gold italic">A Symphony of Flavors</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            onClick={() => setActiveCategory("all")}
            className={activeCategory === "all" ? "bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red" : "border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream"}
          >
            All Categories
          </Button>
          <Button
            variant={activeCategory === "appetizer" ? "default" : "outline"}
            onClick={() => setActiveCategory("appetizer")}
            className={activeCategory === "appetizer" ? "bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red" : "border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream"}
          >
            Appetizers
          </Button>
          <Button
            variant={activeCategory === "main" ? "default" : "outline"}
            onClick={() => setActiveCategory("main")}
            className={activeCategory === "main" ? "bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red" : "border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream"}
          >
            Main Courses
          </Button>
          <Button
            variant={activeCategory === "dessert" ? "default" : "outline"}
            onClick={() => setActiveCategory("dessert")}
            className={activeCategory === "dessert" ? "bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red" : "border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream"}
          >
            Desserts
          </Button>
          <Button
            variant={activeCategory === "drink" ? "default" : "outline"}
            onClick={() => setActiveCategory("drink")}
            className={activeCategory === "drink" ? "bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red" : "border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream"}
          >
            Drinks
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Button
            variant={activeType === "all" ? "default" : "outline"}
            onClick={() => setActiveType("all")}
            className={activeType === "all" ? "bg-royal-gold text-royal-red hover:bg-royal-red hover:text-pastel-cream" : "border-royal-gold text-royal-gold hover:bg-royal-gold hover:text-royal-red"}
          >
            All Cuisines
          </Button>
          <Button
            variant={activeType === "acehnese" ? "default" : "outline"}
            onClick={() => setActiveType("acehnese")}
            className={activeType === "acehnese" ? "bg-royal-gold text-royal-red hover:bg-royal-red hover:text-pastel-cream" : "border-royal-gold text-royal-gold hover:bg-royal-gold hover:text-royal-red"}
          >
            Acehnese Specialties
          </Button>
          <Button
            variant={activeType === "french" ? "default" : "outline"}
            onClick={() => setActiveType("french")}
            className={activeType === "french" ? "bg-royal-gold text-royal-red hover:bg-royal-red hover:text-pastel-cream" : "border-royal-gold text-royal-gold hover:bg-royal-gold hover:text-royal-red"}
          >
            French-Inspired
          </Button>
        </div>

        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "grid grid-cols-1 gap-6"}>
          {itemsToDisplay.length > 0 ? (
            itemsToDisplay.map((item) => (
              <Card key={item.id} className={`bg-pastel-cream border-royal-gold shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out group overflow-hidden flex ${viewMode === 'grid' ? 'flex-col h-full' : 'flex-row h-auto'}`}>
                <div className={viewMode === 'grid' ? 'w-full' : 'w-32 h-32 flex-shrink-0'}>
                  <AspectRatio ratio={viewMode === 'grid' ? 16 / 9 : 1 / 1} className="bg-muted">
                    <img
                      src={item.image_url || "/placeholder.svg"}
                      alt={item.name}
                      className={`object-cover h-full w-full ${viewMode === 'grid' ? 'rounded-t-lg' : 'rounded-l-lg'}`}
                    />
                  </AspectRatio>
                </div>
                <div className={`p-6 flex flex-col flex-grow ${viewMode === 'list' ? 'py-4' : ''}`}>
                  <div className="flex-grow space-y-3">
                    <div className="flex flex-row items-center justify-between">
                      <CardTitle className="text-2xl font-bold text-royal-red group-hover:text-royal-gold transition-colors line-clamp-1">
                        {item.name}
                      </CardTitle>
                      <span className="text-xl font-semibold text-royal-gold group-hover:text-royal-red transition-colors flex-shrink-0 ml-2">
                        {item.price}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-royal-red/80 group-hover:text-royal-red transition-colors line-clamp-3">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${item.type === 'acehnese' ? 'bg-acehnese-green text-white' : item.type === 'french' ? 'bg-pastel-blue text-royal-red' : 'bg-gray-300 text-gray-800'}`}>
                      {item.type === 'acehnese' ? 'Acehnese Specialty' : item.type === 'french' ? 'French Inspired' : 'Beverage'}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p className="col-span-full text-center text-xl text-royal-red">No items found for the selected filters. Please add some from the admin panel!</p>
          )}
        </div>
        
        {isHomePage && filteredItems.length > 0 && (
          <div className="text-center mt-12">
            <Button asChild className="bg-royal-gold text-royal-red hover:bg-royal-red hover:text-pastel-cream text-lg px-8 py-6 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
              <Link to="/menu">View Full Menu</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default MenuSection;