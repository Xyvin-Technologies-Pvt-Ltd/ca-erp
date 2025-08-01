import { useState, useEffect } from "react";
import {
  fetchCompletedProjectsForInvoicing,
  markProjectAsInvoiced
} from "../api/projects";
import { Link } from "react-router-dom";
import { 
  CreditCard, 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Filter, 
  RefreshCw, 
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  Briefcase,
  TrendingUp,
  Receipt
} from "lucide-react";

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
  review: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  invoiced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-50 text-gray-700 border-gray-200",
};

const priorityColors = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-orange-50 text-orange-700 border-orange-200",
  low: "bg-green-50 text-green-700 border-green-200",
};

const invoiceStatusColors = {
  'Not Created': "bg-amber-50 text-amber-700 border-amber-200",
  'Created': "bg-emerald-50 text-emerald-700 border-emerald-200"
};

const Finance = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    client: "",
    selectedProjectIds: [],
  });
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [filters, setFilters] = useState({
    project: "",
    client: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [paginations, setPaginations] = useState({
    page: 1,
    total: 0,
    limit: 10,
  });
  const [totalPage, setTotalPage] = useState(0);
  const [pages, setPages] = useState([]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchCompletedProjectsForInvoicing({
        page: currentPage,
        limit: paginations.limit
      });
      console.log(data);
      
      const transformed = data.projects.map(project => ({
        ...project,
        cost: project.budget || 0,
      }));

      setProjects(transformed);
      setPaginations({
        page: data.page || currentPage,
        total: data.total || 0,
        limit: paginations.limit
      });

      // Calculate total pages
      const totalPages = Math.ceil(data.total / paginations.limit);
      setTotalPage(totalPages);

      // Generate page numbers array
      const pageNumbers = [];
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      setPages(pageNumbers);
    } catch (err) {
      console.error("Failed to fetch completed projects:", err);
      setError("Failed to load completed projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [currentPage]);

  const handlePageChanges = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleProjectSelection = (id) => {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(p => p.id));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      project: "",
      client: "",
    });
  };

  const openInvoiceModal = () => {
    if (!selectedProjects.length) {
      alert("Please select at least one project to invoice.");
      return;
    }

    const clientName = projects.find(p => selectedProjects.includes(p.id))?.client?.name || "Unknown Client";
    setInvoiceData({
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: new Date().toISOString().split("T")[0],
      client: clientName,
      selectedProjectIds: selectedProjects,
    });

    setShowInvoiceModal(true);
  };

  const handleCreateInvoice = async () => {
    try {
      setLoading(true);
      for (const id of selectedProjects) {
        await markProjectAsInvoiced(id, {
          invoiceNumber: invoiceData.invoiceNumber,
          invoiceDate: invoiceData.invoiceDate,
          invoiceStatus: 'Created'
        });
      }

      await loadProjects();
      setSelectedProjects([]);
      setSuccessMessage(`Invoice ${invoiceData.invoiceNumber} created successfully for ${invoiceData.client}.`);
      setShowSuccessMessage(true);
      setShowInvoiceModal(false);

      setTimeout(() => setShowSuccessMessage(false), 5000);
    } catch (err) {
      console.error("Invoice creation failed:", err);
      setError("Failed to create invoice. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (p.status !== 'completed') return false;
    if (filters.project && p.id !== filters.project) return false;
    if (filters.client && p.client?.id !== filters.client) return false;
    return true;
  });

  const client = Array.from(
    new Map(
      projects.map(p => [p.client?.id, {
        id: p.client?.id,
        name: p.client?.name,
      }])
    ).values()
  ).filter(c => c.id && c.name);

  const selectedProjectsData = projects.filter(p => selectedProjects.includes(p.id));
  const totalAmount = selectedProjectsData.reduce((sum, p) => sum + Number(p.cost || 0), 0);
  const totalHours = selectedProjectsData.reduce((sum, p) => sum + Number(p.actualHours || p.estimatedHours || 0), 0);

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-ping mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={loadProjects}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1c6ead] text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#1c6ead] rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Finance Dashboard
                </h1>
              </div>
              <p className="text-gray-600 text-lg">Manage project invoicing and financial tracking</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-gray-600">Ready to Invoice</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1c6ead]" />
                  <span className="text-gray-600">{projects.length} Projects</span>
                </div>
              </div>
              
              {/* <button
                onClick={openInvoiceModal}
                disabled={selectedProjects.length === 0}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                  selectedProjects.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                    : "bg-[#1c6ead]  text-white transform hover:scale-105"
                }`}
              >
                <Receipt className="w-4 h-4" />
                Create Invoice ({selectedProjects.length})
              </button> */}
            </div>
          </div>
        </div>

        {/* Enhanced Success Message */}
        {showSuccessMessage && (
          <div className="mb-8 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl shadow-lg overflow-hidden">
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
                onClick={() => setShowSuccessMessage(false)}
                className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Filter className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              </div>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 text-sm text-[#1c6ead] hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Filters
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Project
                </label>
                <select
                  id="project"
                  name="project"
                  value={filters.project}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Projects</option>
                  {projects.map((pro) => (
                    <option key={pro.id} value={pro.id}>
                      {pro.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Client
                </label>
                <select
                  id="client"
                  name="client"
                  value={filters.client}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Clients</option>
                  {client.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Selected Projects Summary */}
        {selectedProjects.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Projects Selected</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedProjects.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Total Amount</p>
                    <p className="text-2xl font-bold text-emerald-900">₹{totalAmount.toLocaleString("en-IN")}</p>
                  </div>
                </div>
                
                
              </div>
              
              <button
                onClick={openInvoiceModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1c6ead] text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Receipt className="w-4 h-4" />
                Create Invoice
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Projects List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Completed Projects ({projects.length})
                </h2>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  id="select-all"
                  name="select-all"
                  type="checkbox"
                  checked={selectedProjects.length === projects.length && projects.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-[#1c6ead] border-gray-300 rounded focus:ring-[#1c6ead] focus:ring-2"
                />
                <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                  Select All
                </label>
              </div>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="sr-only">Select</span>
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Details
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tasks
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost (₹)
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Date
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map((pro) => (
                    <tr
                      key={pro.id}
                      className={`transition-all duration-200 ${
                        selectedProjects.includes(pro.id)
                          ? "bg-blue-50 border-l-4 border-[#1c6ead]"
                          : pro.tasks?.length === 0
                          ? "bg-gray-50 text-gray-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(pro.id)}
                          onChange={() => handleProjectSelection(pro.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-[#1c6ead] focus:ring-2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              <Link
                                to={`/projects/${pro.id}`}
                                className={`hover:text-blue-600 transition-colors ${
                                  pro.tasks?.length === 0 ? "text-gray-500" : ""
                                }`}
                              >
                                {pro.name}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${
                                  statusColors[pro.status] || "bg-gray-50 text-gray-700 border-gray-200"
                                }`}
                              >
                                {pro.status}
                              </span>
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${
                                  priorityColors[pro.priority] || "bg-gray-50 text-gray-700 border-gray-200"
                                }`}
                              >
                                {pro.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {pro.client?.name || "No Client"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {pro.tasks ? `${pro.tasks.length} Tasks` : "0 Tasks"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {Number(pro.cost || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {pro.completedAt
                              ? new Date(pro.completedAt).toLocaleDateString()
                              : pro.updatedAt
                              ? new Date(pro.updatedAt).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full border ${
                            invoiceStatusColors[pro.invoiceStatus || "Not Created"]
                          }`}
                        >
                          {pro.invoiceStatus || "Not Created"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No completed projects</h3>
              <p className="text-gray-500">No completed projects are available for invoicing at the moment.</p>
            </div>
          )}

          {/* Enhanced Pagination Controls */}
          {projects.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChanges(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-300 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChanges(currentPage + 1)}
                    disabled={currentPage === totalPage}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      currentPage === totalPage
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-blue-600 hover:bg-blue-50 border border-gray-300 shadow-sm hover:shadow-md"
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * paginations.limit + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * paginations.limit, paginations.total)}
                      </span>{" "}
                      of <span className="font-medium">{paginations.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChanges(1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 rounded-l-xl border text-sm font-medium transition-all duration-200 ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300"
                        }`}
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePageChanges(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium transition-all duration-200 ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChanges(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 ${
                            page === currentPage
                              ? "z-10 bg-blue-50 border-[#1c6ead] text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-blue-300"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChanges(currentPage + 1)}
                        disabled={currentPage === totalPage}
                        className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium transition-all duration-200 ${
                          currentPage === totalPage
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePageChanges(totalPage)}
                        disabled={currentPage === totalPage}
                        className={`relative inline-flex items-center px-3 py-2 rounded-r-xl border text-sm font-medium transition-all duration-200 ${
                          currentPage === totalPage
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300"
                        }`}
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Create Invoice Modal */}
        {showInvoiceModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowInvoiceModal(false)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Create Invoice</h3>
                  </div>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    id="invoiceNumber"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        invoiceNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    id="invoiceDate"
                    value={invoiceData.invoiceDate}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        invoiceDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
                    Client
                  </label>
                  <input
                    type="text"
                    id="client"
                    value={invoiceData.client}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                    disabled
                  />
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Invoice Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-900">{selectedProjects.length}</p>
                      <p className="text-xs text-blue-600">Projects</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-900">₹{totalAmount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-emerald-600">Total Amount</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-900">{totalHours}</p>
                      <p className="text-xs text-purple-600">Total Hours</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateInvoice}
                  disabled={loading}
                  className="px-6 py-3 bg-[#1c6ead] text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    "Create Invoice"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finance;