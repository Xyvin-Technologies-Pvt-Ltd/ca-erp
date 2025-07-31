import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  File,
  FileSpreadsheet,
  FileImage,
  Calendar,
  User,
  FolderOpen,
  HardDrive,
  Plus,
} from "lucide-react";
import { documents } from "../dummyData/documents";
import { documentsApi } from "../api/documentsApi";
import { fetchProjects } from "../api/projects";
import { userApi } from "../api/userApi";
import ConfirmModal from "../components/settings/DeleteModal";
import { projectsApi } from "../api";
import useHeaderStore from "../stores/useHeaderStore";

// Enhanced File type icons using lucide-react
const getFileIcon = (type) => {
  if (type.includes("pdf")) {
    return <FileText className="w-8 h-8 text-red-500" />;
  } else if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    type.includes("xlsx")
  ) {
    return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
  } else if (
    type.includes("word") ||
    type.includes("document") ||
    type.includes("docx")
  ) {
    return <FileText className="w-8 h-8 text-blue-600" />;
  } else if (
    type.includes("presentation") ||
    type.includes("powerpoint") ||
    type.includes("pptx")
  ) {
    return <FileImage className="w-8 h-8 text-orange-500" />;
  } else {
    return <File className="w-8 h-8 text-gray-500" />;
  }
};

