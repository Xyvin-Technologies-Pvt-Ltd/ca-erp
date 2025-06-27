import { useState, useEffect } from "react";
import { ROLES } from "../config/constants";
// import UserManagement from "../components/settings/UserManagement";
import CompanySettings from "../components/settings/CompanySettings";
import SystemPreferences from "../components/settings/SystemPreferences";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Simulate loading user data
    const loadUserData = async () => {
      setLoading(true);
      try {
        // In a real app, this would fetch current user data from API/context
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock current user with admin role for demo
        setCurrentUser({
          id: "user-1",
          name: "Admin User",
          email: "admin@ca-erp.com",
          role: ROLES.ADMIN
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to load user data:", error);
        setError("Failed to load user data. Please try again.");
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className="container px-6 py-8 mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-6 py-8 mx-auto">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Only admin should have access to settings
  if (currentUser && currentUser.role !== ROLES.ADMIN) {
    return (
      <div className="container px-6 py-8 mx-auto">
        <div className="bg-yellow-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-yellow-800">Access Denied</h3>
          <p className="mt-2 text-yellow-700">
            You don't have permission to access the settings page. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-6 py-8 mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your organization's settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {/* Uncomment to enable User Management tab */}
          {/*
          <button
            onClick={() => setActiveTab("users")}
            className={`$
              activeTab === "users"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            User Management
          </button>
          */}
          <button
            onClick={() => setActiveTab("company")}
            className={`${
              activeTab === "company"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Company Settings
          </button>
          <button
            onClick={() => setActiveTab("system")}
            className={`${
              activeTab === "system"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            System Preferences
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {/* {activeTab === "users" && <UserManagement />} */}
        {activeTab === "company" && <CompanySettings />}
        {activeTab === "system" && <SystemPreferences />}
      </div>
    </div>
  );
};

export default Settings;
