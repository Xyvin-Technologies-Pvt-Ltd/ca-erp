import { create } from "zustand";
import { authApi } from "../api";
import { users } from "../dummyData";
import { ROLES } from "../config/constants";
import { checkOut } from "../api/attendance";

// For demo purposes, we're using the dummy data
// In production, these would connect to actual API
const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });

      // Call the real API endpoint
      const response = await authApi.login(credentials);

      // Store user data in localStorage
      localStorage.setItem("userData", JSON.stringify(response.data));

      if (!response || !response.token) {
        throw new Error("Invalid response from server");
      }

      const { token, data: user } = response;

      // Store the token
      localStorage.setItem("auth_token", token);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return { user, token };
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });

      // Attempt to check out, but don't block logout if it fails
      try {
        await checkOut();
        console.log("Check-out successful during logout");
      } catch (checkOutError) {
        console.warn("Check-out failed during logout (ignoring):", checkOutError.message);
      }

      // Call the real logout API (if it exists)
      try {
        await authApi.logout();
      } catch (apiError) {
        console.warn("Logout API call failed:", apiError.message);
      }

      // ALWAYS clear local state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null // Clear any previous errors
      });

      // Force clear localStorage just to be safe
      localStorage.removeItem("auth_token");
      localStorage.removeItem("userData");

    } catch (error) {
      console.error("Logout critical error:", error);
      // Even in a critical error, we should probably force logout locally
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
      localStorage.removeItem("auth_token");
      localStorage.removeItem("userData");
    }
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
        });
        return;
      }

      set({ isLoading: true });

      // Get current user from API
      const { data: user } = await authApi.getCurrentUser();

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("Auth check error:", error);
      localStorage.removeItem("auth_token");
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
    }
  },

  clearError: () => set({ error: null }),
  setUser: (updatedUser) => {
    localStorage.setItem("userData", JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));

export default useAuthStore;
