import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import ChatBot from "../ChatBot"; // Import the ChatBot component
import { Outlet } from "react-router-dom"; // Import Outlet

const PublicLayout: React.FC = () => { // Removed children prop
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow"><Outlet /></main> {/* Use Outlet here */}
      <Footer />
      <ChatBot />
    </div>
  );
};

export default PublicLayout;