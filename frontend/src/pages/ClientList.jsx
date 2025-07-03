import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { clientsApi } from "../api/clientsApi";
import CreateClientModal from "../components/CreateClientModal";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

// Status badge component with enhanced styling
const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100";
      case "inactive":
        return "bg-slate-50 text-slate-700 border-slate-200 ring-slate-100";
      case "onboarding":
        return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 ring-slate-100";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle()} border ring-1 shadow-sm transition-all duration-200`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-60"></span>
      {status}
    </span>
  );
};

// Enhanced client card with better visual hierarchy
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link
        to={`/clients/${client._id}`}
        className="block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 overflow-hidden backdrop-blur-sm"
      >
        {/* Header with gradient accent */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 relative">
              {client.logo ? (
                <img
                  src={client.logo}
                  alt={client.name}
                  className="w-16 h-16 rounded-2xl object-cover shadow-md ring-2 ring-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md ring-2 ring-white">
                  {getInitials(client.name)}
                </div>
              )}
              {/* Online indicator */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            
            <div className="ml-5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200 truncate group-hover:text-blue-600">
                  {client.name}
                </h3>
                <StatusBadge status={client.status} />
              </div>
              <p className="mt-2 text-sm text-gray-500 font-medium flex items-center">
                <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                {client.industry || "N/A"}
              </p>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-50 pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Contact Person</p>
                <p className="font-semibold text-gray-900 truncate">{toTitleCase(client.contactName) || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Email</p>
                <p className="font-semibold text-gray-900 truncate text-blue-600">{client.contactEmail}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Phone</p>
                <p className="font-semibold text-gray-900">{formatPhoneNumber(client.contactPhone) || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Created</p>
                <p className="font-semibold text-gray-900">
                  {new Date(client.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Hover indicator */}
          <div className="mt-4 flex items-center text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span>View Details</span>
            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
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
    setCurrentPage(1);
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
        <motion.div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"
          ></motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 p-8 rounded-2xl border border-red-200 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadClients}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 cursor-pointer font-medium shadow-md hover:shadow-lg"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Enhanced Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Client Management
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your clients efficiently with advanced filtering and sorting
          </p>
        </motion.div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl flex items-center"
        >
          <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Client
        </motion.button>
      </div>

      {/* Enhanced Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm mb-8 border border-gray-100"
      >
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Search Clients
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, contact, email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-text bg-white/80 backdrop-blur-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Status Filter
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer bg-white/80 backdrop-blur-sm"
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
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Industry Filter
            </label>
            <select
              id="industry"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer bg-white/80 backdrop-blur-sm"
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
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Sort Options
            </label>
            <div className="flex space-x-3">
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="flex-grow px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer bg-white/80 backdrop-blur-sm"
              >
                <option value="name">Name</option>
                <option value="industry">Industry</option>
                <option value="status">Status</option>
                <option value="projectCount">Projects</option>
                <option value="onboardingDate">Onboarding Date</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer bg-white/80 backdrop-blur-sm"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </motion.button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetFilters}
            className="px-6 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer bg-white/80 backdrop-blur-sm font-medium"
          >
            Reset All Filters
          </motion.button>
        </div>
      </motion.div>

      {/* Enhanced Results Info */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-600 font-medium bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-100">
            {clientsData.clients.length === 1
              ? "Showing 1 client"
              : `Showing ${clientsData.clients.length} of ${clientsData.total} clients`}
          </p>
          
          {/* Quick stats */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-emerald-600">
                {clientsData.clients.filter(c => c.status === 'active').length}
              </span> Active
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-blue-600">
                {clientsData.clients.filter(c => c.status === 'onboarding').length}
              </span> Onboarding
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-amber-600">
                {clientsData.clients.filter(c => c.status === 'pending').length}
              </span> Pending
            </div>
          </div>
        </div>
        
        {/* Enhanced Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-100">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-white"
            >
              Previous
            </motion.button>
            <span className="text-sm text-gray-600 font-medium px-3">
              Page {currentPage} of {totalPages}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-white"
            >
              Next
            </motion.button>
          </div>
        )}
      </div>

      {/* Enhanced Empty State */}
      {clientsData.clients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm p-12 text-center border border-gray-100"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            No clients found
          </h2>
          <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
            {searchQuery || statusFilter !== "all" || industryFilter !== "all"
              ? "Try adjusting your filters or search query to find what you're looking for."
              : "Get started by adding your first client to begin managing your business relationships."}
          </p>
          {!searchQuery &&
            statusFilter === "all" &&
            industryFilter === "all" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl"
              >
                Add Your First Client
              </motion.button>
            )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {clientsData.clients.map((client, index) => (
              <motion.div
                key={client._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ClientCard client={client} />
              </motion.div>
            ))}
          </AnimatePresence>
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