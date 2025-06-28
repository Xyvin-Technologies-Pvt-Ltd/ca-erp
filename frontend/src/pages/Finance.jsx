import { useState, useEffect } from "react";
import {
  fetchCompletedProjectsForInvoicing,
  markProjectAsInvoiced
} from "../api/projects";
import { Link } from "react-router-dom";


const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-blue-100 text-blue-800",
  review: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  invoiced: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-green-100 text-green-800",
};
const invoiceStatusColors = {
  'Not Created': "bg-yellow-100 text-yellow-800",
  'Created': "bg-green-100 text-green-800"
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
          invoiceStatus: 'Created' // Add this line
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


// console.log(projects,'consolved project');

  // const project = [
  //   ...new Map(
  //     projects.map((pro) => [
  //       pro.task?.id,
  //       { id: task.project?.id, name: task.project?.name },
  //     ])
  //   ).values(),
  // ].filter((project) => project.id);


  // console.log(projects,"hiii");


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
      <div className="flex justify-center items-center h-screen">
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
            onClick={loadProjects}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render your main UI here (tables, filters, invoice modal, etc.
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
          Finance - Project Invoicing
        </h1>
        <button
          onClick={openInvoiceModal}
          disabled={selectedProjects.length === 0}
          className={`px-4 py-2 ${
            selectedProjects.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          Create Invoice ({selectedProjects.length})
        </button>
      </div>


      {/* Success message */}
      {showSuccessMessage && (
        <div className="mb-6 bg-green-50 p-4 rounded-md flex justify-between items-center">
          <p className="text-green-700">{successMessage}</p>
          <button
            onClick={() => setShowSuccessMessage(false)}
            className="text-green-700 hover:text-green-900 focus:outline-none"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-2 md:mb-0">
            Filters
          </h2>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="project"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              project
            </label>
            <select
              id="project"
              name="project"
              value={filters.project}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All project</option>
              {projects.map((pro) => (
                <option key={pro.id} value={pro.id}>
                  {pro.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="project"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              client
            </label>
            <select
              id="client"
              name="client"
              value={filters.client}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All clients</option>
              {client.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Tasks Summary */}
      {selectedProjects.length > 0 && (
        <div className="bg-blue-50 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <p className="text-sm text-blue-800">
                <span className="font-medium">{selectedProjects.length}</span>{" "}
                project selected
              </p>
              <p className="text-sm text-blue-800">
                Total Amount:{" "}
                <span className="font-medium">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </p>
              <p className="text-sm text-blue-800">
                Total Hours: <span className="font-medium">{totalHours}</span>
              </p>
            </div>
            <div className="mt-3 md:mt-0">
              <button
                onClick={openInvoiceModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* project List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Completed Projects ({projects.length}) {/* Show all projects here */}
          </h2>
          <div className="flex items-center">
            <input
              id="select-all"
              name="select-all"
              type="checkbox"
              checked={selectedProjects.length === projects.length && projects.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="select-all" className="ml-2 text-sm text-gray-700">
              Select All
            </label>
          </div>
        </div>

  {/* If there are no completed projects, show a message */}
  {projects.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <span className="sr-only">Select</span>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Project
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Client
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Total Tasks
            </th>
            {/* <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Hours
            </th> */}
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Cost (₹)
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Completion Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice 
            </th>
          </tr>
        </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredProjects.map((pro) => (
          <tr
            key={pro.id}
            className={`${
              selectedProjects.includes(pro.id)
                ? "bg-blue-50"
                : pro.tasks?.length === 0
                ? "bg-gray-100 text-gray-500"
                : "hover:bg-gray-50"
            }`}
          >
            <td className="px-6 py-4 whitespace-nowrap">
              <input
                type="checkbox"
                checked={selectedProjects.includes(pro.id)}
                onChange={() => handleProjectSelection(pro.id)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    <Link
                      to={`/projects/${pro.id}`}
                      className={pro.tasks?.length === 0 ? "text-gray-500" : "hover:text-blue-600"}
                    >
                      {pro.name}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-500 flex mt-1">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusColors[pro.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {pro.status}
                    </span>
                    <span
                      className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        priorityColors[pro.priority] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {pro.priority}
                    </span>
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-500">
                {pro.client?.name || "No Client"}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">
                {pro.tasks ? `${pro.tasks.length} Tasks` : "0 Tasks"}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">
                {Number(pro.cost || 0).toLocaleString("en-IN")}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {pro.completedAt
                ? new Date(pro.completedAt).toLocaleDateString()
                : pro.updatedAt
                ? new Date(pro.updatedAt).toLocaleDateString()
                : ""}
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
    <div className="px-6 py-8 text-center text-gray-500">
      No completed project available for invoicing.
    </div>
  )}

  {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChanges(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-900 border border-gray-300"
                  }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChanges(currentPage + 1)}
                disabled={currentPage === totalPage}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === totalPage
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-900 border border-gray-300"
                  }`}
              >
                Next
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
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChanges(1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                      }`}
                  >
                    <span className="sr-only">First</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {pages.map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChanges(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChanges(currentPage + 1)}
                    disabled={currentPage === totalPage}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${currentPage === totalPage
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                      }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
</div>


      {/* Create Invoice Modal */}
      {showInvoiceModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
            ></div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              ​
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-title"
                    >
                      Create Invoice
                    </h3>
                    <div className="mt-4">
                      <div className="mb-4">
                        <label
                          htmlFor="invoiceNumber"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label
                          htmlFor="invoiceDate"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label
                          htmlFor="client"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Client
                        </label>
                        <input
                          type="text"
                          id="client"
                          value={invoiceData.client}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                          disabled
                        />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700 mb-2">
                          Invoice Summary:
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">
                            {selectedProjects.length}
                          </span>{" "}
                          projects
                        </p>
                        <p className="text-sm text-gray-700">
                          Total Amount:{" "}
                          <span className="font-medium">
                            ₹{totalAmount.toLocaleString("en-IN")}
                          </span>
                        </p>
                        <p className="text-sm text-gray-700">
                          Total Hours:{" "}
                          <span className="font-medium">{totalHours}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCreateInvoice}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {loading ? "Processing..." : "Create Invoice"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;