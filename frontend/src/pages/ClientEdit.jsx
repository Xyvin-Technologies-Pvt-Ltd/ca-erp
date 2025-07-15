import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { clientsApi } from "../api/clientsApi";
import { toast } from "react-toastify";
import ClientForm from "../components/ClientForm";

const ClientEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        const response = await clientsApi.getClientById(id);
        if (response.success) {
          setClient(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch client details");
        }
      } catch (err) {
        console.error("Error loading client:", err);
        setError(err.message || "Failed to load client details");
        toast.error(err.message || "Failed to load client details");
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [id]);

  const handleSuccess = (updatedClient) => {
    // toast.success("Client updated successfully");
    navigate(`/clients/${id}`, { state: { message: "Client updated successfully" } });
  };

  const handleCancel = () => {
    navigate(`/clients/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1c6ead] border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Client</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/clients/${id}`)}
            className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Client Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <button
              onClick={handleCancel}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 group"
            >
              <svg className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Client Details
            </button>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-[#1c6ead] to-indigo-500 text-white p-3 rounded-lg shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Client</h1>
                <p className="text-gray-600 mt-1">
                  {client ? `Editing ${client.name}` : "Update client information"}
                </p>
              </div>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="bg-white bg-opacity-50 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#1c6ead] rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Edit Mode</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-[#1c6ead]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Client Information Form</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Update the client details below. All changes will be saved when you submit the form.
          </p>
        </div>

        <div className="p-8">
          {client && (
            <div className="relative">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg opacity-30 pointer-events-none"></div>
              
              {/* Form wrapper */}
              <div className="relative">
                <ClientForm
                  client={client}
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-amber-800 font-medium">Editing Tips</h3>
            <p className="text-amber-700 mt-1 text-sm">
              Make sure to fill in all required fields before saving. You can cancel at any time to return to the client details without saving changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientEdit;