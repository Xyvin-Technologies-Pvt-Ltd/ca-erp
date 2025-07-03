import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CiEdit } from "react-icons/ci";
import { MdDelete, MdUpload, MdNoteAdd, MdTimeline, MdInfo, MdTaskAlt, MdFolder, MdNote } from "react-icons/md";
import { fetchProjectById, updateProject, deleteProject } from "../api/projects";
import ProjectTasks from "../components/ProjectTasks";
import ProjectForm from "../components/ProjectForm";
import ProjectTimeline from "../components/ProjectTimeline";
import { documentsApi } from "../api/documentsApi";
import { projectsApi } from "../api";
import ConfirmModal from "../components/settings/DeleteModal";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  completed: "bg-emerald-100 text-emerald-800",
  "in-progress": "bg-blue-100 text-blue-800",
  planning: "bg-purple-100 text-purple-800",
  "on-hold": "bg-amber-100 text-amber-800",
  cancelled: "bg-rose-100 text-rose-800",
};

const priorityColors = {
  high: "bg-rose-100 text-rose-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-emerald-100 text-emerald-800",
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isAddDocumentModalOpen, setIsAddDocumentModalOpen] = useState(false);
  const [isEditDocumentModalOpen, setIsEditDocumentModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editDocName, setEditDocName] = useState("");
  const [editDocDescription, setEditDocDescription] = useState("");
  const [isAddNoteModalOpen, setIsAddNotesModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [reloadDocuments, setReloadDocuments] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [reloadProject, setReloadProject] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const { role } = useAuth();

  const [docCurrentPage, setDocCurrentPage] = useState(1);
  const docsPerPage = 5;
  const [noteCurrentPage, setNoteCurrentPage] = useState(1);
  const notesPerPage = 5;

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const data = await fetchProjectById(id);
        setProject(data.data);
        setSelectedProject(id);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch project:", err);
        setError("Failed to load project details. Please try again later.");
        setLoading(false);
      }
    };

    loadProject();
  }, [id, reloadDocuments, reloadProject]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleProjectUpdate = async (updatedProject) => {
    setReloadProject((prev) => !prev);
    setIsEditing(false);
  };

  const handleUploadSuccess = (newDocument) => {
    setReloadDocuments(true);
    setIsAddDocumentModalOpen(false);
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
    formData.append("description", editDocDescription);
    formData.append("project", selectedProject);

    try {
      let response;
      if (editingDocument) {
        response = await documentsApi.updateDocument(editingDocument._id, formData);
      } else {
        response = await documentsApi.uploadDocument(formData);
      }
      handleUploadSuccess(response);
    } catch (err) {
      console.error("Failed to upload document:", err);
      setError("Failed to upload document. Please try again later.");
    }
  };

  const handleAddNote = async () => {
    if (!noteContent) {
      setError("Note content cannot be empty.");
      return;
    }

    try {
      let updatedNotes;
      if (editingNoteId) {
        updatedNotes = project.notes.map((note) =>
          note.id === editingNoteId ? { ...note, content: noteContent } : note
        );
      } else {
        const newNote = {
          id: Math.random().toString(36).substr(2, 9),
          content: noteContent,
          createdAt: new Date().toISOString(),
        };
        updatedNotes = [...project.notes, newNote];
      }

      const updatedProj = await projectsApi.updateProject(project.id, {
        notes: updatedNotes,
      });

      setReloadProject((prev) => !prev);
      setNoteContent("");
      setEditingNoteId(null);
      setIsAddNotesModalOpen(false);
    } catch (err) {
      console.error("Failed to add/update note:", err);
      setError("Failed to save note. Please try again later.");
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await documentsApi.updateDocument(docId, { deleted: true });
      setReloadDocuments((prev) => !prev);
    } catch (err) {
      console.error("Failed to delete document:", err);
      setError("Failed to delete document. Please try again later.");
    }
  };

  const handleEditDocumentClick = (doc) => {
    setEditingDocument(doc);
    setEditDocName(doc.name);
    setEditDocDescription(doc.editDocDescription || doc.description);
    setIsAddDocumentModalOpen(true);
  };

  const handleDeleteProject = async () => {
    try {
      setLoading(true);
      await projectsApi.updateProject(id, { deleted: true });
      setLoading(false);
      navigate("/projects", {
        state: { message: "Project deleted successfully" },
      });
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError("Failed to delete project. Please try again later.");
      setLoading(false);
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

  const handleEditNote = (note) => {
    setNoteContent(note.content);
    setEditingNoteId(note.id);
    setIsAddNotesModalOpen(true);
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      const updatedNotes = project.notes.map((note) =>
        note.id === noteId ? { ...note, deleted: true } : note
      );
      await projectsApi.updateProject(project.id, {
        notes: updatedNotes,
      });
      setReloadProject((prev) => !prev);
    } catch (err) {
      console.error("Failed to delete note:", err);
      setError("Failed to delete note. Please try again later.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-rose-50 p-4 sm:p-6 rounded-xl shadow-lg">
          <p className="text-rose-700 font-medium text-sm sm:text-base">{error}</p>
          <button
            onClick={() => navigate("/projects")}
            className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all duration-300 ease-in-out transform hover:scale-105 text-sm sm:text-base"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-amber-50 p-4 sm:p-6 rounded-xl shadow-lg">
          <p className="text-amber-700 font-medium text-sm sm:text-base">Project not found.</p>
          <button
            onClick={() => navigate("/projects")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105 text-sm sm:text-base"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
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
            Back to Project Details
          </button>
        </div>
        <ProjectForm
          project={project}
          onSuccess={handleProjectUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const activeDocuments = project.documents?.filter((doc) => !doc.deleted) || [];
  const totalDocPages = Math.ceil(activeDocuments.length / docsPerPage);

  const currentDocuments = activeDocuments.slice(
    (docCurrentPage - 1) * docsPerPage,
    docCurrentPage * docsPerPage
  );

  const filteredNotes = project.notes?.filter((note) => !note.deleted) || [];
  const totalNotePages = Math.ceil(filteredNotes.length / notesPerPage);

  const paginatedNotes = filteredNotes.slice(
    (noteCurrentPage - 1) * notesPerPage,
    noteCurrentPage * notesPerPage
  );

  const goToNextDocPage = () => {
    setDocCurrentPage((prev) => Math.min(prev + 1, totalDocPages));
  };

  const goToPrevDocPage = () => {
    setDocCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-b from-gray-50 to-gray-100 animate-fade-in">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulseSlow {
            0% { opacity: 1; }
            50% { opacity: 0.8; }
            100% { opacity: 1; }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
          }
          .animate-pulse-slow {
            animation: pulseSlow 2s infinite;
          }
        `}
      </style>
      {/* Header with back button and actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
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
          Back to Projects
        </button>
        {role !== "staff" && (
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center text-sm sm:text-base"
            >
              <CiEdit className="mr-1 w-4 h-4 sm:w-4 sm:h-4" />             Edit Project

            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center text-sm sm:text-base"
            >
              <MdDelete className="mr-1 w-4 h-4 sm:w-4 sm:h-4" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Project header */}
      <div className="bg-white shadow-lg rounded-xl mb-6 transform transition-all duration-500 ease-in-out">
        <div className="px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="mt-1 text-sm text-gray-500">Client: {project.client?.name}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${statusColors[project.status] || "bg-gray-100"} animate-pulse-slow`}
              >
                {project.status}
              </span>
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${priorityColors[project.priority] || "bg-gray-100"} animate-pulse-slow`}
              >
                {project.priority} Priority
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-xs sm:text-sm font-semibold inline-block text-blue-600">
                  {project.completionPercentage}% Complete
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs sm:text-sm font-semibold inline-block text-blue-600">
                  {project.completedTasks}/{project.totalTasks} Tasks
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-3 mt-2 text-xs flex rounded bg-blue-100">
              <div
                style={{ width: `${project.completionPercentage}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000 ease-in-out"
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-lg rounded-xl">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto space-x-2 p-2 whitespace-nowrap">
            {[
              { name: "overview", icon: <MdInfo className="mr-1 w-4 h-4 sm:w-5 sm:h-5" /> },
              { name: "tasks", icon: <MdTaskAlt className="mr-1 w-4 h-4 sm:w-5 sm:h-5" /> },
              { name: "documents", icon: <MdFolder className="mr-1 w-4 h-4 sm:w-5 sm:h-5" /> },
              { name: "notes", icon: <MdNote className="mr-1 w-4 h-4 sm:w-5 sm:h-5" /> },
              { name: "datalog", icon: <MdTimeline className="mr-1 w-4 h-4 sm:w-5 sm:h-5" /> },
            ].map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center px-3 sm:px-4 py-2 border-b-2 text-xs sm:text-sm font-medium transition-all duration-200 shrink-0 ${
                  activeTab === tab.name
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Project Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm text-gray-500 block">Timeline</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(project.startDate)} to {formatDate(project.dueDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">Budget</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(project.budget)}
                      </span>
                    </div>
                    {project.spent && (
                      <div>
                        <span className="text-sm text-gray-500 block">Spent</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(project.spent)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Team Members</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {project.team?.length > 0 ? (
                      <ul className={`grid gap-y-4 gap-x-4 sm:gap-x-6 ${project.team.length > 5 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {project.team.map((member) => (
                          <li key={member.id} className="flex items-center hover:bg-gray-100 p-2 rounded-md transition-all duration-200">
                            <div className="flex-shrink-0">
                              {member.avatar ? (
                                <img
                                  src={`${import.meta.env.VITE_BASE_URL}${member.avatar}`}
                                  alt={member.name}
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium text-sm">
                                  {member.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.role}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No team members assigned to this project yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {project.description && (
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Project Description</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{project.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "tasks" && (
            <ProjectTasks projectId={id} tasks={project.tasks} />
          )}

          {activeTab === "documents" && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Documents</h3>
                {project.documents?.length > 0 && role !== "staff" && (
                  <button
                    onClick={() => setIsAddDocumentModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center text-sm sm:text-base"
                  >
                    <MdUpload className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Add Document
                  </button>
                )}
              </div>
              {project.documents?.length > 0 ? (
                <>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                      {currentDocuments.map((doc) => (
                        <li key={doc._id} className="p-4 hover:bg-gray-100 transition-all duration-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center">
                              <svg
                                className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 mr-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                ></path>
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                <p className="text-xs text-gray-500">
                                  Uploaded by {doc.uploadedBy.name} on {new Date(doc.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2 mt-2 sm:mt-0">
                              <button
                                onClick={() => handleDownloadDocument(doc._id, doc.name)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                              >
                                <svg
                                  className="w-4 h-4 sm:w-5 sm:h-5"
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
                              {role !== "staff" && (
                                <>
                                  <button
                                    onClick={() => handleEditDocumentClick(doc)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                  >
                                    <CiEdit size={16} className="sm:w-4 sm:h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDocToDelete(doc)}
                                    className="text-rose-600 hover:text-rose-800 transition-colors duration-200"
                                  >
                                    <MdDelete size={16} className="sm:w-4 sm:h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {totalDocPages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-2 border-t gap-4">
                      <button
                        onClick={goToPrevDocPage}
                        disabled={docCurrentPage === 1}
                        className={`flex items-center text-xs sm:text-sm font-medium p-1 transition-all duration-200 ${
                          docCurrentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-800"
                        }`}
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
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
                        Previous
                      </button>
                      <span className="text-xs sm:text-sm text-gray-600">
                        Page {docCurrentPage} of {totalDocPages}
                      </span>
                      <button
                        onClick={goToNextDocPage}
                        disabled={docCurrentPage === totalDocPages}
                        className={`flex items-center text-xs sm:text-sm font-medium p-1 transition-all duration-200 ${
                          docCurrentPage === totalDocPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-800"
                        }`}
                      >
                        Next
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center animate-fade-in">
                  <p className="text-gray-500 mb-4 text-sm sm:text-base">No documents uploaded for this project yet.</p>
                  {role !== "staff" && (
                    <button
                      onClick={() => setIsAddDocumentModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center mx-auto text-sm sm:text-base"
                    >
                      <MdUpload className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Upload Document
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Notes</h3>
                {project.notes?.length > 0 && role !== "staff" && (
                  <button
                    onClick={() => setIsAddNotesModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center text-sm sm:text-base"
                  >
                    <MdNoteAdd className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Add Note
                  </button>
                )}
              </div>
              {project.notes?.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {paginatedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
                      >
                        <p className="text-sm text-gray-700">{note.content}</p>
                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 gap-2">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-700 mr-2">
                              {note.author?.name || "Unknown Author"}
                            </span>
                            <span>
                              {new Date(note.createdAt).toLocaleDateString()} at{" "}
                              {new Date(note.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {role !== "staff" && (
                            <div className="flex space-x-2 mt-2 sm:mt-0">
                              <button
                                onClick={() => handleEditNote(note)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                              >
                                <CiEdit size={16} className="sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => setNoteToDelete(note)}
                                className="text-rose-600 hover:text-rose-800 transition-colors duration-200"
                              >
                                <MdDelete size={16} className="sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalNotePages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 border-t gap-4">
                      <button
                        onClick={() => setNoteCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={noteCurrentPage === 1}
                        className={`flex items-center text-xs sm:text-sm font-medium transition-all duration-200 ${
                          noteCurrentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-800"
                        }`}
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                        Previous
                      </button>
                      <span className="text-xs sm:text-sm text-gray-600">
                        Page {noteCurrentPage} of {totalNotePages}
                      </span>
                      <button
                        onClick={() => setNoteCurrentPage((prev) => Math.min(prev + 1, totalNotePages))}
                        disabled={noteCurrentPage === totalNotePages}
                        className={`flex items-center text-xs sm:text-sm font-medium transition-all duration-200 ${
                          noteCurrentPage === totalNotePages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-800"
                        }`}
                      >
                        Next
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center animate-fade-in">
                  <p className="text-gray-500 mb-4 text-sm sm:text-base">No notes added for this project yet.</p>
                  {role !== "staff" && (
                    <button
                      onClick={() => setIsAddNotesModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center mx-auto text-sm sm:text-base"
                    >
                      <MdNoteAdd className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Add Note
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "datalog" && (
            <div className="animate-fade-in">
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Project Activity Log</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Timeline of all activities for this project including document uploads, reminders, and other actions.
                </p>
              </div>
              <ProjectTimeline projectId={id} />
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in px-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-full sm:max-w-md w-full shadow-xl transform transition-all duration-300">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-500 mb-6 text-sm sm:text-base">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all duration-200 transform hover:scale-105 flex items-center text-sm sm:text-base"
              >
                <MdDelete className="mr-1 w-4 h-4 sm:w-4 sm:h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {isAddDocumentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in px-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-full sm:max-w-md w-full shadow-xl transform transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                {editingDocument ? "Edit Document" : "Upload Document"}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                onClick={() => setIsAddDocumentModalOpen(false)}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors duration-200">
                  <div className="flex justify-center">
                    <svg
                      className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
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
                      <span className="text-blue-600 hover:text-blue-500">Click to upload</span>
                      {" or drag and drop"}
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.docx,.xlsx,.pptx"
                        required
                      />
                    </label>
                    {file && (
                      <p className="mt-3 text-sm text-gray-800 font-medium">
                        Selected File: <span className="text-blue-700">{file.name}</span>
                      </p>
                    )}
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
                  value={editDocDescription}
                  onChange={(e) => setEditDocDescription(e.target.value)}
                  placeholder="Enter document description"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
                  required
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddDocumentModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center text-sm sm:text-base"
                >
                  <MdUpload className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in px-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-full sm:max-w-md w-full shadow-xl transform transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">{editingNoteId ? "Edit Note" : "Add Note"}</h3>
              <button
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                onClick={() => setIsAddNotesModalOpen(false)}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label
                htmlFor="noteContent"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Note Content
              </label>
              <textarea
                id="noteContent"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your note here"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-sm"
                required
              ></textarea>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={() => setIsAddNotesModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center text-sm sm:text-base"
              >
                <MdNoteAdd className="mr-2 w-4 h-4 sm:w-5 sm:h-5" /> {editingNoteId ? "Update Note" : "Add Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={async () => {
          try {
            await documentsApi.updateDocument(docToDelete._id, { deleted: true });
            setDocToDelete(null);
            setReloadDocuments((prev) => !prev);
          } catch (err) {
            setError("Failed to delete document.");
          }
        }}
        title="Confirm Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.name}"? This cannot be undone.`}
      />
      <ConfirmModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={async () => {
          try {
            const updatedNotes = project.notes.map((note) =>
              note.id === noteToDelete.id ? { ...note, deleted: true } : note
            );
            await projectsApi.updateProject(project.id, {
              notes: updatedNotes,
            });
            setNoteToDelete(null);
            setReloadProject((prev) => !prev);
          } catch (err) {
            setError("Failed to delete note.");
          }
        }}
        title="Delete Note"
        message={`Are you sure you want to delete this note? This action cannot be undone.`}
      />
    </div>
  );
};

export default ProjectDetail;