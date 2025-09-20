import React, { useState, useEffect } from "react";
import MenuSection from "@/components/MenuSection";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

const MenuPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    // Initialize from sessionStorage, default to 'grid'
    return (sessionStorage.getItem('publicMenuViewMode') as 'grid' | 'list') || 'grid';
  });

  useEffect(() => {
    // Persist viewMode to sessionStorage
    sessionStorage.setItem('publicMenuViewMode', viewMode);
  }, [viewMode]);

  return (
    <div className="min-h-screen bg-pastel-cream">
      <div className="container px-4 md:px-6 pt-8 flex justify-end gap-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="icon"
          onClick={() => setViewMode('grid')}
          className={cn(
            viewMode === 'grid' ? "bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red" : "border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream"
          )}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="icon"
          onClick={() => setViewMode('list')}
          className={cn(
            viewMode === 'list' ? "bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red" : "border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream"
          )}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
      <MenuSection viewMode={viewMode} />
    </div>
  );
};

export default MenuPage;