"use client";

import React from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  Home,
  Info,
  Utensils,
  Image,
  Tag,
  Mail,
  CalendarCheck,
  Users,
  LogOut,
  ChefHat,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { name: "Dashboard", hash: "#dashboard", icon: LayoutDashboard },
  { name: "Hero Section", hash: "#hero", icon: Home },
  { name: "About Section", hash: "#about", icon: Info },
  { name: "Menu", hash: "#menu", icon: Utensils },
  { name: "Gallery", hash: "#gallery", icon: Image },
  { name: "Special Offers", hash: "#offers", icon: Tag },
  { name: "Contact Info", hash: "#contact", icon: Mail },
  { name: "Reservations", hash: "#reservations", icon: CalendarCheck },
  { name: "Reviews", hash: "#reviews", icon: Star },
  { name: "Subscribers", hash: "#subscribers", icon: Users },
];

const AdminHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeHash = location.hash || "#dashboard";
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    setIsSheetOpen(false); // Close sheet on logout
  };

  const handleNavLinkClick = (hash: string) => {
    navigate(`/admin${hash}`);
    setIsSheetOpen(false); // Close sheet after navigation
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-admin-sidebar-bg shadow-sm md:hidden">
      <div className="container flex h-16 items-center justify-between px-4">
        <RouterLink to="/" className="flex items-center gap-2 text-lg font-bold text-foreground"> {/* Changed link to public homepage */}
          <ChefHat className="h-6 w-6 text-brand-red" />
          Watee Baroesa
        </RouterLink>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-brand-red text-brand-red-foreground hover:bg-brand-red/90">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle admin navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-admin-sidebar-bg border-border flex flex-col">
            <nav className="flex-grow p-2 space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeHash === item.hash;
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    onClick={() => handleNavLinkClick(item.hash)}
                    className={cn(
                      "w-full justify-start flex items-center gap-3 rounded-md px-3 py-2 text-base transition-colors",
                      isActive
                        ? "bg-brand-red text-brand-red-foreground font-semibold hover:bg-brand-red/90"
                        : "text-foreground hover:bg-muted font-medium"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Button>
                );
              })}
            </nav>
            <div className="p-2 border-t border-border">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-foreground hover:bg-muted"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default AdminHeader;