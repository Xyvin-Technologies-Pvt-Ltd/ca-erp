import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { clientsApi } from "../api/clientsApi";
import { toast } from "react-toastify";
import { 
  CheckCircle, 
  AlertCircle, 
  User, 
  Building2, 
  FileText, 
  X,
  Loader2,
  Save,
  Plus
} from "lucide-react";

const ClientForm = ({ client = null, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!client;

  // Industry options for CA firm clients
  const industryOptions = [
    "IT Services",
    "Banking",
    "Oil & Gas",
    "Automotive",
    "Pharmaceuticals",
    "Conglomerate",
    "FMCG",
    "Telecom",
    "Manufacturing",
    "Real Estate",
    "Healthcare",
    "Insurance",
    "Retail",
    "Hospitality",
    "Education",
    "Logistics",
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: client || {
      name: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      industry: "",
      status: "active",
      address: "",
      website: "",
      gstin: "",
      pan: "",
      notes: "",
    },
  });

  // Watch address and notes for character counting
  const addressValue = watch("address");
  const notesValue = watch("notes");

  // Define max character limits
  const maxAddressLength = 200;
  const maxNotesLength = 500;

  useEffect(() => {
    if (client) {
      reset(client);
    }
  }, [client, reset]);

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      let result;
      if (isEditMode) {
        result = await clientsApi.updateClient(client._id, formData);
        
        // Show success toast for update
        toast.success(
          `Client "${formData.name}" updated successfully!`,
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      } else {
        result = await clientsApi.createClient(formData);
        
        // Show success toast for create
        toast.success(
          `Client "${formData.name}" created successfully!`,
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      }

      if (result.success) {
        // Trigger automatic refresh by calling onSuccess
        if (onSuccess) {
          onSuccess(result.data);
        }
        
        // Auto-refresh the page/component after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} client`);
      }
    } catch (error) {
      console.error("Error saving client:", error);
      
      // Show error toast
      toast.error(
        error.message || `Failed to ${isEditMode ? 'update' : 'create'} client. Please try again.`,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Blur Background Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onCancel}></div>
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
          {/* Enhanced Form Header */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-8 py-6 border-b border-gray-200 relative">
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-full p-2 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 text-white p-3 rounded-xl shadow-lg">
                {isEditMode ? (
                  <Building2 className="h-6 w-6" />
                ) : (
                  <Plus className="h-6 w-6" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? "Edit Client" : "Add New Client"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isEditMode ? "Update client information below" : "Fill in the details to create a new client"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Client Name*
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("name", { required: "Client name is required" })}
                      className={`w-full px-4 py-3 border ${errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:border-gray-400`}
                      placeholder="e.g. Acme Corporation"
                    />
                    {errors.name && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    {...register("contactName")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                    placeholder="e.g. John Smith"
                  />
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Contact Email*
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      {...register("contactEmail", {
                        required: "Contact email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                      className={`w-full px-4 py-3 border ${errors.contactEmail ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:border-gray-400`}
                      placeholder="e.g. john@acme.com"
                    />
                    {errors.contactEmail && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.contactEmail && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.contactEmail.message}
                    </p>
                  )}
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    {...register("contactPhone")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                    placeholder="e.g. +1 234 567 8900"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Industry
                  </label>
                  <select
                    {...register("industry")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="">Select industry</option>
                    {industryOptions.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Status
                  </label>
                  <select
                    {...register("status")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Website
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      {...register("website", {
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: "Please enter a valid URL starting with http:// or https://",
                        },
                      })}
                      className={`w-full px-4 py-3 border ${errors.website ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:border-gray-400`}
                      placeholder="e.g. https://www.acme.com"
                    />
                    {errors.website && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.website && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.website.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tax Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-100 p-2 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Tax Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GSTIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    GSTIN
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("gstin", {
                        pattern: {
                          value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                          message: "Please enter a valid GSTIN",
                        },
                      })}
                      className={`w-full px-4 py-3 border ${errors.gstin ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:border-gray-400`}
                      placeholder="e.g. 27AAACR5055K1Z5"
                    />
                    {errors.gstin && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.gstin && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.gstin.message}
                    </p>
                  )}
                </div>

                {/* PAN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    PAN
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("pan", {
                        pattern: {
                          value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                          message: "Please enter a valid PAN",
                        },
                      })}
                      className={`w-full px-4 py-3 border ${errors.pan ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:border-gray-400`}
                      placeholder="e.g. AAAAA0000A"
                    />
                    {errors.pan && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  {errors.pan && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.pan.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-xl">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Additional Information</h3>
              </div>

              <div className="space-y-6">
                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Address
                  </label>
                  <textarea
                    {...register("address")}
                    rows="3"
                    maxLength={maxAddressLength}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none hover:border-gray-400"
                    placeholder="Enter complete address"
                  ></textarea>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">Complete business address</p>
                    <p className={`text-sm ${(addressValue?.length || 0) > maxAddressLength * 0.8 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {addressValue?.length || 0}/{maxAddressLength}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Notes
                  </label>
                  <textarea
                    {...register("notes")}
                    rows="4"
                    maxLength={maxNotesLength}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none hover:border-gray-400"
                    placeholder="Additional notes about the client"
                  ></textarea>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">Any additional information or special requirements</p>
                    <p className={`text-sm ${(notesValue?.length || 0) > maxNotesLength * 0.8 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {notesValue?.length || 0}/{maxNotesLength}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-500  text-white rounded-xl  focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:from-blue-300 disabled:to-blue-400 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none font-medium min-w-[140px]"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    {isEditMode ? (
                      <Save className="h-5 w-5 mr-2" />
                    ) : (
                      <Plus className="h-5 w-5 mr-2" />
                    )}
                    {isEditMode ? "Update Client" : "Create Client"}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ClientForm;