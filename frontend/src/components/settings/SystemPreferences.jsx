import { useState, useEffect } from "react";
import {
  Bell,
  Shield,
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Save,
  Mail,
  UserCheck,
  Activity,
  FolderOpen,
  Lock,
  Clock,
  Globe,
  UserX,
  Upload,
  Archive,
  Calendar,
  UserPlus
} from "lucide-react";

const SystemPreferences = () => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [preferences, setPreferences] = useState({
    // Notification settings
    emailNotifications: true,
    taskAssignments: true,
    taskStatusChanges: true,
    projectUpdates: true,

    // Security settings
    requireMfa: false,
    passwordExpiryDays: 90,
    sessionTimeoutMinutes: 30,

    // Access permissions
    clientPortalEnabled: true,
    allowGuestAccess: false,
    fileUploadMaxSize: 10,

    // Automatic actions
    autoArchiveCompletedProjects: true,
    autoArchiveDays: 30,
    autoAssignToProjectManager: true,
  });

  useEffect(() => {
    // Simulate loading preferences
    const loadPreferences = async () => {
      setLoading(true);
      try {
        // In a real app, this would fetch from an API
        await new Promise((resolve) => setTimeout(resolve, 800));
        // Loaded defaults already in state
        setLoading(false);
      } catch (error) {
        console.error("Failed to load system preferences:", error);
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleToggleChange = (field) => {
    setPreferences({
      ...preferences,
      [field]: !preferences[field],
    });
  };

  const handleInputChange = (field, value) => {
    setPreferences({
      ...preferences,
      [field]: value,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, this would send data to an API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message
      setSuccessMessage("System preferences updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      setLoading(false);
    } catch (error) {
      console.error("Error saving system preferences:", error);
      setLoading(false);
    }
  };

  // Enhanced Toggle Component
  const ToggleSwitch = ({ id, checked, onChange, disabled = false }) => (
    <div className="relative inline-block">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <label
        htmlFor={id}
        className={`block w-12 h-6 rounded-full cursor-pointer transition-all duration-300 ease-in-out ${
          checked
            ? "bg-[#1c6ead] shadow-lg"
            : "bg-gray-300 hover:bg-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-md ${
            checked ? "transform translate-x-6" : ""
          }`}
        />
      </label>
    </div>
  );

  if (loading && !successMessage) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium text-lg">Loading system preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-emerald-900">Success!</p>
                <p className="text-emerald-700">{successMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Notification Settings</h3>
              <p className="text-gray-600">Configure what events trigger email notifications</p>
            </div>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600">Enable email notifications system-wide</p>
              </div>
            </div>
            <ToggleSwitch
              id="emailNotifications"
              checked={preferences.emailNotifications}
              onChange={() => handleToggleChange("emailNotifications")}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Task Assignments</h4>
                <p className="text-sm text-gray-600">Notify users when they are assigned to a task</p>
              </div>
            </div>
            <ToggleSwitch
              id="taskAssignments"
              checked={preferences.taskAssignments}
              onChange={() => handleToggleChange("taskAssignments")}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Task Status Changes</h4>
                <p className="text-sm text-gray-600">Notify when a task's status changes</p>
              </div>
            </div>
            <ToggleSwitch
              id="taskStatusChanges"
              checked={preferences.taskStatusChanges}
              onChange={() => handleToggleChange("taskStatusChanges")}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Project Updates</h4>
                <p className="text-sm text-gray-600">Notify team members about project changes</p>
              </div>
            </div>
            <ToggleSwitch
              id="projectUpdates"
              checked={preferences.projectUpdates}
              onChange={() => handleToggleChange("projectUpdates")}
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Security Settings</h3>
              <p className="text-gray-600">Configure security options for the application</p>
            </div>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Require MFA</h4>
                <p className="text-sm text-gray-600">Require multi-factor authentication for all users</p>
              </div>
            </div>
            <ToggleSwitch
              id="requireMfa"
              checked={preferences.requireMfa}
              onChange={() => handleToggleChange("requireMfa")}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label
                htmlFor="passwordExpiryDays"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <Clock className="w-4 h-4 text-gray-500" />
                Password Expiry (days)
              </label>
              <input
                id="passwordExpiryDays"
                type="number"
                min="0"
                max="365"
                value={preferences.passwordExpiryDays}
                onChange={(e) =>
                  handleInputChange(
                    "passwordExpiryDays",
                    parseInt(e.target.value, 10)
                  )
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                placeholder="90"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Set to 0 for no expiry
              </p>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="sessionTimeoutMinutes"
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                <Clock className="w-4 h-4 text-gray-500" />
                Session Timeout (minutes)
              </label>
              <input
                id="sessionTimeoutMinutes"
                type="number"
                min="5"
                max="480"
                value={preferences.sessionTimeoutMinutes}
                onChange={(e) =>
                  handleInputChange(
                    "sessionTimeoutMinutes",
                    parseInt(e.target.value, 10)
                  )
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                placeholder="30"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Minimum 5 minutes, maximum 8 hours
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Access Permissions */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Access & Permissions</h3>
              <p className="text-gray-600">Configure access controls and permissions</p>
            </div>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Client Portal</h4>
                <p className="text-sm text-gray-600">Enable client portal access</p>
              </div>
            </div>
            <ToggleSwitch
              id="clientPortalEnabled"
              checked={preferences.clientPortalEnabled}
              onChange={() => handleToggleChange("clientPortalEnabled")}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Guest Access</h4>
                <p className="text-sm text-gray-600">Allow access to guests without accounts</p>
              </div>
            </div>
            <ToggleSwitch
              id="allowGuestAccess"
              checked={preferences.allowGuestAccess}
              onChange={() => handleToggleChange("allowGuestAccess")}
            />
          </div>

          <div className="space-y-3">
            <label
              htmlFor="fileUploadMaxSize"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Upload className="w-4 h-4 text-gray-500" />
              Max File Upload Size (MB)
            </label>
            <input
              id="fileUploadMaxSize"
              type="number"
              min="1"
              max="100"
              value={preferences.fileUploadMaxSize}
              onChange={(e) =>
                handleInputChange(
                  "fileUploadMaxSize",
                  parseInt(e.target.value, 10)
                )
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
              placeholder="10"
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Maximum allowed: 100MB
            </p>
          </div>
        </div>
      </div>

      {/* Automation Settings */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Automation Settings</h3>
              <p className="text-gray-600">Configure automatic actions and workflows</p>
            </div>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Archive className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Auto-Archive Completed Projects</h4>
                <p className="text-sm text-gray-600">Automatically archive projects after completion</p>
              </div>
            </div>
            <ToggleSwitch
              id="autoArchiveCompletedProjects"
              checked={preferences.autoArchiveCompletedProjects}
              onChange={() => handleToggleChange("autoArchiveCompletedProjects")}
            />
          </div>

          <div className="space-y-3">
            <label
              htmlFor="autoArchiveDays"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              Archive After (days)
            </label>
            <input
              id="autoArchiveDays"
              type="number"
              min="1"
              max="365"
              value={preferences.autoArchiveDays}
              onChange={(e) =>
                handleInputChange(
                  "autoArchiveDays",
                  parseInt(e.target.value, 10)
                )
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
              placeholder="30"
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Projects will be archived this many days after completion
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Auto-Assign to Project Manager</h4>
                <p className="text-sm text-gray-600">Automatically assign new tasks to the project manager</p>
              </div>
            </div>
            <ToggleSwitch
              id="autoAssignToProjectManager"
              checked={preferences.autoAssignToProjectManager}
              onChange={() => handleToggleChange("autoAssignToProjectManager")}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#1c6ead]  text-white rounded-xl  transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SystemPreferences;