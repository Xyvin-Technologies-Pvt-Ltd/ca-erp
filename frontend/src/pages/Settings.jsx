import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Settings as SettingsIcon, 
  Building2, 
  Sliders, 
  Shield, 
  AlertTriangle, 
  Loader2,
  Lock,
  User
} from "lucide-react";
// import UserManagement from "../components/settings/UserManagement";
import CompanySettings from "../components/settings/CompanySettings";
import SystemPreferences from "../components/settings/SystemPreferences";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isSuperadmin, isLoading } = useAuth();

  useEffect(() => {
    // Set loading state based on auth context
    setLoading(isLoading);
  }, [isLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-ping mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1c6ead] text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Loader2 className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only superadmin should have access to settings
  if (!isSuperadmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-6">
                Only superadmin can access the settings page. Please contact a superadmin for assistance.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                <span>Current User: {user?.email || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "company",
      label: "Company Settings",
      icon: Building2,
      description: "Manage company information and branding"
    },
    {
      id: "system",
      label: "System Preferences",
      icon: Sliders,
      description: "Configure system-wide preferences"
    }
    // Uncomment to enable User Management tab
    /*
    {
      id: "users",
      label: "User Management",
      icon: Users,
      description: "Manage users and permissions"
    }
    */
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-[#1c6ead] rounded-xl flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your organization's settings and preferences
              </p>
            </div>
          </div>

          {/* User Info Card */}
          {user && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name || user.email}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      Superadmin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex-1 px-6 py-6 text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-white text-blue-600 shadow-lg"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{tab.label}</h3>
                        <p className="text-sm text-gray-500">{tab.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "company" && <CompanySettings />}
            {activeTab === "system" && <SystemPreferences />}
            {/* {activeTab === "users" && <UserManagement />} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;