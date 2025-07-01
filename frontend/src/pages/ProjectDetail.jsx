import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import {
  fetchProjectById,
  updateProject,
  deleteProject
} from "../api/projects";
import ProjectTasks from "../components/ProjectTasks";
import ProjectForm from "../components/ProjectForm";
import ProjectTimeline from "../components/ProjectTimeline";
import { documentsApi } from "../api/documentsApi";
import { projectsApi } from "../api";
import ConfirmModal from "../components/settings/DeleteModal";
import { useAuth } from "../context/AuthContext";

  const statusColors = {
    completed: "bg-green-100 text-green-800",
    "in-progress": "bg-blue-100 text-blue-800",
    planning: "bg-purple-100 text-purple-800",
    "on-hold": "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
  };
  

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-green-100 text-green-800",
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
  const [file, setFile] = useState(null); // State to hold the selected file
  const [description, setDescription] = useState(""); // State for document description
  const [selectedProject, setSelectedProject] = useState("");
  const [reloadDocuments, setReloadDocuments] = useState(false);
  const [noteContent, setNoteContent] = useState(""); // State for the note content
  const [reloadProject, setReloadProject] = useState(false); 
  const [editingNoteId, setEditingNoteId] = useState(null); // Track which note is being edited
  const [docToDelete, setDocToDelete] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const { role} = useAuth()

  const [docCurrentPage, setDocCurrentPage] = useState(1);
  const docsPerPage = 5;
  const [noteCurrentPage, setNoteCurrentPage] = useState(1);
  const notesPerPage = 5;

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        const data = await fetchProjectById(id);
        console.log(data, "89498498498484")
        setProject(data.data);
        setSelectedProject(id)
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
    setFile(e.target.files[0]); // Set the selected file
  };
  const handleProjectUpdate = async (updatedProject) => {
    setReloadProject(prev => !prev);
    setIsEditing(false);
  };
  const handleUploadSuccess = (newDocument) => {
    // After uploading, trigger document reload by changing reloadDocuments state
    setReloadDocuments(true);
    setIsAddDocumentModalOpen(false);
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
    console.log(fileNameWithoutExtension, "ddddddddddddgrtrteryteyrt")
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", fileNameWithoutExtension); // Automatically set name
    formData.append("description", editDocDescription);
    formData.append("project", selectedProject); // Optional
    console.log(formData)
    try {
      let response;

      if (editingDocument) {
        // Update existing document
        response = await documentsApi.updateDocument(editingDocument._id, formData);
      } else {
        // Upload new document
        response = await documentsApi.uploadDocument(formData);
      }
  
      handleUploadSuccess(response);
      // const newDocument = await documentsApi.
      // uploadDocument(formData);
      // const newDocument = await documentsApi.updateDocument(id,formData)
      // handleUploadSuccess(newDocument);
    } catch (err) {
      console.error("Failed to upload document:", err);
      setError("Failed to upload document. Please try again later.");
    }
  };
  // Handle adding a new note
  const handleAddNote = async () => {
    if (!noteContent) {
      setError("Note content cannot be empty.");
      return;
    }
  
    try {
      let updatedNotes;
  
      if (editingNoteId) {
        // If editing, update the existing note
        updatedNotes = project.notes.map((note) =>
          note.id === editingNoteId ? { ...note, content: noteContent } : note
        );
      } else {
        // Else, create a new note
        const newNote = {
          id: Math.random().toString(36).substr(2, 9), // generate random id (if no backend auto id)
          content: noteContent,
          createdAt: new Date().toISOString(),
        };
        updatedNotes = [...project.notes, newNote];
         
      }
  
      const updatedProj = await projectsApi.updateProject(project.id, {
        notes: updatedNotes,
      });
  
      setReloadProject(prev => !prev);
  
      // Reset states after saving
      setNoteContent("");
      setEditingNoteId(null);
      setIsAddNotesModalOpen(false);
  
    } catch (err) {
      console.error("Failed to add/update note:", err);
      setError("Failed to save note. Please try again later.");
    }
  };
  // Handle document deletion
  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await documentsApi.updateDocument(docId, { deleted: true }); // Soft delete by setting `deleted` flag
      setReloadDocuments(prev => !prev); // Refresh document list
    } catch (err) {
      console.error("Failed to delete document:", err);
      setError("Failed to delete document. Please try again later.");
    }
  };

