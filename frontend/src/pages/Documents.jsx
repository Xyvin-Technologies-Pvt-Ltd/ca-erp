import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { documents } from "../dummyData/documents";
import { documentsApi } from "../api/documentsApi";
import { fetchProjects } from "../api/projects";
import { userApi } from "../api/userApi";
import ConfirmModal from "../components/settings/DeleteModal";
import { projectsApi } from "../api";

// File type icons
const getFileIcon = (type) => {
  if (type.includes("pdf")) {
    return (
      <svg
        className="w-8 h-8 text-red-500"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  } else if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    type.includes("xlsx")
  ) {
    return (
      <svg
        className="w-8 h-8 text-green-600"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
          clipRule="evenodd"
        />
      </svg>
    );
  } else if (
    type.includes("word") ||
    type.includes("document") ||
    type.includes("docx")
  ) {
    return (
      <svg
        className="w-8 h-8 text-blue-600"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  } else if (
    type.includes("presentation") ||
    type.includes("powerpoint") ||
    type.includes("pptx")
  ) {
    return (
      <svg
        className="w-8 h-8 text-orange-500"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    );
  } else {
    return (
      <svg
        className="w-8 h-8 text-gray-500"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
};
const getFileExtension = (fileUrl) => {
  const parts = fileUrl.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

const Documents = () => {
  const [allDocuments, setAllDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    project: "",
    uploadedBy: "",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [file, setFile] = useState(null); // State to hold the selected file
  const [description, setDescription] = useState(""); // State for document description
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [documentsPerPage] = useState(10); // or 5, depending on what you want
  const [users, setUsers] = useState([]);
  const [paginations, setPaginations] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [previewDocument, setPreviewDocument] = useState(null);
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [documentsRes, projectsRes, usersRes] = await Promise.all([
        documentsApi.getAllDocuments({ ...filters,search: searchTerm, page: currentPage, limit: 10 }),
        projectsApi.getAllProjects(),
        userApi.Allusers()

      ]);

      setAllDocuments(documentsRes);
      console.log(documentsRes.total, "555554444444444445555")
      setFilteredDocuments(documentsRes.data);
      setUsers(usersRes.data?.data?.data || []);
      setProjects(projectsRes.data); // Assuming response shape
      console.log(allDocuments, "555555555")
      setPaginations({
        page: currentPage,
        total: documentsRes.total,
        limit: filteredDocuments.pagination?.prev?.limit || 10

      });
      setLoading(false);
    } catch (err) {
      console.error("Failed to load documents or projects:", err);
      setError("Something went wrong while fetching data.");
      setLoading(false);
    }
  };

  const handlePageChanges = (newPage) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    fetchInitialData();
  }, [filters, searchTerm,currentPage]);



  const handleSearchChange = (e) => {
    console.log(e.target.value)
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // const handleDeleteDocument = async (documentId) => {
  //   try {
  //     // Make the API call to delete the document (you need to replace this with the correct API call)
  //     await documentsApi.deleteDocument(documentId); // Assuming the API method is called `deleteDocument`

  //     // Optionally, update the UI after deleting (e.g., removing the document from the state)
  //     // If you're managing the list of documents with state, you can filter out the deleted document.
  //     setFilteredDocuments(filteredDocuments.filter(doc => doc.id !== documentId));

  //     alert("Document deleted successfully.");
  //   } catch (error) {
  //     console.error("Failed to delete document:", error);
  //     alert("Error deleting document. Please try again.");
  //   }
  // };
  const handleDeleteDocument = async (documentId) => {
    try {
      await documentsApi.deleteDocument(documentId);
      setSuccessMessage("Document deleted successfully.");

      // Refresh the document list
      fetchInitialData();

      // Optionally reset modal state
      setShowConfirmDelete(null);

      // Clear message after a few seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Error deleting document. Please try again.");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Set the selected file
  };
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    // Get file name without extension
    const originalFileName = file.name;
    const fileNameWithoutExtension = originalFileName.replace(/\.[^/.]+$/, "");
    console.log(fileNameWithoutExtension,"ddddddddddddgrtrteryteyrt")
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", fileNameWithoutExtension); // Automatically set name
    formData.append("description", description);
    formData.append("project", selectedProject); // Optional
    console.log(formData)
    try {
      const newDocument = await documentsApi.uploadDocument(formData);
      handleUploadSuccess(newDocument);
    } catch (err) {
      console.error("Failed to upload document:", err);
      setError("Failed to upload document. Please try again later.");
    }
  };



  const handleDownloadDocument = async (documentId, filename) => {
    try {
      const blob = await documentsApi.downloadDocument(documentId);

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename || "document"); // fallback if no name
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up
    } catch (error) {
      console.error("Failed to download document:", error);
      alert("Error downloading document. Please try again.");
    }
  };
  const handlePreviewDocument = async (documentId, filename) => {
    try {
      const blob = await documentsApi.downloadDocument(documentId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      setPreviewDocument({ url, filename });
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Failed to preview document:", error);
      alert("Error previewing document. Please try again.");
    }
  }; 

  const getProjectName = (projectId) => {
    const project = projectOptions.find((p) => p.id === projectId);
    return project ? project.name : "No Project";
  };

  const getUserName = (userId) => {
    const user = userOptions.find((u) => u.id === userId);
    return user ? user.name : "Unknown User";
  };
  const totalPage = Math.ceil(paginations.total / paginations.limit);
  const pages = Array.from({ length: totalPage }, (_, i) => i + 1);
  if (loading && filteredDocuments.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // const handleUploadSuccess = (newDocument) => {
  //   setAllDocuments((prev) => [newDocument, ...prev]);
  //   setShowUploadModal(false);
  //   setSuccessMessage("Document uploaded successfully");

  //   // Clear success message after 3 seconds
  //   setTimeout(() => {
  //     setSuccessMessage("");
  //   }, 3000);
  // };

   const handleUploadSuccess = (newDocument) => {
    // setAllDocuments((prev) => [newDocument, ...prev]);
    setShowUploadModal(false);
    setSuccessMessage("Document uploaded successfully");

    // Clear success message after 3 seconds
      fetchInitialData();

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(1);
  return `${size} ${units[i]}`;
};
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          Upload Document
        </button>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
      )}

      {/* Search and filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search Documents
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name or description"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-full md:w-1/5">
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                File Type
              </label>
              <select
                id="type"
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
              
                <option value="application/pdf">PDF</option>
                <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">Excel</option>
                <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word</option>
                <option value="application/vnd.openxmlformats-officedocument.presentationml.presentation">PowerPoint</option>
              </select>
            </div>
            <div className="w-full md:w-1/5">
              <label
                htmlFor="project"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project
              </label>
              <select
                id="project"
                value={filters.project}
                onChange={(e) => handleFilterChange("project", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/5">
              <label
                htmlFor="uploadedBy"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Uploaded By
              </label>
              <select
                id="uploadedBy"
                value={filters.uploadedBy}
                onChange={(e) =>
                  handleFilterChange("uploadedBy", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Documents list */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Documents ({filteredDocuments.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          {filteredDocuments.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Document
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Project
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Uploaded By
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                   File Size
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center items-center">
                        <div className="flex-shrink-0">
                          {getFileIcon(getFileExtension(document.fileUrl))}
                        </div>
                        <div className="ml-4 text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {document.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {document.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {document.project ? (
                        <Link
                          to={`/projects/${document.project._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {document.project.name}
                        </Link>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {document.uploadedBy.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {formatDate(document.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {formatFileSize(document.fileSize)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-3">
                        {getFileExtension(document.fileUrl) === "pdf" && (
                          <button
                            className="text-grey-200 hover:text-grey-300"
                            onClick={() => handlePreviewDocument(document._id, document.name)}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              ></path>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              ></path>
                            </svg>
                          </button>
                        )}
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleDownloadDocument(document._id, document.name)}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            ></path>
                          </svg>
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => setShowConfirmDelete(document._id)}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              {loading
                ? "Loading documents..."
                : "No documents found matching your criteria."}
            </div>
          )}
        </div>
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

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Document
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowUploadModal(false)}
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
            <form
              onSubmit={handleUploadSubmit} // Use the handleUploadSubmit function
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <div className="flex justify-center">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      ></path>
                    </svg>
                  </div>
                  <div className="mt-2">
                    <label className="text-sm text-gray-600 cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500">
                        Click to upload
                      </span>
                      {" or drag and drop"}
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.docx,.xlsx,.pptx"
                        required
                      />
                    </label>

                    {/* <input
                      type="file"
                      onChange={handleFileChange} // Capture file input
                      className="hidden"
                      accept=".pdf,.docx,.xlsx,.pptx"
                      required // Make it required
                    /> */}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, Word, Excel, PowerPoint up to 10MB
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description} // Bind the value to state
                  onChange={(e) => setDescription(e.target.value)} // Update state on change
                  placeholder="Enter document description"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required // Make it required
                ></textarea>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="project"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Project (Optional)
                </label>
                <select
                  id="project"
                  value={selectedProject} // Bind the value to state
                  onChange={(e) => setSelectedProject(e.target.value)} // Update state on change
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <ConfirmModal
          isOpen={!!showConfirmDelete} // ✅ pass this
          title="Confirm Delete"
          message="Are you sure you want to delete this document? This action cannot be undone."
          onClose={() => setShowConfirmDelete(null)} // renamed to match ConfirmModal prop
          onConfirm={() => {
            handleDeleteDocument(showConfirmDelete);
            setShowConfirmDelete(null);
          }}
        />
)}
      {/* {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this document? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(showConfirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )} */}
       {showPreviewModal && previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Preview: {previewDocument.filename}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => {
                  window.URL.revokeObjectURL(previewDocument.url);
                  setShowPreviewModal(false);
                  setPreviewDocument(null);
                }}
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="flex-1">
              <iframe
                src={previewDocument.url}
                className="w-full h-full border-0"
                title={`Preview of ${previewDocument.filename}`}
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
