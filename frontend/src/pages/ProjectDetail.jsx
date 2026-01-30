import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CiEdit } from "react-icons/ci";
import {
  MdDelete,
  MdUpload,
  MdNoteAdd,
  MdTimeline,
  MdInfo,
  MdTaskAlt,
  MdFolder,
  MdNote,
} from "react-icons/md";
import {
  fetchProjectById,
  updateProject,
  deleteProject,
} from "../api/projects";
import ProjectTasks from "../components/ProjectTasks";
import ProjectForm from "../components/ProjectForm";
import ProjectTimeline from "../components/ProjectTimeline";
import { documentsApi } from "../api/documentsApi";
import { projectsApi } from "../api";
import ConfirmModal from "../components/settings/DeleteModal";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { TrashIcon } from "@heroicons/react/24/outline";

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
  const [tabLoading, setTabLoading] = useState(false);
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

  const [showClientDetails, setShowClientDetails] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const data = await fetchProjectById(id);
        setProject(data.data);
        setSelectedProject(id);
        setLoading(false);
        setReloadDocuments(false);
      } catch (err) {
        console.error("Failed to fetch project:", err);
        setError("Failed to load project details. Please try again later.");
        setLoading(false);
      }
    };

    loadProject();
  }, [id, reloadDocuments, reloadProject]);

  const handleTabChange = async (tabName) => {
    if (tabName === "overview") {
      setTabLoading(true);
      try {
        const data = await fetchProjectById(id);
        setProject(data.data);
        setActiveTab(tabName);
      } catch (err) {
        console.error("Failed to fetch project for overview:", err);
        setError("Failed to load overview. Please try again later.");
      } finally {
        setTabLoading(false);
      }
    } else {
      setActiveTab(tabName);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleProjectUpdate = async (updatedProject) => {
    setReloadProject((prev) => !prev);
    setIsEditing(false);
    toast.success("Project updated successfully");
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
    if (editDocDescription !== "") {
      formData.append("description", editDocDescription);
    }
    formData.append("project", selectedProject);
    console.log(editDocDescription);
    try {
      let response;
      if (editingDocument) {
        response = await documentsApi.updateDocument(
          editingDocument._id,
          formData
        );
      } else {
        response = await documentsApi.uploadDocument(formData);
      }
      setReloadDocuments(true);
      console.log(response);
      handleUploadSuccess(response);
    } catch (err) {
      console.error("Failed to upload document:", err);
      setError("Failed to upload document. Please try again later.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent browser from opening file
    e.stopPropagation();
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
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
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

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
      toast.success("Project deleted successfully");
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#1c6ead]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-rose-50 p-4 sm:p-6 rounded-xl shadow-lg">
          <p className="text-rose-700 font-medium text-sm sm:text-base">
            {error}
          </p>
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
      <div className="max-w-4xl  mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-amber-50 p-4 sm:p-6 rounded-xl shadow-lg">
          <p className="text-amber-700 font-medium text-sm sm:text-base">
            Project not found.
          </p>
          <button
            onClick={() => navigate("/projects")}
            className="mt-4 px-4 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 text-sm sm:text-base"
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
            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200 text-sm sm:text-base"
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

  const activeDocuments =
    project.documents?.filter((doc) => !doc.deleted) || [];
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gradient-to-br from-gray-50 to-blue-60 animate-fade-in">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulseSlow {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
          @keyframes fillBar {
            from { width: 0%; }
            to { width: ${project.completionPercentage}%; }
          }
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out;
          }
          .animate-pulse-slow {
            animation: pulseSlow 2.5s infinite ease-in-out;
          }
          .animate-fill-bar {
            animation: fillBar 1.5s ease-out forwards;
          }
        `}
      </style>
      {/* Header with back button and actions */}
      <div className="mb-8 flex   flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center text-[#1c6ead] hover:text-blue-700 transition-all duration-300 transform hover:scale-105 group text-sm sm:text-base"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:-translate-x-1 transition-transform duration-300"
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
            />
          </svg>
          Back to Projects
        </button>
        {role !== "staff" && (
          <div className="flex  flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-5 py-2.5 bg-[#1c6ead] text-white rounded-lg hover:from-[#1c6ead] hover:to-blue-600 transition-all duration-200 shadow-sm hover:shadow-md  cursor-pointer"
            >
              <CiEdit className="w-5 h-5 mr-2 text-white" />
              Edit Project
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center px-5 py-2.5 bg-red-500 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-sm hover:shadow-md  cursor-pointer"
            >
              <TrashIcon className="h-5 w-5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Project header */}
      <div className="border border-blue-100 bg-white rounded-2xl mb-8 transfor transition-all duration-500 ease-in-out">
        <div className="px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-2xl capitalize sm:text-3xl font-bold text-gray-800 flex items-center">
                <MdFolder className="w-7h-7 mr-2 text-[#1c6ead]" />
                {project.name}
              </h1>
              <div className="flex items-center space-x-3 mt-3">
                <button
                  type="button"
                  className={`flex items-center px-4 py-1.5 rounded-full  text-xs bg-blue-50 text-[#1c6ead] font-medium shadow-sm hover:bg-blue-100 focus:outline-none transition-all duration-200 ${showClientDetails ? "ring-2 ring-blue-300" : ""
                    }`}
                  onClick={() => setShowClientDetails((v) => !v)}
                >
                  {/* <svg className="w-5 h-5 mr-2 text-[#1c6ead]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg> */}
                  Client Information
                  <svg
                    className={`w-4 h-4 ml-2 transition-transform duration-200 ${showClientDetails ? "rotate-180" : ""
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {/* Status and Priority Chips */}
                <span
                  className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status] || "bg-gray-200 text-gray-800"
                    } shadow-sm`}
                >
                  {project.status}
                </span>
                <span
                  className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${priorityColors[project.priority] ||
                    "bg-gray-200 text-gray-800"
                    } shadow-sm`}
                >
                  {project.priority} Priority
                </span>
              </div>
              {/* Client Info Card (collapsible) */}
              {showClientDetails && project.client && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-6 shadow animate-fade-in max-w-2xl">
                  <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-[#1c6ead]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    Client Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="">
                      <span className="w-40 min-w-[8rem] font-medium text-gray-700 ">
                        Name <span className="pl-18 pr-1">:</span>
                      </span>
                      <span className="text-gray-900 ">
                        {project.client.name || "N/A"}
                      </span>
                    </div>
                    <div className="">
                      <span className="w-40 min-w-[8rem] font-medium text-gray-700 ">
                        Contact Person<span className="pl-1 pr-1">:</span>
                      </span>
                      <span className="text-gray-900 ">
                        {project.client.contactName || "N/A"}
                      </span>
                    </div>
                    <div className="">
                      <span className="w-40 min-w-[8rem] font-medium text-gray-700 ">
                        Contact Number<span className="pl-2 pr-1">:</span>
                      </span>
                      <span className="text-gray-900 ">
                        {project.client.contactPhone || "N/A"}
                      </span>
                    </div>
                    <div className="">
                      <span className="w-40 min-w-[8rem] font-medium text-gray-700 ">
                        Email<span className="pl-16 pr-1">:</span>
                      </span>
                      <span className="text-gray-900 ">
                        {project.client.contactEmail || "N/A"}
                      </span>
                    </div>
                    <div className="">
                      <span className="w-40 min-w-[8rem] font-medium text-gray-700 ">
                        Industry<span className="pl-15 pr-1">:</span>
                      </span>
                      <span className="text-gray-900 ">
                        {project.client.industry || "N/A"}
                      </span>
                    </div>
                    <div className="">
                      <span className="w-40 min-w-[8rem] font-medium text-gray-700 ">
                        GSTIN<span className="pl-15 pr-1">:</span>
                      </span>
                      <span className="text-gray-900 ">
                        {project.client.gstin || "N/A"}
                      </span>
                    </div>
                    <div className="">
                      <span className="w-40 min-w-[8rem] font-medium text-gray-700 ">
                        PAN<span className="pl-21 pr-1">:</span>
                      </span>
                      <span className="text-gray-900 ">
                        {project.client.pan || "N/A"}
                      </span>
                    </div>
                    <div className="">
                      <span className="w-40 min-w-[8rem] font-medium text-gray-700 ">
                        CIN<span className="pl-19 pr-1">:</span>
                      </span>
                      <span className="text-gray-900 ">
                        {project.client.cin || "N/A"}
                      </span>
                    </div>
                    <div className="">
                      <span className="w-40 min-w-[8rem] font-medium text-gray-700 ">
                        Currency Format<span className="pl-1 pr-1">:</span>
                      </span>
                      <span className="text-gray-900 ">
                        {project.client.currencyFormat || "N/A"}
                      </span>
                    </div>
                    <div className="">
                      <span className="w-40 min-w-[8rem] font-medium text-gray-700 ">
                        Directors<span className="pl-10 pr-1">:</span>
                      </span>
                      <span className="text-gray-900 ">
                        {Array.isArray(project.client.directors) &&
                          project.client.directors.length > 0
                          ? project.client.directors.join(", ")
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-6">
          <div className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-[#1c6ead]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-semibold text-[#1c6ead]">
                  {project.completionPercentage}% Complete
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-sm font-semibold text-blue-600 flex items-center">
                  <MdTaskAlt className="w-5 h-5 mr-2" />
                  {project.completedTasks}/{project.totalTasks} Tasks
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-3 mt-3 text-xs flex rounded-full bg-gray-200">
              <div
                style={{ width: `${project.completionPercentage}%` }}
                className="shadow-sm flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#1c6ead] rounded-full animate-fill-bar"
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto space-x-3 p-3 whitespace-nowrap">
            {[
              {
                name: "overview",
                icon: <MdInfo className="mr-2 w-5 h-5 text-grey-500" />,
              },
              {
                name: "tasks",
                icon: <MdTaskAlt className="mr-2 w-5 h-5 text-grey-500" />,
              },
              {
                name: "documents",
                icon: <MdFolder className="mr-2 w-5 h-5 text-grey-500" />,
              },
              {
                name: "notes",
                icon: <MdNote className="mr-2 w-5 h-5 text-grey-300" />,
              },
              {
                name: "datalog",
                icon: <MdTimeline className="mr-2 w-5 h-5 text-grey-500" />,
              },
            ].map((tab) => (
              <button
                key={tab.name}
                onClick={() => handleTabChange(tab.name)}
                className={`flex items-center hover:cursor-pointer px-4 py-2 border-b-2 text-sm font-medium transition-all duration-300 ease-in-out shrink-0 ${activeTab === tab.name
                    ? "border-[#1c6ead] text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-[#1c6ead] hover:bg-gray-50"
                  } rounded-t-lg`}
              >
                {tab.icon}
                {tab.name.charAt(0).toUpperCase() + tab.name.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && tabLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#1c6ead]"></div>
            </div>
          ) : activeTab === "overview" ? (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-[#1c6ead]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                    </svg>
                    Project Details
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div>
                      <span className="text-sm text-gray-600 block">
                        Timeline
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(project.startDate)} to{" "}
                        {formatDate(project.dueDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block">
                        Budget
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(project.amount)}
                      </span>
                    </div>
                    {project.spent && (
                      <div>
                        <span className="text-sm text-gray-600 block">
                          Spent
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(project.spent)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-[#1c6ead]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Team Members
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                    {project.team?.length > 0 ? (
                      <ul
                        className={`grid gap-y-2 gap-x-2 sm:gap-x-4 ${project.team.length >= 3
                            ? "grid-cols-2"
                            : "grid-cols-1"
                          }`}
                      >
                        {project.team.map((member) => (
                          <li
                            key={member.id}
                            className="flex items-center hover:bg-gray-100 p-3 rounded-lg transition-all duration-200"
                          >
                            <div className="flex-shrink-0">
                              {member.avatar ? (
                                <img
                                  src={`${member.avatar}`}
                                  alt={member.name}
                                  className="h-10 w-10 rounded-full border border-gray-200"
                                  onError={(e) => {
                                    e.target.outerHTML = `
                                    <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                      <span class="text-[#1c6ead] font-medium text-sm">
                                        ${member.name
                                        ?.charAt(0)
                                        .toUpperCase() || ""
                                      }
                                      </span>
                                    </div>`;
                                  }}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1c6ead] font-medium text-sm border border-gray-200">
                                  {member.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {member.role}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.184-.66.39-.959C15.243 13.88 13.72 10 10 10c-3.72 0-5.243 3.88-3.32 6.041.206.3.344.632.39.959H3a2 2 0 01-2-2v-1a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2h-4.07z" />
                        </svg>
                        No team members assigned to this project yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {project.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-[#1c6ead]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM2 9v7a2 2 0 002 2h12a2 2 0 002-2V9H2zm3 3a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
                    </svg>
                    Project Description
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-[#1c6ead]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Workflow Levels
                </h3>

                <div className="bg-gray-50 rounded-xl p-5 shadow-sm space-y-4">
                  {project.assignedTo?.map((lvl, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${project.currentLevelIndex === index
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                        }`}
                    >
                      <p className="text-sm font-medium text-gray-900">
                        Level {index + 1}
                        {project.currentLevelIndex === index && (
                          <span className="ml-2 text-xs text-blue-600">(Current Level)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        Department: {lvl.department?.name || "N/A"}
                      </p>
                      <p className="text-sm text-gray-700">
                        Assigned User: {lvl.user?.name || lvl.user?.toString() || "N/A"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === "tasks" ? (
            <ProjectTasks
              projectId={id}
              tasks={project.tasks}
              onSuccess={() => setReloadDocuments(true)}
              onTaskDeleted={() => setReloadProject((prev) => !prev)}
            />
          ) : activeTab === "documents" ? (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <MdFolder className="w-5 h-5 mr-2 text-[#1c6ead]" />
                  Documents
                </h3>
                {project.documents?.length > 0 && role !== "staff" && (
                  <button
                    onClick={() => setIsAddDocumentModalOpen(true)}
                    className="px-4 py-2 bg-[#1c6ead] text-white rounded-xl hover:bg-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center shadow-md text-sm sm:text-base"
                  >
                    <MdUpload className="mr-2 w-5 h-5" />
                    Add Document
                  </button>
                )}
              </div>
              {project.documents?.length > 0 ? (
                <>
                  <div className="bg-gray-50 rounded-xl overflow-hidden shadow-sm">
                    <ul className="divide-y divide-gray-200">
                      {currentDocuments.map((doc) => (
                        <li
                          key={doc._id}
                          className="p-5 hover:bg-gray-100 transition-all duration-200"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center">
                              <svg
                                className="h-6 w-6 text-purple-500 mr-3"
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
                                />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {doc.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Uploaded by {doc.uploadedBy.name} on{" "}
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-3 mt-3 sm:mt-0">
                              <button
                                onClick={() =>
                                  handleDownloadDocument(doc._id, doc.name)
                                }
                                className="text-[#1c6ead] hover:text-blue-700 transition-colors duration-200"
                                title="Download"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                              </button>
                              {role !== "staff" && (
                                <>
                                  <button
                                    onClick={() => handleEditDocumentClick(doc)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                    title="Edit"
                                  >
                                    <CiEdit className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => setDocToDelete(doc)}
                                    className="text-rose-600 hover:text-rose-800 transition-colors duration-200"
                                    title="Delete"
                                  >
                                    <TrashIcon className="w-5 h-5" />
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 pt-4 border-t border-gray-200 gap-4">
                      <button
                        onClick={goToPrevDocPage}
                        disabled={docCurrentPage === 1}
                        className={`flex items-center text-sm font-medium transition-all duration-300 ${docCurrentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-[#1c6ead] hover:text-blur-600"
                          }`}
                      >
                        <svg
                          className="w-5 h-5 mr-2"
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
                      <span className="text-sm text-gray-600">
                        Page {docCurrentPage} of {totalDocPages}
                      </span>
                      <button
                        onClick={goToNextDocPage}
                        disabled={docCurrentPage === totalDocPages}
                        className={`flex items-center text-sm font-medium transition-all duration-300 ${docCurrentPage === totalDocPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-indigo-600 hover:text-indigo-800"
                          }`}
                      >
                        Next
                        <svg
                          className="w-5 h-5 ml-2"
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
                <div className="bg-gray-50 rounded-xl p-8 text-center animate-fade-in shadow-sm">
                  <p className="text-gray-600 mb-6 text-sm sm:text-base flex items-center justify-center">
                    <svg
                      className="w-6 h-6 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    No documents uploaded for this project yet.
                  </p>
                  {role !== "staff" && (
                    <button
                      onClick={() => setIsAddDocumentModalOpen(true)}
                      className="px-5 py-2 bg-[#1c6ead] text-white rounded-xl hover:bg-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center mx-auto shadow-md text-sm sm:text-base"
                    >
                      <MdUpload className="mr-2 w-5 h-5" />
                      Upload Document
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === "notes" ? (
            <div className="animate-fade-in ">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <MdNote className="w-5 h-5 mr-2 text-[#1c6ead]" />
                  Notes
                </h3>
                {project.notes?.length > 0 && role !== "staff" && (
                  <button
                    onClick={() => setIsAddNotesModalOpen(true)}
                    className="px-4 py-2 bg-[#1c6ead] text-white rounded-xl hover:bg-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center shadow-md text-sm sm:text-base"
                  >
                    <MdNoteAdd className="mr-2 w-5 h-5" />
                    Add Note
                  </button>
                )}
              </div>
              {project.notes?.length > 0 ? (
                <>
                  <div className="space-y-5">
                    {paginatedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-300"
                      >
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {note.content}
                        </p>
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 gap-3">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800 mr-2">
                              {note.author?.name || "Unknown Author"}
                            </span>
                            <span>
                              {new Date(note.createdAt).toLocaleDateString()} at{" "}
                              {new Date(note.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {role !== "staff" && (
                            <div className="flex space-x-3 mt-3 sm:mt-0">
                              <button
                                onClick={() => handleEditNote(note)}
                                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="Edit"
                              >
                                <CiEdit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setNoteToDelete(note)}
                                className="text-rose-600 hover:text-rose-800 transition-colors duration-200"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalNotePages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 pt-4 border-t border-gray-200 gap-4">
                      <button
                        onClick={() =>
                          setNoteCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={noteCurrentPage === 1}
                        className={`flex items-center text-sm font-medium transition-all duration-300 ${noteCurrentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-[#1c6ead] hover:text-blue-600"
                          }`}
                      >
                        <svg
                          className="w-5 h-5 mr-2"
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
                      <span className="text-sm text-gray-600">
                        Page {noteCurrentPage} of {totalNotePages}
                      </span>
                      <button
                        onClick={() =>
                          setNoteCurrentPage((prev) =>
                            Math.min(prev + 1, totalNotePages)
                          )
                        }
                        disabled={noteCurrentPage === totalNotePages}
                        className={`flex items-center text-sm font-medium transition-all duration-300 ${noteCurrentPage === totalNotePages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-[#1c6ead] hover:text-blue-600"
                          }`}
                      >
                        Next
                        <svg
                          className="w-5 h-5 ml-2"
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
                <div className="bg-gray-50 rounded-xl p-8 text-center animate-fade-in shadow-sm">
                  <p className="text-gray-600 mb-6 text-sm sm:text-base flex items-center justify-center">
                    <svg
                      className="w-6 h-6 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    No notes added for this project yet.
                  </p>
                  {role !== "staff" && (
                    <button
                      onClick={() => setIsAddNotesModalOpen(true)}
                      className="px-5 py-2 bg-[#1c6ead] text-white rounded-xl hover:bg-blue-600 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center mx-auto shadow-md text-sm sm:text-base"
                    >
                      <MdNoteAdd className="mr-2 w-5 h-5" />
                      Add Note
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === "datalog" ? (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <MdTimeline className="w-5 h-5 mr-2 text-[#1c6ead]" />
                  Project Activity Log
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Timeline of all activities for this project including document
                  uploads, reminders, and other actions.
                </p>
              </div>
              <ProjectTimeline projectId={id} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in px-4">
          <div className="bg-white rounded-2xl p-6 max-w-full sm:max-w-lg w-full shadow-2xl transform transition-all duration-300 scale-95 animate-scale-in">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-rose-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 6v10h6V6H7zm5 2a1 1 0 00-1 1v6a1 1 0 102 0V9a1 1 0 00-1-1zm-3 1a1 1 0 00-1 1v4a1 1 0 102 0V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Are you sure you want to delete this project? This action cannot
              be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all duration-300 transform hover:scale-105 flex items-center shadow-md text-sm sm:text-base"
              >
                <TrashIcon className="h-5 w-5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {isAddDocumentModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in px-4">
          <div className="bg-white rounded-2xl p-6 max-w-full sm:max-w-lg w-full shadow-2xl transform transition-all duration-300 scale-95 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <MdUpload className="w-5 h-5 mr-2 text-blue-600" />
                {editingDocument ? "Edit Document" : "Upload Document"}
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                onClick={() => setIsAddDocumentModalOpen(false)}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-all duration-300 bg-gray-50"
                >
                  <div className="flex justify-center">
                    <svg
                      className="h-12 w-12 text-[#1c6ead]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div className="mt-3">
                    <label className="text-sm text-gray-600 cursor-pointer">
                      <span className="text-blue-600 hover:text-[#1c6ead] font-medium">
                        Click to upload
                      </span>
                      {" or drag and drop"}
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.docx,.xlsx,.pptx"
                      />
                    </label>
                    {file && (
                      <p className="mt-3 text-sm text-gray-800 font-medium">
                        Selected File:{" "}
                        <span className="text-blue-700">{file.name}</span>
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    PDF, Word, Excel, PowerPoint up to 10MB
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={editDocDescription}
                  onChange={(e) => setEditDocDescription(e.target.value)}
                  placeholder="Enter document description"
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-all duration-300 text-sm bg-gray-50"
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => setIsAddDocumentModalOpen(false)}
                  className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1c6ead] text-white rounded-xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 flex items-center shadow-md text-sm sm:text-base"
                >
                  <MdUpload className="mr-2 w-5 h-5" />
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in px-4">
          <div className="bg-white rounded-2xl p-6 max-w-full sm:max-w-lg w-full shadow-2xl transform transition-all duration-300 scale-95 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <MdNoteAdd className="w-5 h-5 mr-2 text-[#1c6ead]" />
                {editingNoteId ? "Edit Note" : "Add Note"}
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                onClick={() => setIsAddNotesModalOpen(false)}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-5">
              <label
                htmlFor="noteContent"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Note Content
              </label>
              <textarea
                id="noteContent"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your note here"
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-all duration-300 text-sm bg-gray-50"
                required
              ></textarea>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => setIsAddNotesModalOpen(false)}
                className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                className="px-5 py-2 bg-[#1c6ead] text-white rounded-xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 flex items-center shadow-md text-sm sm:text-base"
              >
                <MdNoteAdd className="mr-2 w-5 h-5" />
                {editingNoteId ? "Update Note" : "Add Note"}
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
            await documentsApi.updateDocument(docToDelete._id, {
              deleted: true,
            });
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
