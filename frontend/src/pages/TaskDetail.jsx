import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  fetchTaskById,
  removeDoc,
  updateTask,
  deleteTask,
  updateTaskTime,
  fetchTasks,
} from "../api/tasks";
import TaskForm from "../components/TaskForm";
import { useAuth } from "../context/AuthContext";
import { documentsApi } from "../api/documentsApi";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Plus,
  Clock,
  Calendar,
  User,
  FolderOpen,
  MessageCircle,
  Paperclip,
  Download,
  CheckCircle2,
  Circle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  FileText,
  Upload,
  X,
  Send,
  Timer,
} from "lucide-react";
import TagDocumentUpload from "../components/TagDocumentUpload";
import { tagDocumentRequirements } from "../utils/tagDocumentFields";
import {
  uploadTagDocument,
  getTaskTagDocuments,
  remindClientForDocument,
} from "../api/tasks";

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
  review: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  overdue: "bg-red-100 text-red-800 border-red-300",
};

const priorityColors = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-orange-50 text-orange-700 border-orange-200",
  low: "bg-green-50 text-green-700 border-green-200",
};

const statusIcons = {
  pending: AlertCircle,
  "in-progress": PlayCircle,
  review: PauseCircle,
  completed: CheckCircle2,
  cancelled: XCircle,
  overdue: AlertCircle,
};

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showAddSubtaskModal, setShowAddSubtaskModal] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [addingAttachment, setAddingAttachment] = useState(false);
  const [addingTimeEntry, setAddingTimeEntry] = useState(false);
  const { role } = useAuth();

  const token = localStorage.getItem("auth_token");
  const user = JSON.parse(localStorage.getItem("userData"));

  const [newSubtask, setNewSubtask] = useState({
    title: "",
    status: "pending",
  });
  const [showAddAttachmentModal, setShowAddAttachmentModal] = useState(false);
  const [newAttachment, setNewAttachment] = useState({
    name: "",
    file: null,
    description: "",
  });
  const [showAddTimeEntryModal, setShowAddTimeEntryModal] = useState(false);
  const [newTimeEntry, setNewTimeEntry] = useState({
    hours: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [notifyingFinance, setNotifyingFinance] = useState(false);
  const [tagDocuments, setTagDocuments] = useState({});
  const [isLoadingTagDocs, setIsLoadingTagDocs] = useState(false);
  const [verifications, setVerifications] = useState({});
  const [remindingDocs, setRemindingDocs] = useState({});
  const [clientInfo, setClientInfo] = useState(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);

  // Fetch tag documents on mount or refresh (same as TaskForm)
  useEffect(() => {
    const fetchTagDocs = async () => {
      if (task?._id) {
        setIsLoadingTagDocs(true);
        try {
          const response = await getTaskTagDocuments(task._id);
          setTagDocuments(response.data || {});
        } catch (error) {
          setTagDocuments({});
        } finally {
          setIsLoadingTagDocs(false);
        }
      }
    };
    fetchTagDocs();
  }, [task?._id, refresh]);

  // Fetch client info for the project (same as TaskForm)
  useEffect(() => {
    const fetchClient = async () => {
      if (task?.project?._id) {
        setIsLoadingClient(true);
        try {
          // Use the same API as TaskForm (projectsApi.getProjectById)
          const { projectsApi } = await import("../api/projectsApi");
          const response = await projectsApi.getProjectById(task.project._id);
          if (response.success && response.data.client) {
            setClientInfo(response.data.client);
          } else {
            setClientInfo(null);
          }
        } catch (error) {
          setClientInfo(null);
        } finally {
          setIsLoadingClient(false);
        }
      }
    };
    fetchClient();
  }, [task?.project?._id]);

  // Persistent verification state (localStorage)
  useEffect(() => {
    if (task?._id) {
      const saved = localStorage.getItem(`taskdoc-verify-${task._id}`);
      if (saved) setVerifications(JSON.parse(saved));
    }
  }, [task?._id]);

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const data = await fetchTaskById(id);
        setTask(data);
        setRefresh(false)
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch task:", err);
        setError("Failed to load task details. Please try again later.");
        setLoading(false);
      }
    };

    loadTask();
  }, [id, refresh]);

  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      const updatedTask = await updateTask(id, { ...task, status: newStatus });

      setTask((prevTask) => ({
        ...prevTask,
        ...updatedTask,
      }));
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error("Failed to update task status:", err);
      setError("Failed to update task status. Please try again later.");
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (updatedTask) => {
    setTask(updatedTask);
    setIsEditing(false);
  };

  const handleDeleteTask = async () => {
    try {
      setLoading(true);
      await deleteTask(id);
      setLoading(false);
      navigate(-1)
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task. Please try again later.");
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setAddingComment(true);
      const updatedComments = [
        ...(task.comments || []),
        {
          id: Date.now().toString(),
          text: newComment.trim(),
          user: {
            id: user._id,
            name: user.name,
            avatar: user.avatar || null,
          },
          timestamp: new Date().toISOString(),
        },
      ];

      const updatedTask = {
        ...task,
        comments: updatedComments,
        project: task.project?._id || "",
        assignedTo: task.assignedTo?._id || "",
      };

      const updatedTaskResponse = await updateTask(id, updatedTask, token);

      setTask(updatedTaskResponse);
      setNewComment("");
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error(
        "Failed to add comment:",
        err.response?.data || err.message
      );
      setError("Failed to add comment. Please try again later.");
    } finally {
      setAddingComment(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.title.trim()) return;

    try {
      setAddingSubtask(true);
      const updatedSubtasks = [
        ...(task.subtasks || []),
        {
          id: Date.now().toString(),
          title: newSubtask.title,
          status: "pending",
        },
      ];

      const updatedTask = {
        ...task,
        subtasks: updatedSubtasks,
        project: task.project ? task.project._id : "",
        assignedTo: task.assignedTo ? task.assignedTo._id : "",
      };

      const updatedTaskResponse = await updateTask(id, updatedTask, token);

      setTask(updatedTaskResponse);
      setNewSubtask({ title: "", status: "pending" });
      setShowAddSubtaskModal(false);
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error(
        "Failed to add subtask:",
        err.response ? err.response.data : err.message
      );
    } finally {
      setAddingSubtask(false);
    }
  };

  const handleAddAttachment = async () => {
    if (!newAttachment.name.trim() || !newAttachment.file) return;

    try {
      setAddingAttachment(true);
      const formData = new FormData();
      formData.append("files", newAttachment.file);
      formData.append("name", newAttachment.name);
      formData.append("description", newAttachment.description || "");

      formData.append(
        "attachments",
        JSON.stringify([...(task.attachments || [])])
      );

      const updatedTask = await updateTask(id, formData, token);

      setTask(updatedTask);
      setNewAttachment({ name: "", file: null, description: "" });
      setShowAddAttachmentModal(false);
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error("Failed to add attachment:", err);
    } finally {
      setAddingAttachment(false);
    }
  };

  const handleAddTimeEntry = async () => {
    if (!newTimeEntry.hours || !newTimeEntry.description) return;

    try {
      setAddingTimeEntry(true);
      const hours = parseFloat(newTimeEntry.hours);
      if (isNaN(hours) || hours <= 0) {
        return;
      }

      const result = await updateTaskTime(id, {
        hours,
        description: newTimeEntry.description,
        date: newTimeEntry.date,
      });

      const updatedTask = {
        ...task,
        timeTracking: {
          ...task.timeTracking,
          entries: [...task.timeTracking.entries, result.entry],
          actualHours: result.totalActualHours,
        },
      };

      setTask(updatedTask);
      setNewTimeEntry({
        hours: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setShowAddTimeEntryModal(false);
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error("Failed to add time entry:", err);
    } finally {
      setAddingTimeEntry(false);
    }
  };

  const calculateEstimatedHours = () => {
    return (
      task.timeTracking?.entries?.reduce(
        (total, entry) => total + (parseFloat(entry?.hours) || 0),
        0
      ) || 0
    );
  };

  const calculateActualHours = () => {
    const startDate = new Date(task.createdAt);
    const dueDate = new Date(task.dueDate);
    const diffTime = Math.abs(dueDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60));
  };

  const calculateProgressPercentage = () => {
    const estimated = calculateEstimatedHours();
    const actual = calculateActualHours();
    return Math.min((estimated / actual) * 100, 100);
  };

  const handleNotifyFinance = async () => {
    try {
      setNotifyingFinance(true);
      const updatedTask = await updateTask(id, {
        ...task,
        invoiceStatus: "Pending Invoice",
        invoiceNotification: {
          sentAt: new Date().toISOString(),
          sentBy: "You",
        },
      });
      setTask(updatedTask);
      setNotifyingFinance(false);
    } catch (err) {
      console.error("Failed to notify finance team:", err);
      setError("Failed to notify finance team. Please try again later.");
      setNotifyingFinance(false);
    }
  };

  const handleToggleSubtaskStatus = async (subtaskId) => {
    try {
      const updatedSubtasks = task.subtasks.map((subtask) => {
        if (subtask.id === subtaskId) {
          return {
            ...subtask,
            status: subtask.status === "completed" ? "pending" : "completed",
          };
        }
        return subtask;
      });

      const updatedTask = await updateTask(id, {
        ...task,
        subtasks: updatedSubtasks,
      });
      setRefresh((prev) => !prev);
      setTask(updatedTask);
    } catch (err) {
      console.error("Failed to update subtask status:", err);
    }
  };
  const handleRemoveDocument = async (documentId, taskId) => {
    try {
      const res = await removeDoc(documentId, taskId);
      console.log(res);
      setRefresh(true);
    } catch (error) {
      console.error("Error removing document:", error);
      setError("Failed to remove document. Please try again later.");
    }
  };
  const handleDownloadDocument = async (documentId, fileName) => {
    try {
      const attachment = task.attachments.find(
        (att) => att._id === documentId || att.id === documentId
      );
      if (!attachment) {
        throw new Error("Attachment not found");
      }

      const fileUrl = `${import.meta.env.VITE_BASE_URL
        }/${attachment.fileUrl.replace("public/", "")}`;

      const response = await fetch(fileUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || attachment.name;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      setError("Failed to download document. Please try again later.");
    }
  };

  const handleTagDocUpload = async (tag, documentType, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tag", tag);
      formData.append("documentType", documentType);
      const res = await uploadTagDocument(task._id, formData, token);
      setTagDocuments((prev) => ({
        ...prev,
        [`${tag}-${documentType}`]: res.data,
      }));
      setVerifications((prev) => {
        const updated = { ...prev, [`${tag}-${documentType}`]: false };
        if (task?._id) {
          localStorage.setItem(
            `taskdoc-verify-${task._id}`,
            JSON.stringify(updated)
          );
        }
        return updated;
      });
      setRefresh((prev) => !prev);
    } catch (e) {
      setError("Failed to upload tag document");
    }
  };

  const handleRemindClient = async ({ documentName, documentType, tag }) => {
    setRemindingDocs((prev) => ({ ...prev, [`${tag}-${documentType}`]: true }));
    try {
      await remindClientForDocument(
        task._id,
        { documentName, documentType, tag },
        token
      );
      setError(null);
    } catch (e) {
      console.log("Failed to send reminder");
    } finally {
      setRemindingDocs((prev) => ({
        ...prev,
        [`${tag}-${documentType}`]: false,
      }));
    }
  };

  const handleVerifyChange = (key, checked) => {
    setVerifications((prev) => {
      const updated = { ...prev, [key]: checked };
      if (task?._id) {
        localStorage.setItem(
          `taskdoc-verify-${task._id}`,
          JSON.stringify(updated)
        );
      }
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-[#1c6ead] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-red-100">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => navigate("/tasks")}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex justify-center items-center">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-yellow-100">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Not Found</h3>
            </div>
            <p className="text-yellow-700 mb-4">Task not found.</p>
            <button
              onClick={() => navigate("/tasks")}
              className="w-full px-4 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-[#1c6ead] transition-colors duration-200 flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center text-[#1c6ead] hover:text-blue-800 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Task Details
            </button>
          </div>
          <TaskForm
            task={task}
            onSuccess={handleTaskUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </div>
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

  const StatusIcon = statusIcons[task.status] || AlertCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-grey-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button and actions */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-[#1c6ead] hover:text-blue-800 transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-[#1c6ead] transition-all duration-200 hover:scale-105 flex items-center shadow-lg"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Task
            </button>
            {role !== "staff" && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 hover:scale-105 flex items-center shadow-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Task Header Card */}
        <div className="bg-white/70  backdrop-blur-s shadow-xl rounded-2xl mb-8  border border-white/20 overflow-hidden">
          <div className="px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  {task.project && (
                    <Link
                      to={`/projects/${task.project.id}`}
                      className="text-sm text-[#1c6ead] hover:text-blue-800 mb-2 flex items-center transition-colors duration-200"
                    >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      {task.project.name}
                    </Link>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {task.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {task.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 border border-blue-200 transition-all duration-200 hover:scale-105"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex flex-col items-end space-y-3">
                <div className="flex gap-3">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center transition-all duration-200 hover:scale-105 ${statusColors[task.status] ||
                      "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                  >
                    <StatusIcon className="w-4 h-4 mr-2" />
                    {task.status}
                  </span>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 hover:scale-105 ${priorityColors[task.priority] ||
                      "bg-gray-100 text-gray-800 border-gray-200"
                      }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <div
                  className={`flex items-center text-sm px-3 py-2 rounded-lg ${task.wasOverdue
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "text-gray-600 bg-gray-50"
                    }`}
                >
                  <Calendar
                    className={`w-4 h-4 mr-2 ${task.wasOverdue ? "text-red-600" : ""
                      }`}
                  />
                  <span className="mr-2">Due:</span>
                  <span
                    className={`font-medium ${task.wasOverdue ? "font-bold" : ""
                      }`}
                  >
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-[#1c6ead]" />
                  Description
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {task.description}
                </p>
              </div>
            </div>

            {/* Subtasks */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-emerald-50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-[#1c6ead]" />
                  Subtasks
                </h2>
                <button
                  onClick={() => setShowAddSubtaskModal(true)}
                  className="text-sm text-[#1c6ead] hover:text-blue-700 flex items-center transition-all duration-200 hover:scale-105 bg-blue-100 px-3 py-1 rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subtask
                </button>
              </div>
              <div className="p-6">
                {task.subtasks && task.subtasks.length > 0 ? (
                  <ul className="space-y-3">
                    {task.subtasks.map((subtask) => (
                      <li key={subtask.id} className="group">
                        <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
                          <button
                            onClick={() =>
                              handleToggleSubtaskStatus(subtask.id)
                            }
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${subtask.status === "completed"
                              ? "bg-[#1c6ead] border-[#1c6ead]"
                              : "bg-white border-gray-300 hover:border-blue-400"
                              }`}
                          >
                            {subtask.status === "completed" && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </button>
                          <div className="ml-4 flex-grow">
                            <p
                              className={`text-sm transition-all duration-200 ${subtask.status === "completed"
                                ? "text-gray-500 line-through"
                                : "text-gray-700 group-hover:text-gray-900"
                                }`}
                            >
                              {subtask.title}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No subtasks yet. Add a subtask to break down this task.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <div className="px-6 py-5 border-b border-gray-100 bg-blue-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-[#1c6ead]" />
                  Comments
                </h2>
              </div>
              <div className="p-6">
                {/* Add comment form */}
                <div className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 resize-none"
                    rows="3"
                    placeholder="Add a comment..."
                  ></textarea>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addingComment}
                      className="px-6 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-[#1c6ead] focus:outline-none focus:ring-2 focus:ring-[#1c6ead] disabled:bg-blue-300 transition-all duration-200 hover:scale-105 flex items-center"
                    >
                      {addingComment ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {addingComment ? "Adding..." : "Add Comment"}
                    </button>
                  </div>
                </div>

                {/* Comments list */}
                {task.comments && task.comments.length > 0 ? (
                  <ul className="space-y-4">
                    {task.comments.map((comment) => (
                      <li
                        key={comment.id}
                        className="bg-gray-50 p-4 rounded-xl transition-all duration-200 hover:bg-gray-100"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-10 w-10  rounded-full flex items-center justify-center">
                            {comment.user.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={`${comment.user.avatar}`}
                                alt=""
                                onError={(e) => {
                                  e.target.outerHTML = `
                                    <div class="h-10 w-10 rounded-full bg-[#1c6ead] flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                      <span class="text-white font-medium text-sm">
                                        ${comment.user.name
                                      ?.charAt(0)
                                      .toUpperCase() || ""
                                    }
                                      </span>
                                    </div>`;
                                }}
                              />
                            ) : (
                              <span className="text-sm font-medium text-white">
                                {comment.user.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center mb-1">
                              <p className="text-sm font-medium text-gray-900">
                                {comment.user.name}
                              </p>
                              <p className="text-xs text-gray-500 ml-2">
                                {new Date(comment.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No comments yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-8">
            {/* Status Change */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-indigo-600" />
                  Status
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {[
                    "pending",
                    "in-progress",
                    "review",
                    "completed",
                    "cancelled",
                    "overdue",
                  ].map((status) => {
                    const StatusIcon = statusIcons[status] || AlertCircle;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center ${task.status === status
                          ? `${statusColors[status]} shadow-lg`
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                          }`}
                      >
                        <StatusIcon className="w-4 h-4 mr-2" />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-gray-600" />
                  Details
                </h2>
              </div>
              <div className="p-6">
                <dl className="space-y-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">
                      Assigned To
                    </dt>
                    <dd className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-[#1c6ead] to-purple-400 rounded-full flex items-center justify-center mr-3">
                        {task.assignedTo?.avatar ? (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={task.assignedTo.avatar}
                            alt=""
                            onError={(e) => {
                              e.target.outerHTML = `
                                <div class="h-8 w-8 rounded-full bg-[#1c6ead] flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                  <span class="text-white font-medium text-sm">
                                    ${user.name?.charAt(0).toUpperCase() || ""}
                                  </span>
                                </div>`;
                            }}
                          />
                        ) : (
                          <span className="text-sm font-medium text-white">
                            {task.assignedTo?.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {task.assignedTo?.name}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">
                      Project
                    </dt>
                    <dd>
                      <Link
                        to={`/projects/${task.project?.id}`}
                        className="text-sm text-[#1c6ead] hover:text-blue-800 transition-colors duration-200 flex items-center"
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        {task.project?.name}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">
                      Created
                    </dt>
                    <dd className="text-sm text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {formatDate(task.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">
                      Due Date
                    </dt>
                    <dd className="text-sm text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-red-400" />
                      {formatDate(task.dueDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">
                      Estimated Hours
                    </dt>
                    <dd className="text-sm text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-[#1c6ead]" />
                      {calculateEstimatedHours()}h
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm shadow-xl mt-10 rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div className="px-6 py-5 border-b border-gray-100 bg-blue-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Paperclip className="w-5 h-5 mr-2 text-[#1c6ead]" />
              Attachments
            </h2>
            <button
              onClick={() => setShowAddAttachmentModal(true)}
              className="text-sm text-[#1c6ead] hover:text-blue-800 flex items-center transition-all duration-200 hover:scale-105 bg-blue-100 px-3 py-1 rounded-lg"
            >
              <Upload className="w-4 h-4 mr-1" />
              Add Attachment
            </button>
          </div>
          <div className="p-6">
            {task.attachments && task.attachments.length > 0 ? (
              <ul className="space-y-3">
                {task.attachments.map((attachment) => (
                  <li
                    key={attachment._id || attachment.id}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                        <Paperclip className="w-5 h-5 text-[#1c6ead]" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attachment.size} ·{" "}
                          {new Date(attachment.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() =>
                          handleRemoveDocument(
                            attachment._id || attachment.id,
                            task?._id
                          )
                        }
                        className="text-sm text-red-600 hover:text-red-800 flex items-center transition-all duration-200 hover:scale-105 opacity-0 group-hover:opacity-100 bg-blue-100 px-3 py-1 rounded-lg"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Remove
                      </button>
                      <button
                        onClick={() =>
                          handleDownloadDocument(
                            attachment._id || attachment.id,
                            attachment.name
                          )
                        }
                        className="text-sm text-[#1c6ead] hover:text-blue-800 flex items-center transition-all duration-200 hover:scale-105 opacity-0 group-hover:opacity-100 bg-blue-100 px-3 py-1 rounded-lg"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No attachments yet. Upload files to this task.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tag Documents Section (use TagDocumentUpload for each tag, as in TaskForm) */}
        {task && Array.isArray(task.tags) && (
          <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl mt-8">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-orange-50 flex items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                Tag Documents
              </h2>
            </div>
            <div className="p-6">
              {isLoadingTagDocs ? (
                <div className="text-center text-gray-500">
                  Loading tag documents...
                </div>
              ) : task.tags.length > 0 ? (
                <div className="space-y-6">
                  {task.tags.map((tag, id) => (
                    <TagDocumentUpload
                      key={tag}
                      tag={tag}
                      id={id}
                      onUpload={handleTagDocUpload}
                      onRemindClient={handleRemindClient}
                      existingDocuments={tagDocuments}
                      clientInfo={clientInfo}
                      isLoading={isLoadingTagDocs || isLoadingClient}
                      verifications={verifications}
                      onVerifyChange={handleVerifyChange}
                      remindingDocs={remindingDocs}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  No tags selected for this task.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time Tracking */}
        <div className="bg-white/70 mt-9 shadow-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-[#1c6ead]" />
              Time Tracking
            </h2>
            <button
              onClick={() => setShowAddTimeEntryModal(true)}
              className="text-sm text-[#1c6ead] hover:text-blue-800 flex items-center transition-all duration-200 hover:scale-105 bg-blue-100 px-3 py-1 rounded-lg"
            >
              <Timer className="w-4 h-4 mr-1" />
              Add Time
            </button>
          </div>
          <div className="p-6">


            {task?.timeTracking?.entries?.length > 0 ? (
              <ul className="space-y-3">
                {task.timeTracking.entries.map(
                  (entry, index) =>
                    entry && (
                      <li
                        key={index}
                        className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-all duration-200"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                            <Clock className="w-4 h-4 text-[#1c6ead]" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {entry?.description || "No description"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {entry?.date
                                ? new Date(entry.date).toLocaleDateString()
                                : "No date"}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-[#1c6ead] bg-blue-50 px-3 py-1 rounded-lg">
                          {entry?.hours || 0}h
                        </span>
                      </li>
                    )
                )}
              </ul>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No time entries yet. Add time spent on this task.
                </p>
              </div>
            )}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Estimated: {calculateEstimatedHours()} hours</span>
                <span>Actual: {calculateActualHours()} hours</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#1c6ead] to-cyan-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${calculateProgressPercentage()}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Information */}
        {/* <div className="bg-white/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Invoice Information
                </h3>
                {task.status === "Completed" && !task.invoiceStatus && (
                  <button
                    onClick={handleNotifyFinance}
                    disabled={notifyingFinance}
                    className="px-4 py-2 bg-[#1c6ead] text-white rounded-md hover:bg-[#1c6ead] focus:outline-none focus:ring-2 focus:ring-[#1c6ead] disabled:bg-blue-300"
                  >
                    {notifyingFinance ? "Notifying..." : "Notify Finance Team"}
                  </button>
                )}
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                {task.invoiceStatus ? (
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">
                        Status
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            task.invoiceStatus === "Invoiced"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {task.invoiceStatus}
                        </span>
                      </dd>
                    </div>

                    {task.invoiceData && (
                      <>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">
                            Invoice Number
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {task.invoiceData.invoiceNumber}
                          </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">
                            Invoice Date
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {new Date(
                              task.invoiceData.invoiceDate
                            ).toLocaleDateString()}
                          </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">
                            Processed On
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {new Date(
                              task.invoiceData.createdAt
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              task.invoiceData.createdAt
                            ).toLocaleTimeString()}
                          </dd>
                        </div>
                      </>
                    )}

                    {task.invoiceNotification && (
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                          Finance Notified On
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {new Date(
                            task.invoiceNotification.sentAt
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            task.invoiceNotification.sentAt
                          ).toLocaleTimeString()}{" "}
                          by {task.invoiceNotification.sentBy}
                        </dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    {task.status === "Completed"
                      ? "This task is completed but not yet invoiced. Notify the finance team to create an invoice."
                      : "This task needs to be completed before it can be invoiced."}
                  </div>
                )}
              </div>
            </div> */}

        {/* Modals */}
        {/* Add Subtask Modal */}
        {showAddSubtaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-[#1c6ead]" />
                  Add Subtask
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  onClick={() => setShowAddSubtaskModal(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddSubtask();
                }}
              >
                <div className="mb-6">
                  <label
                    htmlFor="subtaskTitle"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Subtask Title
                  </label>
                  <input
                    type="text"
                    id="subtaskTitle"
                    value={newSubtask.title}
                    onChange={(e) =>
                      setNewSubtask({ ...newSubtask, title: e.target.value })
                    }
                    placeholder="Enter subtask title"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddSubtaskModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newSubtask.title.trim() || addingSubtask}
                    className="px-6 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-[#1c6ead] disabled:bg-blue-300 transition-all duration-200 flex items-center"
                  >
                    {addingSubtask ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    {addingSubtask ? "Adding..." : "Add Subtask"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 ml-3">
                  Confirm Deletion
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this task? This action cannot be
                undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Attachment Modal */}
        {showAddAttachmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-[#1c6ead]" />
                  Add Attachment
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  onClick={() => setShowAddAttachmentModal(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddAttachment();
                }}
              >
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors duration-200">
                    <div className="flex justify-center">
                      <Upload className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="mt-2">
                      <label className="text-sm text-gray-600">
                        <span className="text-[#1c6ead] hover:text-[#1c6ead] cursor-pointer font-medium">
                          Click to upload
                        </span>
                        {" or drag and drop"}

                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setNewAttachment({
                                ...newAttachment,
                                name: file.name,
                                file: file,
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Any file up to 10MB
                    </p>
                    {newAttachment.name && (
                      <p className="text-sm text-[#1c6ead] mt-2 font-medium">
                        Selected: {newAttachment.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="attachmentDescription"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="attachmentDescription"
                    value={newAttachment.description}
                    onChange={(e) =>
                      setNewAttachment({
                        ...newAttachment,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter file description"
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddAttachmentModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newAttachment.name.trim() || addingAttachment}
                    className="px-6 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-[#1c6ead] disabled:bg-blue-300 transition-all duration-200 flex items-center"
                  >
                    {addingAttachment ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {addingAttachment ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Time Entry Modal */}
        {showAddTimeEntryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Timer className="w-5 h-5 mr-2 text-[#1c6ead]" />
                  Add Time Entry
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  onClick={() => setShowAddTimeEntryModal(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTimeEntry();
                }}
              >
                <div className="mb-4">
                  <label
                    htmlFor="timeEntryHours"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Hours Spent
                  </label>
                  <input
                    type="number"
                    id="timeEntryHours"
                    value={newTimeEntry.hours}
                    onChange={(e) =>
                      setNewTimeEntry({
                        ...newTimeEntry,
                        hours: e.target.value,
                      })
                    }
                    placeholder="Enter hours"
                    step="0.25"
                    min="0.25"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="timeEntryDate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    id="timeEntryDate"
                    value={newTimeEntry.date}
                    onChange={(e) =>
                      setNewTimeEntry({ ...newTimeEntry, date: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="timeEntryDescription"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="timeEntryDescription"
                    value={newTimeEntry.description}
                    onChange={(e) =>
                      setNewTimeEntry({
                        ...newTimeEntry,
                        description: e.target.value,
                      })
                    }
                    placeholder="What did you work on?"
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 resize-none"
                    required
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddTimeEntryModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !newTimeEntry.hours ||
                      !newTimeEntry.description ||
                      addingTimeEntry
                    }
                    className="px-6 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-[#1c6ead] disabled:bg-blue-300 transition-all duration-200 flex items-center"
                  >
                    {addingTimeEntry ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    ) : (
                      <Timer className="w-4 h-4 mr-2" />
                    )}
                    {addingTimeEntry ? "Adding..." : "Add Time"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;
