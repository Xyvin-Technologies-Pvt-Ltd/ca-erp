import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../config/constants";

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#1c6ead]"></div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 shadow-xl rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/50 animate-fade-in-up">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-[#1c6ead] drop-shadow-sm">CA-ERP</h2>
          <p className="mt-2 text-sm text-slate-600 font-medium">
            Work Management System for CA Firms
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