// Handle document edit (basic name/description update)
const handleEditDocumentClick = (doc) => {
  setEditingDocument(doc);
  setEditDocName(doc.name);
  setEditDocDescription(doc.editDocDescription);
  setIsAddDocumentModalOpen(true)
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
  const handleEditNote = (note) => {
  // You can open a modal and pre-fill noteContent for editing
  setNoteContent(note.content);
  setEditingNoteId(note.id); 
  setIsAddNotesModalOpen(true);
  // You could also store the editing note's ID separately if you want to distinguish between Add vs Edit mode
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
      setReloadProject(prev => !prev);
    } catch (err) {
      console.error("Failed to delete note:", err);
      setError("Failed to delete note. Please try again later.");
    }
  };





  if (loading) {
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
            onClick={() => navigate("/projects")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-700">Project not found.</p>
          <button
            onClick={() => navigate("/projects")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Projects
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

  const activeDocuments = project.documents?.filter(doc => !doc.deleted) || [];
  const totalDocPages = Math.ceil(activeDocuments.length / docsPerPage);

  const currentDocuments = activeDocuments.slice(
    (docCurrentPage - 1) * docsPerPage,
    docCurrentPage * docsPerPage
  );

  const filteredNotes = project.notes?.filter(note => !note.deleted) || [];
  const totalNotePages = Math.ceil(filteredNotes.length / notesPerPage);

  const paginatedNotes = filteredNotes.slice(
    (noteCurrentPage - 1) * notesPerPage,
    noteCurrentPage * notesPerPage
  );

  // Handle page navigation
  const goToNextDocPage = () => {
  setDocCurrentPage((prev) => Math.min(prev + 1, totalDocPages));
};

const goToPrevDocPage = () => {
  setDocCurrentPage((prev) => Math.max(prev - 1, 1));
};


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with back button and actions */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/projects")}
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
          Back to Projects
        </button>
        {role !== "staff" && (
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Project
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
        )}
      </div>

      {/* Project header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {project.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Client: {project.client?.name}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[project.status] || "bg-gray-100"
                }`}
              >
                {project.status}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  priorityColors[project.priority] || "bg-gray-100"
                }`}
              >
                {project.priority} Priority
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-4">
          <div className="mt-2">
            <div className="relative pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {project.completionPercentage}% Complete
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {project.completedTasks}/{project.totalTasks} Tasks
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mt-1 text-xs flex rounded bg-blue-100">
                <div
                  style={{ width: `${project.completionPercentage}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 border-b-2 text-sm font-medium ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-6 py-3 border-b-2 text-sm font-medium ${
                activeTab === "tasks"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-6 py-3 border-b-2 text-sm font-medium ${
                activeTab === "documents"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`px-6 py-3 border-b-2 text-sm font-medium ${
                activeTab === "notes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab("datalog")}
              className={`px-6 py-3 border-b-2 text-sm font-medium ${
                activeTab === "datalog"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Data Log
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Project details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Project Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <span className="text-sm text-gray-500 block">
                        Timeline
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(project.startDate)} to{" "}
                        {formatDate(project.dueDate)}
                      </span>
                    </div>
                    {/* {project.budget !== undefined && ( */}
                      <div>
                        <span className="text-sm text-gray-500 block">
                          Budget
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {(project.budget)}
                        </span>
                      </div>
                    {/* )} */}
                    {project.spent && (
                      <div>
                        <span className="text-sm text-gray-500 block">
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
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Team Members
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {project.team?.length > 0 ? (
                      <ul className={`grid gap-y-4 gap-x-6 ${project.team.length > 5 ? 'grid-cols-2' : 'grid-cols-1' }`}>
                        {project.team.map((member) => (
                          <li key={member.id} className="flex items-center">
                            <div className="flex-shrink-0">
                              {member.avatar ? (
                                <img
                                  src={`${import.meta.env.VITE_BASE_URL}${member.avatar}`}
                                 
                                  alt={member.name}
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                                  {member.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {member.role}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No team members assigned to this project yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Project Description
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      {project.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "tasks" && (
            <ProjectTasks projectId={id} tasks={project.tasks} />
          )}


          {activeTab === "documents" && (
            <div>
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                {project.documents?.length > 0 && role != "staff" ? (

                <button

                  onClick={() => setIsAddDocumentModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Document
                </button>
                  ) :([])}
              </div>
              {project.documents?.length > 0 ? (
                <>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {currentDocuments.map((doc) => (
                      <li key={doc._id} className="p-4 hover:bg-gray-100">
                        <div className="flex  justify-between">
                          <div className="flex ">
                            <svg
                              className="h-6 w-6 text-gray-400 mr-3"
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
                              <p className="text-sm font-medium text-gray-900">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Uploaded by {doc.uploadedBy.name} on{" "}
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        <div className="flex space-x-2">                        
                          <button
                            onClick={() => handleDownloadDocument(doc._id, doc.name)}
                            className="text-sm text-blue-600 hover:text-blue-800"
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
                            {role !== "staff" && (
                              <>
                                <button
                                  onClick={() => handleEditDocumentClick(doc)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <CiEdit size={20} />
                                </button>
                                <button
                                  onClick={() => setDocToDelete(doc)}
                                  className="text-red-600 hover:text-red-800 font-bold "
                                >
                                  <MdDelete size={20} />
                                </button>
                           </>)}
                          </div>
                          </div>
                        </li>
                          ))}
                        </ul>
                      </div>
                      {/* Pagination controls */}
                    {totalDocPages > 1 && (
                      <div className="flex justify-between items-center mt-4 pt-2 border-t">
                        <button
                          onClick={goToPrevDocPage}
                          disabled={docCurrentPage === 1}
                          className={`flex items-center text-sm font-medium p-1 ${
                            docCurrentPage === 1
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-blue-600 hover:text-blue-800"
                          }`}
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
                          Previous
                        </button>

                        <span className="text-sm text-gray-600">
                          Page {docCurrentPage} of {totalDocPages}
                        </span>

                        <button
                          onClick={goToNextDocPage}
                          disabled={docCurrentPage === totalDocPages}
                          className={`flex items-center text-sm font-medium p-1 ${
                            docCurrentPage === totalDocPages
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-blue-600 hover:text-blue-800"
                          }`}
                        >
                          Next
                          <svg
                            className="w-5 h-5 ml-1"
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
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <p className="text-gray-500 mb-4">
                          No documents uploaded for this project yet.
                        </p>
                        {role !== "staff" && (
                        <button  onClick={() => setIsAddDocumentModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                          Upload Document
                        </button>
                        )}
                      </div>
                    )}
            </div>
          )}



      {activeTab === "notes" && (
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Notes</h3>
            {project.notes?.length > 0 && role != "staff"? (
            <button
              onClick={() => setIsAddNotesModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Note
            </button>
            ):([])}
          </div>

          {project.notes?.length > 0 ? (
            <>
            <div className="space-y-4">
            {paginatedNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <p className="text-sm text-gray-700">{note.content}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 mr-2">
                        {note.author?.name || "Unknown Author"}
                      </span>
                      <span>
                        {new Date(note.createdAt).toLocaleDateString()} at{" "}
                        {new Date(note.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                    {role !== "staff" && (
                      <>
                      <button
                        onClick={() => handleEditNote(note)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <CiEdit size={20} />
                      </button>
                      <button
                        onClick={() => setNoteToDelete(note)}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        <MdDelete size={20} />
                      </button>
                      </>
                     )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

              {totalNotePages > 1 && (
                <div className="flex justify-between items-center px-6 py-4 border-t">
                  <button
                    onClick={() => setNoteCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={noteCurrentPage === 1}
                    className={`flex items-center text-sm font-medium ${
                      noteCurrentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:text-blue-800"
                    }`}
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  <span className="text-sm text-gray-600">
                    Page {noteCurrentPage} of {totalNotePages}
                  </span>

                  <button
                    onClick={() => setNoteCurrentPage((prev) => Math.min(prev + 1, totalNotePages))}
                    disabled={noteCurrentPage === totalNotePages}
                    className={`flex items-center text-sm font-medium ${
                      noteCurrentPage === totalNotePages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:text-blue-800"
                    }`}
                  >
                    Next
                    <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}

            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-4">
                No notes added for this project yet.
              </p>
              {role !== "staff" && (
              <button
                onClick={() => setIsAddNotesModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Note
              </button>
              )}
            </div>
          )}
        </div>
      )}

          {activeTab === "datalog" && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Project Activity Log</h3>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this project? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {isAddDocumentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Document
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsAddDocumentModalOpen(false)}
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
                    {file && (
      <p className="mt-3 text-sm text-gray-800 font-medium">
        Selected File: <span className="text-blue-700">{file.name}</span>
      </p>
    )}


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
                  value={editDocDescription}// Bind the value to state
                 
                  onChange={(e) => setEditDocDescription(e.target.value)} // Update state on change
                  placeholder="Enter document description"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required // Make it required
                ></textarea>
              </div>

              {/* <div className="mb-4">
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
              </div> */}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddDocumentModalOpen(false)}
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
      {/* Add Note Modal */}
      {isAddNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Note</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsAddNotesModalOpen(false)}
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

            <div className="mb-4">
              <label htmlFor="noteContent" className="block text-sm font-medium text-gray-700 mb-1">
                Note Content
              </label>
              <textarea
                id="noteContent"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your note here"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsAddNotesModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Note
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
      setReloadDocuments(prev => !prev);
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
      setReloadProject(prev => !prev);
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
