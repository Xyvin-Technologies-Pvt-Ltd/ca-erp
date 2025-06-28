import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../api/axios";

const CompanySettings = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const [logoPath, setLogoPath] = useState(""); // New state to store logo path

  // Base URL for backend (adjust to your backend's URL)
  const BASE_URL = "http://localhost:5001"; // Replace with your backend URL

  // Function to upload logo
  const uploadLogo = async (formData) => {
    try {
      const response = await api.put("/settings/company/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Logo upload response:", response.data);
      return response.data.data; // Return updated settings
    } catch (error) {
      console.error("Logo upload error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to upload logo");
    }
  };

  
  // Function to load company settings
  const loadCompanySettings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/settings");
      const data = response.data.data;
      console.log("Fetched settings:", data);

      // Update settings state
      setSettings(data);
      setLogoPath(data.company?.logo || ""); // Set initial logo path

      // Reset form with fetched data
      reset({
        company: {
          name: data.company?.name || "",
          contactEmail: data.company?.contactEmail || "",
          phone: data.company?.phone || "",
          address: data.company?.address || "",
          website: data.company?.website || "",
          taxId: data.company?.taxId || "",
          financialYearStart: data.company?.financialYearStart || "April",
          dateFormat: data.company?.dateFormat || "DD-MMM-YYYY",
          currency: data.company?.currency || "INR",
        },
        system: {
          emailNotifications: data.system?.emailNotifications || false,
          taskAssignments: data.system?.taskAssignments || false,
          taskStatusChanges: data.system?.taskStatusChanges || false,
          projectUpdates: data.system?.projectUpdates || false,
          requireMfa: data.system?.requireMfa || false,
          passwordExpiryDays: data.system?.passwordExpiryDays || 90,
          sessionTimeoutMinutes: data.system?.sessionTimeoutMinutes || 30,
          clientPortalEnabled: data.system?.clientPortalEnabled || false,
          allowGuestAccess: data.system?.allowGuestAccess || false,
          fileUploadMaxSize: data.system?.fileUploadMaxSize || 10,
          autoArchiveCompletedProjects: data.system?.autoArchiveCompletedProjects || false,
          autoArchiveDays: data.system?.autoArchiveDays || 30,
          autoAssignToProjectManager: data.system?.autoAssignToProjectManager || false,
        },
      });
    } catch (error) {
      console.error("Failed to load settings:", error.message);
      setErrorMessage("Failed to load company settings.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // First update general settings
      const settingsPayload = {
        company: {
          ...data.company,
          currency: data.company.currency,
          logo: settings?.company?.logo || "", // Keep existing logo path
        },
        system: data.system,
      };

      const response = await api.put("/settings", settingsPayload);
      let updatedSettings = response.data.data;
      setSettings(updatedSettings);

      // Then handle logo upload if a new file is selected
      if (imageFile) {
        const formData = new FormData();
        formData.append("logo", imageFile);
        const logoResponse = await uploadLogo(formData);
        updatedSettings = logoResponse; // Logo upload response already contains the data
        setSettings(updatedSettings);
        setLogoPath(updatedSettings.company?.logo || "");
        setTempImage(null);
        setImageFile(null);
      }

      setSuccessMessage("Settings updated successfully!");
      console.log("Settings updated:", updatedSettings);

      // Re-fetch settings to ensure UI is in sync
      await loadCompanySettings();
    } catch (error) {
      console.error("Submission error:", error.message);
      setErrorMessage(error.message || "Failed to update settings or upload logo.");
    } finally {
      setLoading(false);
    }
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && ["image/jpeg", "image/png", "image/svg+xml"].includes(file.type)) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setErrorMessage("File size exceeds 2MB limit.");
        return;
      }
      setTempImage({ preview: URL.createObjectURL(file) });
      setImageFile(file);
    } else {
      setErrorMessage("Please upload a valid image (PNG, JPG, SVG).");
    }
  };

  // Clean up temporary image URL
  useEffect(() => {
    return () => {
      if (tempImage?.preview) {
        URL.revokeObjectURL(tempImage.preview);
      }
    };
  }, [tempImage]);

  // Fetch company settings on mount
  useEffect(() => {
    loadCompanySettings();
  }, []);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Company Settings</h2>
      </div>
      {/* Success and Error Messages */}
      {successMessage && (
        <div className="mb-6 bg-green-50 p-4 rounded-md">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {loading && <p className="text-gray-500">Loading settings...</p>}

      {!loading && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white mb-6 p-6 rounded-lg shadow overflow-hidden">
  <div className="px-6 py-4 mb-6 border-b">
    <h3 className="text-md font-medium text-gray-900">Basic Information</h3>
  </div>
  {/* Company Name */}
  <div>
    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
      Company Name <span className="text-red-600">*</span>
    </label>
    <input
      id="companyName"
      {...register("company.name", { required: "Company name is required" })}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
    {errors.company?.name && (
      <span className="text-red-600 text-sm">{errors.company.name.message}</span>
    )}
  </div>

  {/* Contact Email */}
  <div>
    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
      Contact Email <span className="text-red-600">*</span>
    </label>
    <input
      id="contactEmail"
      type="email"
      {...register("company.contactEmail", { required: "Email is required" })}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
    {errors.company?.contactEmail && (
      <span className="text-red-600 text-sm">{errors.company.contactEmail.message}</span>
    )}
  </div>

  {/* Phone */}
  <div>
    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
      Phone <span className="text-red-600">*</span>
    </label>
    <input
      id="phone"
      type="tel"
      {...register("company.phone", { required: "Phone number is required" })}
      pattern="[0-9+\-\s]*"
      onKeyPress={(e) => {
        const char = String.fromCharCode(e.which);
        if (!/[0-9+\-\s]/.test(char)) {
          e.preventDefault();
        }
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
    {errors.company?.phone && (
      <span className="text-red-600 text-sm">{errors.company.phone.message}</span>
    )}
  </div>

  {/* Address */}
  <div>
    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
      Address <span className="text-red-600">*</span>
    </label>
    <input
      id="address"
      {...register("company.address", { required: "Address is required" })}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
    {errors.company?.address && (
      <span className="text-red-600 text-sm">{errors.company.address.message}</span>
    )}
  </div>

  {/* Website */}
  <div>
    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
      Website <span className="text-red-600">*</span>
    </label>
    <input
      id="website"
      type="url"
      {...register("company.website", { required: "Website URL is required" })}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
    {errors.company?.website && (
      <span className="text-red-600 text-sm">{errors.company.website.message}</span>
    )}
  </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-md font-medium text-gray-900">Financial Settings</h3>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tax ID */}
                <div>
                  <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID / GST NUMBER <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="taxId"
                    {...register("company.taxId", { required: "Tax ID is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.company?.taxId && (
                    <span className="text-red-600 text-sm">{errors.company.taxId.message}</span>
                  )}
                </div>

                {/* Currency */}
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Default Currency <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="currency"
                    {...register("company.currency", { required: "Currency is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                    <option value="CAD">Canadian Dollar (C$)</option>
                    <option value="AUD">Australian Dollar (A$)</option>
                    <option value="SGD">Singapore Dollar (S$)</option>
                  </select>
                  {errors.company?.currency && (
                    <span className="text-red-600 text-sm">{errors.company.currency.message}</span>
                  )}
                </div>

                {/* Financial Year Start */}
                <div>
                  <label htmlFor="financialYearStart" className="block text-sm font-medium text-gray-700 mb-1">
                    Financial Year Start <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="financialYearStart"
                    {...register("company.financialYearStart", { required: "Financial year start is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                  {errors.company?.financialYearStart && (
                    <span className="text-red-600 text-sm">{errors.company.financialYearStart.message}</span>
                  )}
                </div>

                {/* Date Format */}
                <div>
                  <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 mb-1">
                    Date Format <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="dateFormat"
                    {...register("company.dateFormat", { required: "Date format is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD-MMM-YYYY">DD-MMM-YYYY</option>
                  </select>
                  {errors.company?.dateFormat && (
                    <span className="text-red-600 text-sm">{errors.company.dateFormat.message}</span>
                  )}
                </div>
              </div>
            </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-md font-medium text-gray-900">Branding</h3>
            </div>
            <div className="px-6 py-4">
              <div>
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Logo
                </label>
                <div className="mt-1 flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                    {tempImage?.preview ? (
                      <img
                        src={tempImage.preview}
                        alt="Logo Preview"
                        className="h-full w-full object-contain"
                      />
                    ) : logoPath && logoPath !== "/Uploads/logos/default-logo.png" ? (
                      <img
                        src={`${BASE_URL}${logoPath}`}
                        alt="Company Logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="relative bg-white rounded-md">
                      <input
                        id="logo"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png,image/svg+xml"
                        onChange={handleImageChange}
                      />
                      <label
                        htmlFor="logo"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG up to 2MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}
    </div>
  );
};

export default CompanySettings;