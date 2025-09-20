import React from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/#about" },
    { name: "Menu", path: "/menu" },
    { name: "Gallery", path: "/#gallery" },
    { name: "Reservations", path: "/reservations" },
    { name: "Reviews", path: "/#reviews" },
    { name: "Offers", path: "/#offers" },
    { name: "Contact", path: "/#contact" },
  ];

  const handleHashLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    const hash = path.split('#')[1];
    if (location.pathname === '/') {
      // If already on homepage, prevent default RouterLink behavior and manually scroll
      e.preventDefault();
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // If on another page, navigate to homepage with hash
      navigate(path);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-pastel-cream/90 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <RouterLink to="/" className="flex items-center gap-2 text-lg font-bold text-royal-red hover:text-royal-gold transition-colors">
          Watee Baroesa
        </RouterLink>
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => {
            const isHashLink = item.path.startsWith("/#");
            if (isHashLink) {
              return (
                <a
                  key={item.name}
                  href={item.path}
                  onClick={(e) => handleHashLinkClick(e, item.path)}
                  className="text-sm font-medium text-royal-red hover:text-royal-gold transition-colors"
                >
                  {item.name}
                </a>
              );
            } else {
              return (
                <RouterLink
                  key={item.name}
                  to={item.path}
                  className="text-sm font-medium text-royal-red hover:text-royal-gold transition-colors"
                >
                  {item.name}
                </RouterLink>
              );
            }
          })}
          {session ? (
            <>
              <RouterLink to="/admin" className="text-sm font-medium text-royal-red hover:text-royal-gold transition-colors">Admin</RouterLink>
              <Button onClick={handleLogout} variant="outline" className="border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream">Logout</Button>
            </>
          ) : (
            <Button asChild className="bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red transition-colors">
              <RouterLink to="/reservations">Book a Table</RouterLink>
            </Button>
          )}
        </nav>
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" className="bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-pastel-cream">
            <nav className="grid gap-6 text-lg font-medium pt-8">
              {navItems.map((item) => {
                const isHashLink = item.path.startsWith("/#");
                if (isHashLink) {
                  return (
                    <a
                      key={item.name}
                      href={item.path}
                      onClick={(e) => handleHashLinkClick(e, item.path)}
                      className="text-royal-red hover:text-royal-gold transition-colors"
                    >
                      {item.name}
                    </a>
                  );
                } else {
                  return (
                    <RouterLink
                      key={item.name}
                      to={item.path}
                      className="text-royal-red hover:text-royal-gold transition-colors"
                    >
                      {item.name}
                    </RouterLink>
                  );
                }
              })}
              {session ? (
                <>
                  <RouterLink to="/admin" className="text-royal-red hover:text-royal-gold transition-colors">Admin</RouterLink>
                  <Button onClick={handleLogout} variant="outline" className="border-royal-red text-royal-red hover:bg-royal-red hover:text-pastel-cream mt-4">Logout</Button>
                </>
              ) : (
                <Button asChild className="bg-royal-red text-pastel-cream hover:bg-royal-gold hover:text-royal-red transition-colors mt-4">
                  <RouterLink to="/reservations">Book a Table</RouterLink>
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;