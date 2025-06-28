import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { clientsApi } from "../api/clientsApi";
import { toast } from "react-toastify";

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
      } else {
        result = await clientsApi.createClient(formData);
      }

      if (result.success) {
        toast.success(`Client ${isEditMode ? 'updated' : 'created'} successfully`);
        if (onSuccess) onSuccess(result.data);
      } else {
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} client`);
      }
    } catch (error) {
      console.error("Error saving client:", error);
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} client`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6">
        {isEditMode ? "Edit Client" : "Add New Client"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name*
            </label>
            <input
              type="text"
              {...register("name", { required: "Client name is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Acme Corporation"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              {...register("contactName")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. John Smith"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email*
            </label>
            <input
              type="email"
              {...register("contactEmail", {
                required: "Contact email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. john@acme.com"
            />
            {errors.contactEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              {...register("contactPhone")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. +1 234 567 8900"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <select
              {...register("industry")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register("status")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              {...register("website", {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: "Please enter a valid URL starting with http:// or https://",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. https://www.acme.com"
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
            )}
          </div>

          {/* GSTIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GSTIN
            </label>
            <input
              type="text"
              {...register("gstin", {
                pattern: {
                  value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                  message: "Please enter a valid GSTIN",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 27AAACR5055K1Z5"
            />
            {errors.gstin && (
              <p className="mt-1 text-sm text-red-600">{errors.gstin.message}</p>
            )}
          </div>

          {/* PAN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PAN
            </label>
            <input
              type="text"
              {...register("pan", {
                pattern: {
                  value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                  message: "Please enter a valid PAN",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. AAAAA0000A"
            />
            {errors.pan && (
              <p className="mt-1 text-sm text-red-600">{errors.pan.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              {...register("address")}
              rows="3"
              maxLength={maxAddressLength}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter complete address"
            ></textarea>
            <p className="mt-1 text-sm text-gray-500 text-right">
              {addressValue?.length || 0}/{maxAddressLength} characters
            </p>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register("notes")}
              rows="3"
              maxLength={maxNotesLength}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes about the client"
            ></textarea>
            <p className="mt-1 text-sm text-gray-500 text-right">
              {notesValue?.length || 0}/{maxNotesLength} characters
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditMode ? "Updating..." : "Creating..."}
              </span>
            ) : (
              <span>{isEditMode ? "Update Client" : "Create Client"}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
