import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import api from "../../api/axios";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Camera,
  Save
} from "lucide-react";
import countryCurrency from "../../api/countryCurrency.json";

const CompanySettings = () => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const [logoPath, setLogoPath] = useState("");
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [states, setStates] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [stateSearch, setStateSearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const countryInputRef = useRef(null);
  const stateInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const BASE_URL = "https://api-ca-erp.xyvin.com"; 
  

  // Function to upload logo
  const uploadLogo = async (formData) => {
    try {
      const response = await api.put("/settings/company/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data; // Return updated settings
    } catch (error) {
      console.error("Logo upload error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Failed to upload logo");
    }
  };

  useEffect(() => {
    setFilteredCountries(countryCurrency);
  }, []);

  const selectedCountry = watch('company.address.country');
  useEffect(() => {
    if (selectedCountry) {
      const found = countryCurrency.find(c => c.name.toLowerCase() === selectedCountry.toLowerCase());
      if (found && found.currency) {
        setValue('company.currency', found.currency);
      }
      
    }
  }, [selectedCountry, setValue]);

  // Function to load company settings
  const loadCompanySettings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/settings");
      const data = response.data.data;

      // Update settings state
      setSettings(data);
      setLogoPath(data.company?.logo || ""); // Set initial logo path

      // Reset form with fetched data
      reset({
        company: {
          name: data.company?.name || "",
          contactEmail: data.company?.contactEmail || "",
          phone: data.company?.phone || "",
          address: {
            country: data.company?.address?.country || "",
            state: data.company?.address?.state || "",
            city: data.company?.address?.city || "",
            pin: data.company?.address?.pin || "",
            street: data.company?.address?.street || "",
          },
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
    <div className="space-y-8">
      {/* Success and Error Messages */}
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

      {errorMessage && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage("")}
              className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-[#1c6ead] animate-spin" />
            <p className="text-gray-600 font-medium">Loading settings...</p>
          </div>
        </div>
      )}

      {!loading && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
                  <p className="text-gray-600">Essential company details and contact information</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Company Name */}
              <div>
                <label htmlFor="companyName" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="companyName"
                  {...register("company.name", { required: "Company name is required" })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="Enter your company name"
                />
                {errors.company?.name && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.company.name.message}</span>
                  </div>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <label htmlFor="contactEmail" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  {...register("company.contactEmail", { required: "Email is required" })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="company@example.com"
                />
                {errors.company?.contactEmail && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.company.contactEmail.message}</span>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  Phone <span className="text-red-500">*</span>
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="+1 (555) 123-4567"
                />
                {errors.company?.phone && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.company.phone.message}</span>
                  </div>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Country Autocomplete */}
                  <div className="relative">
                    <input
                      type="text"
                      ref={countryInputRef}
                      autoComplete="off"
                      {...register("company.address.country", { required: "Country is required" })}
                      value={countrySearch || watch("company.address.country") || ""}
                      onChange={e => {
                        setCountrySearch(e.target.value);
                        setShowCountryDropdown(true);
                        const filtered = countryCurrency.filter(c => c.name.toLowerCase().startsWith(e.target.value.toLowerCase()));
                        setFilteredCountries(filtered);
                        setValue("company.address.country", e.target.value);
                      }}
                      onFocus={() => setShowCountryDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      placeholder="Country"
                    />
                    {showCountryDropdown && filteredCountries.length > 0 && (
                      <ul className="absolute z-10 bg-white border border-gray-200 rounded-xl mt-1 w-full max-h-40 overflow-y-auto shadow-lg">
                        {filteredCountries.map((c, idx) => (
                          <li
                            key={c.name}
                            className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => {
                              setValue("company.address.country", c.name);
                              setCountrySearch(c.name);
                              setShowCountryDropdown(false);
                            }}
                          >
                            {c.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    {errors.company?.address?.country && (
                      <div className="flex items-center gap-2 mt-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-600 text-sm">{errors.company.address.country.message}</span>
                      </div>
                    )}
                  </div>
                  {/* State Autocomplete */}
                  <div className="relative">
                    <input
                      type="text"
                      ref={stateInputRef}
                      autoComplete="off"
                      {...register("company.address.state", { required: "State is required" })}
                      value={stateSearch || watch("company.address.state") || ""}
                      onChange={e => {
                        setStateSearch(e.target.value);
                        setShowStateDropdown(true);
                        const filtered = states.filter(s => s.toLowerCase().includes(e.target.value.toLowerCase()));
                        setFilteredStates(filtered);
                        setValue("company.address.state", e.target.value);
                      }}
                      onFocus={() => setShowStateDropdown(true)}
                      onBlur={() => setTimeout(() => setShowStateDropdown(false), 200)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      placeholder="State"
                    />
                    {showStateDropdown && filteredStates.length > 0 && (
                      <ul className="absolute z-10 bg-white border border-gray-200 rounded-xl mt-1 w-full max-h-40 overflow-y-auto shadow-lg">
                        {filteredStates.map((s, idx) => (
                          <li
                            key={s}
                            className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => {
                              setValue("company.address.state", s);
                              setStateSearch(s);
                              setShowStateDropdown(false);
                            }}
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                    {errors.company?.address?.state && (
                      <div className="flex items-center gap-2 mt-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-600 text-sm">{errors.company.address.state.message}</span>
                      </div>
                    )}
                  </div>
                  {/* City */}
                  <div>
                    <input
                      type="text"
                      {...register("company.address.city", { required: "City is required" })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      placeholder="City"
                    />
                    {errors.company?.address?.city && (
                      <div className="flex items-center gap-2 mt-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-600 text-sm">{errors.company.address.city.message}</span>
                      </div>
                    )}
                  </div>
                  {/* Pin */}
                  <div>
                    <input
                      type="text"
                      {...register("company.address.pin", { required: "Pin/Postal Code is required" })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      placeholder="Pin/Postal Code"
                    />
                    {errors.company?.address?.pin && (
                      <div className="flex items-center gap-2 mt-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-600 text-sm">{errors.company.address.pin.message}</span>
                      </div>
                    )}
                  </div>
                  {/* Street */}
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      {...register("company.address.street", { required: "Street/Address Line is required" })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      placeholder="Street/Address Line"
                    />
                    {errors.company?.address?.street && (
                      <div className="flex items-center gap-2 mt-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-600 text-sm">{errors.company.address.street.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <Globe className="w-4 h-4 text-gray-500" />
                  Website <span className="text-red-500">*</span>
                </label>
                <input
                  id="website"
                  type="url"
                  {...register("company.website", { required: "Website URL is required" })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  placeholder="https://www.company.com"
                />
                {errors.company?.website && (
                  <div className="flex items-center gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">{errors.company.website.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Settings Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Financial Details</h3>
                  <p className="text-gray-600">Configure financial and tax information</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tax ID */}
                <div>
                  <label htmlFor="taxId" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Tax ID / GST NUMBER <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="taxId"
                    {...register("company.taxId", { required: "Tax ID is required" })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                    placeholder="Enter Tax ID or GST Number"
                  />
                  {errors.company?.taxId && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 text-sm">{errors.company.taxId.message}</span>
                    </div>
                  )}
                </div>

                {/* Currency */}
                <div>
                  <label htmlFor="currency" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    Default Currency <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="currency"
                    type="text"
                    {...register("company.currency", { required: "Currency is required" })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-700 focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                    placeholder="Currency"
                    disabled
                  />
                  {errors.company?.currency && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 text-sm">{errors.company.currency.message}</span>
                    </div>
                  )}
                </div>

                {/* Financial Year Start */}
                <div>
                  <label htmlFor="financialYearStart" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    Financial Year Start <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="financialYearStart"
                    {...register("company.financialYearStart", { required: "Financial year start is required" })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
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
                    <div className="flex items-center gap-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 text-sm">{errors.company.financialYearStart.message}</span>
                    </div>
                  )}
                </div>

                {/* Date Format */}
                <div>
                  <label htmlFor="dateFormat" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    Date Format <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="dateFormat"
                    {...register("company.dateFormat", { required: "Date format is required" })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD-MMM-YYYY">DD-MMM-YYYY</option>
                  </select>
                  {errors.company?.dateFormat && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600 text-sm">{errors.company.dateFormat.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Branding Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Branding</h3>
                  <p className="text-gray-600">Upload and manage your company logo</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div>
                <label htmlFor="logo" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
                  <Camera className="w-4 h-4 text-gray-500" />
                  Company Logo
                </label>
                
                <div className="flex items-start gap-6">
                  {/* Logo Preview */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                      {tempImage?.preview ? (
                        <img
                          src={tempImage.preview}
                          alt="Logo Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : logoPath && logoPath !== "/Uploads/logos/default-logo.png" ? (
                        <img
                          src={`${BASE_URL}${logoPath}`}
                          alt="Company Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1">
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors bg-gray-50 hover:bg-blue-50 cursor-pointer"
                      onClick={() => logoInputRef.current && logoInputRef.current.click()}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <div className="space-y-2">
                        <span className="text-blue-600 hover:text-blue-700 font-medium">
                          Click or tap anywhere to upload
                        </span>
                        <span className="text-gray-600"> or drag and drop</span>
                        <input
                          id="logo"
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png,image/svg+xml"
                          onChange={handleImageChange}
                          ref={logoInputRef}
                        />
                        <p className="text-sm text-gray-500">
                          PNG, JPG, SVG up to 2MB
                        </p>
                      </div>
                    </div>
                    
                    {(tempImage || logoPath) && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800 font-medium">
                            {tempImage ? "New logo ready to upload" : "Current logo"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#1c6ead]  text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CompanySettings;