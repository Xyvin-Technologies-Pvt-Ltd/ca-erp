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
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => navigate(`/clients/${id}`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Client Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
        >
          ← Back to Client Details
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
      </div>

      {client && (
        <ClientForm
          client={client}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default ClientEdit; 