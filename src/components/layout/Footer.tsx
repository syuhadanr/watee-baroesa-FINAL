import React from "react";
import { Link } from "react-router-dom";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useAuth } from "@/contexts/AuthContext";

const Footer = () => {
  const { session } = useAuth();

  return (
    <footer className="bg-royal-red text-pastel-cream py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row px-4 md:px-6">
        <p className="text-sm text-center md:text-left">
          &copy; {new Date().getFullYear()} Watee Baroesa. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:gap-6 items-center">
          <a href="/#about" className="text-sm hover:text-royal-gold transition-colors">
            About
          </a>
          <a href="/menu" className="text-sm hover:text-royal-gold transition-colors">
            Menu
          </a>
          <a href="/reservations" className="text-sm hover:text-royal-gold transition-colors">
            Reservations
          </a>
          <a href="/#contact" className="text-sm hover:text-royal-gold transition-colors">
            Contact
          </a>
          {!session && (
            <Link to="/login" className="text-sm hover:text-royal-gold transition-colors">
              Admin Login
            </Link>
          )}
        </nav>
      </div>
      <MadeWithDyad />
    </footer>
  );
};

export default Footer;