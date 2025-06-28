import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { clientsApi } from "../api/clientsApi";
import CreateClientModal from "../components/CreateClientModal";
import { toast } from "react-toastify";

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "onboarding":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle()}`}
    >
      {status}
    </span>
  );
};

// Client card component
const ClientCard = ({ client }) => {
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.warn(`Failed to format date: ${dateString}`, error.message);
      return "N/A";
    }
  };
 const toTitleCase = (str) => {
  if (!str) return str;
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const formatPhoneNumber = (phone) => {
    if (!phone) return phone;
    const cleaned = phone.replace(/[^\d+]/g, "");
    const withCountryCode = cleaned.match(/^\+(\d{1,3})(\d{10})$/);
    if (withCountryCode) {
      const countryCode = withCountryCode[1];
      const digits = withCountryCode[2];
      return `+${countryCode} ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    const noCountryCode = cleaned.match(/^\d{10}$/);
    if (noCountryCode) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    const usFormat = cleaned.match(/^\+1(\d{10})$/);
    if (usFormat) {
      const digits = usFormat[1];
      return `+1 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };
  return (
    <Link
      to={`/clients/${client._id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {client.logo ? (
              <img
                src={client.logo}
                alt={client.name}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium text-lg">
                {getInitials(client.name)}
              </div>
            )}
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {client.name}
              </h3>
              <StatusBadge status={client.status} />
            </div>
            <p className="mt-1 text-sm text-gray-600">{client.industry || "N/A"}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Contact Person</p>
              <p className="font-medium">{toTitleCase(client.contactName) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium truncate">{client.contactEmail}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">{formatPhoneNumber(client.contactPhone) || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium">
                {new Date(client.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const ClientList = () => {
  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  // State for clients data
  const [clientsData, setClientsData] = useState({
    clients: [],
    total: 0,
    industries: [],
    statuses: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();

  // Fetch clients data
  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare query parameters
      const params = {
        page: currentPage,
        limit,
        sort: `${sortOrder === 'desc' ? '-' : ''}${sortBy}`,
      };

      // Add filters if they are set
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (industryFilter !== 'all') params.industry = industryFilter;

      const response = await clientsApi.getAllClients(params);
      
      if (response.success) {
        setClientsData(prevData => ({
          ...prevData,
          clients: response.data,
          total: response.total,
          industries: response.filters?.industries || [],
          statuses: response.filters?.statuses || []
        }));
      } else {
        throw new Error(response.error || "Failed to fetch clients");
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      setError(err.message || "Failed to load clients. Please try again later.");
      setLoading(false);
      toast.error(err.message || "Failed to load clients");
    }
  };

  // Fetch clients when filters, sorting, or pagination changes
  useEffect(() => {
    loadClients();
  }, [currentPage, limit, searchQuery, statusFilter, industryFilter, sortBy, sortOrder]);

  // Check for success message from redirect
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleClientCreated = (newClient) => {
    setClientsData(prevData => ({
      ...prevData,
      clients: [newClient, ...prevData.clients],
      total: prevData.total + 1
    }));
    // toast.success("Client created successfully");
    setIsModalOpen(false);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setIndustryFilter("all");
    setSortBy("name");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Calculate total pages
  const totalPages = Math.ceil(clientsData.total / limit);

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
            onClick={loadClients}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // console.log(clientsData,"clients");
  

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add New Client
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, contact, email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              {clientsData?.statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="industry"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Industry
            </label>
            <select
              id="industry"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Industries</option>
              {clientsData?.industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="sort"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sort By
            </label>
            <div className="flex space-x-2">
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="industry">Industry</option>
                <option value="status">Status</option>
                <option value="projectCount">Projects</option>
                <option value="onboardingDate">Onboarding Date</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results info */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {/* Showing {clientsData.clients.length} of {clientsData.total} clients */}
          {clientsData.clients.length === 1
            ? "Showing 1 client"
            : `Showing ${clientsData.clients.length} of ${clientsData.total} clients`}
        </p>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {clientsData.clients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            No clients found
          </h2>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== "all" || industryFilter !== "all"
              ? "Try adjusting your filters or search query."
              : "Get started by adding your first client."}
          </p>
          {!searchQuery &&
            statusFilter === "all" &&
            industryFilter === "all" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add New Client
              </button>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientsData.clients.map((client) => (
            <ClientCard key={client._id} client={client} />
          ))}
        </div>
      )}

      <CreateClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
};

export default ClientList;