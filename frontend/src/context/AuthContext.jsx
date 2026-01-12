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
  }, [checkAuth]);

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
