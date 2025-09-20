import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminLayout: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="admin-dashboard flex h-screen bg-admin-bg overflow-hidden"> {/* Set h-screen and overflow-hidden for the main container */}
      {isMobile ? (
        <div className="flex flex-col w-full">
          <AdminHeader />
          <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto"> {/* Make mobile main content scrollable */}
            <Outlet />
          </main>
        </div>
      ) : (
        <div className="flex w-full">
          <div className="w-[280px] flex-shrink-0 h-screen"> {/* Fixed width and full height for sidebar */}
            <AdminSidebar />
          </div>
          <main className="flex-grow p-8 overflow-y-auto h-screen"> {/* Main content takes remaining space and is scrollable */}
            <Outlet />
          </main>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;