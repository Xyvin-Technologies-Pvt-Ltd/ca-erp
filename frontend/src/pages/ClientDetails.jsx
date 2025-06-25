import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { clientsApi } from "../api/clientsApi";
import { toast } from "react-toastify";

const ClientDetails = () => {
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

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        const response = await clientsApi.deleteClient(id);
        if (response.success) {
          toast.success("Client deleted successfully");
          navigate("/clients");
        } else {
          throw new Error(response.error || "Failed to delete client");
        }
      } catch (err) {
        toast.error(err.message || "Failed to delete client");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <Link
            to="/clients"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to="/clients"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Clients
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
        </div>
        <div className="flex space-x-4">
          <Link
            to={`/clients/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Client
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Client
          </button>
        </div>
      </div>

      {/* Client Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Client Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Details</h3>
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p className="mt-1">{client.contactName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="mt-1">{client.contactEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="mt-1">{client.contactPhone || "N/A"}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Business Details</h3>
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="mt-1">{client.industry || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="mt-1">{client.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Website</p>
                  <p className="mt-1">
                    {client.website ? (
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {client.website}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Additional Information</h3>
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="mt-1">{client.address || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap">{client.notes || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="mt-1">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails; 