import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../config/constants";

const MainLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <div className="flex overflow-hidden">
      {/* Sidebar for mobile */}
      <div className="md:hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        <div
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Fixed Sidebar for desktop */}
      <div className="hidden md:block fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-20">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 md:ml-64 overflow-hidden">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