const getFileExtension = (fileUrl) => {
  const parts = fileUrl.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
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
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [documentsPerPage] = useState(10);
  const [users, setUsers] = useState([]);
  const [paginations, setPaginations] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const { profileDropdown,profileIsActive } = useHeaderStore();
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [documentsRes, projectsRes, usersRes] = await Promise.all([
        documentsApi.getAllDocuments({
          ...filters,
          search: searchTerm,
          page: currentPage,
          limit: 10,
        }),
        projectsApi.getAllProjects(),
        userApi.Allusers(),
      ]);

      setAllDocuments(documentsRes);
      setFilteredDocuments(documentsRes.data);
      setUsers(usersRes.data?.data?.data || []);
      setProjects(projectsRes.data);
      setPaginations({
        page: currentPage,
        total: documentsRes.total,
        limit: filteredDocuments.pagination?.prev?.limit || 10,
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
  }, [filters, searchTerm, currentPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await documentsApi.deleteDocument(documentId);
      setSuccessMessage("Document deleted successfully.");
      fetchInitialData();
      setShowConfirmDelete(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Error deleting document. Please try again.");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    const originalFileName = file.name;
    const fileNameWithoutExtension = originalFileName.replace(/\.[^/.]+$/, "");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", fileNameWithoutExtension);
    formData.append("description", description);
    formData.append("project", selectedProject);

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
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download document:", error);
      alert("Error downloading document. Please try again.");
    }
  };

  const handlePreviewDocument = async (documentId, filename) => {
    try {
      const blob = await documentsApi.downloadDocument(documentId);
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      );
      setPreviewDocument({ url, filename });
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Failed to preview document:", error);
      alert("Error previewing document. Please try again.");
    }
  };

  const handleUploadSuccess = (newDocument) => {
    setShowUploadModal(false);
    setSuccessMessage("Document uploaded successfully");
    fetchInitialData();
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
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

  const totalPage = Math.ceil(paginations.total / paginations.limit);
  const pages = Array.from({ length: Math.min(totalPage, 5) }, (_, i) => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPage, start + 4);
    return start + i <= end ? start + i : null;
  }).filter(Boolean);

  if (loading && filteredDocuments.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1c6ead] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Document Library
              </h1>
              <p className="text-gray-600">
                Manage and organize your project documents
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className={
                profileDropdown === true
                  ? `opacity-10`
                  : ` inline-flex items-center px-6 py-3 bg-[#1c6ead] text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`
              }
            >
              <Plus className="w-5 h-5 mr-2" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl shadow-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-sm relative">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
              {error}
            </div>
            <button
              className="absolute top-2 right-2 p-2 hover:bg-red-100 rounded-lg transition-colors"
              onClick={() => setError(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Filter className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Search & Filter
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                />
              </div>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
              >
                <option value="">All File Types</option>
                <option value="application/pdf">PDF Documents</option>
                <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
                  Excel Spreadsheets
                </option>
                <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                  Word Documents
                </option>
                <option value="application/vnd.openxmlformats-officedocument.presentationml.presentation">
                  PowerPoint Presentations
                </option>
              </select>
              <select
                value={filters.project}
                onChange={(e) => handleFilterChange("project", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.uploadedBy}
                onChange={(e) =>
                  handleFilterChange("uploadedBy", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
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

        {/* Documents List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-gray-500" />
                Documents ({filteredDocuments.length})
              </h2>
              {filteredDocuments.length > 0 && (
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <HardDrive className="w-4 h-4" />
                  {Math.ceil(
                    filteredDocuments.reduce(
                      (acc, doc) => acc + (doc.fileSize || 0),
                      0
                    ) /
                      1024 /
                      1024
                  )}{" "}
                  MB total
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredDocuments.length > 0 ? (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Uploaded By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredDocuments.map((document) => (
                    <tr
                      key={document.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-4">
                            {getFileIcon(getFileExtension(document.fileUrl))}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {document.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {document.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {document.project ? (
                          <Link
                            to={`/projects/${document.project._id}`}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-150"
                          >
                            {document.project.name}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            No Project
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {document.uploadedBy.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {formatDate(document.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 font-medium">
                          {formatFileSize(document.fileSize)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getFileExtension(document.fileUrl) === "pdf" && (
                            <button
                              onClick={() =>
                                handlePreviewDocument(
                                  document._id,
                                  document.name
                                )
                              }
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150"
                              title="Preview"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDownloadDocument(
                                document._id,
                                document.name
                              )
                            }
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-150"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setShowConfirmDelete(document._id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No documents found
                </h3>
                <p className="text-gray-500">
                  {loading
                    ? "Loading documents..."
                    : "No documents match your search criteria."}
                </p>
              </div>
            )}
          </div>

          {/* Enhanced Pagination */}
          {filteredDocuments.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChanges(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "text-gray-700 bg-white hover:bg-gray-50 border border-gray-300"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChanges(currentPage + 1)}
                    disabled={currentPage === totalPage}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      currentPage === totalPage
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "text-gray-700 bg-white hover:bg-gray-50 border border-gray-300"
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
                        {Math.min(
                          currentPage * paginations.limit,
                          paginations.total
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{paginations.total}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChanges(1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 rounded-l-lg border text-sm font-medium ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePageChanges(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChanges(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? "z-10 bg-blue-50 border-[#1c6ead] text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChanges(currentPage + 1)}
                        disabled={currentPage === totalPage}
                        className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                          currentPage === totalPage
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePageChanges(totalPage)}
                        disabled={currentPage === totalPage}
                        className={`relative inline-flex items-center px-3 py-2 rounded-r-lg border text-sm font-medium ${
                          currentPage === totalPage
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
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

        {/* Enhanced Upload Modal */}
        {showUploadModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Upload className="w-6 h-6 text-blue-600" />
                    Upload Document
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                    onClick={() => setShowUploadModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleUploadSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                      onClick={() =>
                        document.getElementById("fileInput").click()
                      }
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <span className="text-blue-600 hover:text-blue-700 font-medium">
                            Click to upload
                          </span>
                          {" or drag and drop"}
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, Word, Excel, PowerPoint up to 10MB
                        </p>
                      </div>
                    </div>
                    <input
                      id="fileInput"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.docx,.xlsx,.pptx"
                      required
                    />
                    {file && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">
                          Selected: {file.name}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter document description..."
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="project"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Project (Optional)
                    </label>
                    <select
                      id="project"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#1c6ead] to-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Upload Document
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Delete Confirmation Modal */}
        {showConfirmDelete && (
          <ConfirmModal
            isOpen={!!showConfirmDelete}
            title="Delete Document"
            message="Are you sure you want to delete this document? This action cannot be undone."
            onClose={() => setShowConfirmDelete(null)}
            onConfirm={() => {
              handleDeleteDocument(showConfirmDelete);
              setShowConfirmDelete(null);
            }}
          />
        )}

        {/* Enhanced Preview Modal */}
        {showPreviewModal && previewDocument && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] mx-4 flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-blue-600" />
                  Preview: {previewDocument.filename}
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                  onClick={() => {
                    window.URL.revokeObjectURL(previewDocument.url);
                    setShowPreviewModal(false);
                    setPreviewDocument(null);
                  }}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 p-6">
                <iframe
                  src={previewDocument.url}
                  className="w-full h-full rounded-xl border border-gray-200"
                  title={`Preview of ${previewDocument.filename}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
