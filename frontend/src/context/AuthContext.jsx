import { createContext, useContext, useEffect } from "react";
import useAuthStore from "../hooks/useAuthStore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const {
    setUser,
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    clearError,
  } = useAuthStore();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();

    // Auto Logout Check
    const interval = setInterval(() => {
      const now = new Date();
      // Check if it's 11:59 PM (23:59)
      if (isAuthenticated && now.getHours() === 23 && now.getMinutes() === 59) {
        console.log("Auto-logout triggered at 11:59 PM");
        logout();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkAuth, isAuthenticated, logout]);

  // Helper function to check if user is superadmin
  const isSuperadmin = () => {
    return user?.superadmin === true;
  };

  const value = {
    setUser,
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    clearError,
    role: user?.role,
    isSuperadmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
