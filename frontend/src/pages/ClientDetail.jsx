import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchClientById, updateClient, deleteClient } from "../api/clients";
import ClientForm from "../components/ClientForm";

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  onboarding: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
};

const projectStatusColors = {
  "in-progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  upcoming: "bg-purple-100 text-purple-800",
};

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchClientById(id);
        setClient(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch client:", err);
        setError("Failed to load client details. Please try again later.");
        setLoading(false);
      }
    };

    loadClient();
  }, [id]);

  const handleClientUpdate = async (updatedClient) => {
    setClient(updatedClient);
    setIsEditing(false);
  };

  const handleDeleteClient = async () => {
    try {
      setLoading(true);
      await deleteClient(id);
      setLoading(false);
      navigate("/clients", {
        state: { message: "Client deleted successfully" },
      });
    } catch (err) {
      console.error("Failed to delete client:", err);
      setError("Failed to delete client. Please try again later.");
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1c6ead]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => navigate("/clients")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-700">Client not found.</p>
          <button
            onClick={() => navigate("/clients")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Clients
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
            Back to Client Details
          </button>
        </div>
        <ClientForm
          client={client}
          onSuccess={handleClientUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with back button */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate("/clients")}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          Back to Clients
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex-grow">
          Client Details
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Client
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Client information */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xl">
                {client.name.charAt(0)}
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {client.name}
                </h2>
                <p className="text-sm text-gray-500">{client.industry}</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[client.status] || "bg-gray-100"
                }`}
              >
                {client.status?.charAt(0).toUpperCase() +
                  client.status?.slice(1) || "Unknown Status"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm text-gray-500 block">
                    Contact Person
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {client.contactPerson}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Email</span>
                  <a
                    href={`mailto:${client.email}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {client.email}
                  </a>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Phone</span>
                  <a
                    href={`tel:${client.phone}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {client.phone}
                  </a>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Website</span>
                  {client.website ? (
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {client.website}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">Not provided</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Business Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm text-gray-500 block">GSTIN</span>
                  <span className="text-sm font-medium text-gray-900">
                    {client.gstin || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">PAN</span>
                  <span className="text-sm font-medium text-gray-900">
                    {client.pan || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">Address</span>
                  <span className="text-sm font-medium text-gray-900">
                    {client.address || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500 block">
                    Onboarding Date
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(client.onboardingDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {client.description && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Description
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{client.description}</p>
              </div>
            </div>
          )}

          {/* Projects */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Projects</h3>
              <Link
                to={`/projects/new?clientId=${client.id}`}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Add Project
              </Link>
            </div>

            {client.projects && client.projects.length > 0 ? (
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <ul className="divide-y divide-gray-200">
                  {client.projects.map((project) => (
                    <li key={project.id} className="p-4 hover:bg-gray-100">
                      <Link
                        to={`/projects/${project.id}`}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {project.name}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`mr-2 px-2 py-1 rounded-full text-xs font-medium ${
                              projectStatusColors[project.status] ||
                              "bg-gray-100"
                            }`}
                          >
                            {project.status
                              ?.replace("-", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            ></path>
                          </svg>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                <p className="text-gray-500 mb-4">
                  No projects found for this client.
                </p>
                <Link
                  to={`/projects/new?clientId=${client.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create First Project
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this client? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;
