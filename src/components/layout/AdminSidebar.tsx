"use client";

import React from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
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

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeHash = location.hash || "#dashboard";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="hidden md:flex flex-col h-full bg-admin-sidebar-bg border-r border-border shadow-sm">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <ChefHat className="h-8 w-8 text-brand-red" />
        <RouterLink to="/" className="text-xl font-semibold text-foreground"> {/* Changed link to public homepage */}
          Watee Baroesa
        </RouterLink>
      </div>
      <nav className="flex-grow p-2 space-y-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeHash === item.hash;
          return (
            <RouterLink
              key={item.name}
              to={`/admin${item.hash}`}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-base transition-colors",
                isActive
                  ? "bg-brand-red text-brand-red-foreground font-semibold"
                  : "text-foreground hover:bg-muted font-medium"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </RouterLink>
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
    </div>
  );
};

export default AdminSidebar;