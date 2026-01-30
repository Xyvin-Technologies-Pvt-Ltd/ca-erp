import { createContext, useContext, useEffect } from "react";
import useAuthStore from "../hooks/useAuthStore";
import { jwtDecode } from "jwt-decode";

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

  // Decode token and set auto-logout timer
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return;

      // Calculate time remaining in milliseconds
      const currentTime = Date.now();
      const expirationTime = decoded.exp * 1000;
      const timeRemaining = expirationTime - currentTime;

      // If token is already expired or about to expire, logout immediately (or just let checkAuth handle it)
      if (timeRemaining <= 0) {
        logout();
        return;
      }

      // Set timeout to logout when token expires
      console.log(`Auto-logout scheduled in ${Math.round(timeRemaining / 1000 / 60)} minutes at ${new Date(expirationTime).toLocaleTimeString()}`);

      const timer = setTimeout(() => {
        console.log("Session expired. Auto-logging out...");
        logout();
      }, timeRemaining);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error("Error decoding token for auto-logout:", error);
    }
  }, [isAuthenticated, logout]); // Re-run if auth state changes (e.g. login/logout)

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
