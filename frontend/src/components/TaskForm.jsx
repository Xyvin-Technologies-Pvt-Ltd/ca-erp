import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { userApi } from "../api/userApi";
import { createTask, updateTask, uploadTagDocument, getTaskTagDocuments, remindClientForDocument } from "../api/tasks";
import { projectsApi } from "../api/projectsApi";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import Select from "react-select";
import TagDocumentUpload from "./TagDocumentUpload";
import { tagDocumentRequirements } from "../utils/tagDocumentFields";
import {
  DocumentTextIcon,
  BriefcaseIcon,
  FlagIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  PaperClipIcon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";
import ProjectForm from "./ProjectForm";

const TaskForm = ({ projectIds, onClose, onSucces, onSuccess, onCancel, task = null, onTaskUpdate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tagOptions = [
    "GST",
    "Income Tax",
    "TDS",
    "ROC",
    "Audit",
    "Compliance",
    "Financial Statements",
    "Taxation",
    "Transfer Pricing",
    "International Tax",
    "Wealth Management",
    "Banking",
    "FEMA",
    "Reconciliation",
    "44AB",
  ];

  const [title, setTitle] = useState(task?.title || "");
  const [status, setStatus] = useState(task?.status || "pending");
  const [priority, setPriority] = useState(task?.priority?.charAt(0).toUpperCase() + task?.priority?.slice(1) || "Medium");
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?._id || "");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split("T")[0] : "");
  const [description, setDescription] = useState(task?.description || "");
  const [file, setFile] = useState([]);
  const [selectedTags, setSelectedTags] = useState(task?.tags?.map(tag => ({ id: tag, text: tag })) || []);
  const [projectId, setProjectId] = useState(task?.project?._id || projectIds);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [userError, setUserError] = useState(null);
  const [projectError, setProjectError] = useState(null);
  const { socket } = useNotifications();
  const token = localStorage.getItem("auth_token");
  const [tagDocuments, setTagDocuments] = useState({});
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [clientInfo, setClientInfo] = useState(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [amount, setAmount] = useState(task?.amount);
  const [taskIncentivePercentage, setTaskIncentivePercentage] = useState(task?.taskIncentivePercentage || 0);
  const [verificationIncentivePercentage, setVerificationIncentivePercentage] = useState(task?.verificationIncentivePercentage || 1);
  const dueDateRef = useRef(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [projectDueDateError, setProjectDueDateError] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFile(selectedFiles);
  };


  useEffect(() => {
    const isDirty =
      title !== (task?.title || "") ||
      status !== (task?.status || "pending") ||
      priority !== (task?.priority?.charAt(0).toUpperCase() + task?.priority?.slice(1) || "Medium") ||
      assignedTo !== (task?.assignedTo?._id || "") ||
      dueDate !== (task?.dueDate ? task.dueDate.split("T")[0] : "") ||
      description !== (task?.description || "") ||
      file !== null ||
      JSON.stringify(selectedTags) !== JSON.stringify(task?.tags?.map(tag => ({ id: tag, text: tag })) || []) ||
      projectId !== (task?.project?._id || projectIds) ||
      amount !== (task?.amount || undefined) ||
      taskIncentivePercentage !== (task?.taskIncentivePercentage || 0) ||
      verificationIncentivePercentage !== (task?.verificationIncentivePercentage || 1) ||
      Object.keys(tagDocuments).length > 0;
    setIsFormDirty(isDirty);
  }, [title, status, priority, assignedTo, dueDate, description, file, selectedTags, projectId, amount, taskIncentivePercentage, verificationIncentivePercentage, tagDocuments, task]);

  // Clear project due date error when project changes
  useEffect(() => {
    setProjectDueDateError(null);
  }, [projectId]);

  // Fetch existing tag documents when editing a task
  useEffect(() => {
    const fetchTagDocuments = async () => {
      if (task?._id) {
        setIsLoadingDocuments(true);
        try {
          const response = await getTaskTagDocuments(task._id);
          setTagDocuments(response.data || {});
        } catch (error) {
          console.error('Error fetching tag documents:', error);
        } finally {
          setIsLoadingDocuments(false);
        }
      }
    };

    fetchTagDocuments();
  }, [task?._id]);

  // Fetch client information when project changes
  const fetchClientInfo = async (projectId) => {
    if (!projectId) {
      setClientInfo(null);
      return;
    }

    setIsLoadingClient(true);
    try {
      const response = await projectsApi.getProjectById(projectId);
      if (response.success && response.data.client) {
        setClientInfo(response.data.client);
      } else {
        setClientInfo(null);
      }
    } catch (error) {
      console.error('Error fetching client info:', error);
      setClientInfo(null);
    } finally {
      setIsLoadingClient(false);
    }
  };

  // Handle client reminder
  const handleRemindClient = async (reminderData) => {
    if (!task?._id) {
      throw new Error('Cannot send reminder for unsaved task');
    }

    try {
      const response = await remindClientForDocument(task._id, reminderData, token);
      return response;
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  };

  const handleTagDocumentUpload = async (tag, documentType, file) => {
    try {

      if (!task?._id) {
        setTagDocuments(prev => ({
          ...prev,
          [`${tag}-${documentType}`]: {
            file,
            tag,
            documentType,
            isTemp: true
          }
        }));
        setIsFormDirty(true);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tag', tag);
      formData.append('documentType', documentType);

      for (let [key, value] of formData.entries()) {
        console.log('FormData entry:', key, value);
      }

      const response = await uploadTagDocument(task._id, formData, token);

      setTagDocuments(prev => ({
        ...prev,
        [`${tag}-${documentType}`]: response.data
      }));
      setIsFormDirty(true);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Unauthorized: No token found");
      return;
    }

    if (!projectId) {
      toast.error("Please select a project.");
      return;
    }


    let selectedProject;

    if (projectIds) {
      try {
        const response = await projectsApi.getProjectById(projectId);
        selectedProject = response.data;
      } catch (error) {
        console.error("Error fetching project details:", error);
        toast.error("Error fetching project details");
        return;
      }
    } else {
      selectedProject = projects.find((p) => p._id === projectId);
    }

    if (selectedProject && !selectedProject.dueDate) {
      setProjectDueDateError({
        projectId: selectedProject._id,
        projectName: selectedProject.name,
      });
      setSelectedProject(selectedProject);
      return;
    } else {
      setProjectDueDateError(null);
    }


    // Build FormData

    const tagList = selectedTags.map((tag) => tag.text);
    const taskPayload = new FormData();

    taskPayload.append("title", title);
    taskPayload.append("project", projectId);
    taskPayload.append("status", status);
    taskPayload.append("priority", priority.toLowerCase());
    taskPayload.append("assignedTo", assignedTo);
    taskPayload.append("amount", amount !== undefined ? amount : 0);
    taskPayload.append("dueDate", dueDate);
    taskPayload.append("description", description);

    if (file.length > 0) {
      file.forEach((f) => taskPayload.append("files", f));
    }

    tagList.forEach((t) => taskPayload.append("tags[]", t));

    if (user?.role === "admin") {
      taskPayload.append("taskIncentivePercentage", taskIncentivePercentage);
      taskPayload.append(
        "verificationIncentivePercentage",
        verificationIncentivePercentage
      );
    }

    //TASK CREATION

    let response;

    try {
      if (task) {
        response = await updateTask(task._id, taskPayload, token);
        toast.success("Task updated successfully");
      } else {
        response = await createTask(taskPayload, token);
        toast.success("Task created successfully");
      }
    } catch (err) {
      console.error("Task creation failed", err);
      toast.error(err.response?.data?.message || "Failed to create/update task");
      return;
    }

    // Upload tag documents
    if (!task) {
      try {
        const tempDocs = Object.entries(tagDocuments).filter(
          ([_, doc]) => doc.isTemp
        );

        for (const [key, doc] of tempDocs) {
          const formData = new FormData();
          formData.append("file", doc.file);
          formData.append("tag", doc.tag);
          formData.append("documentType", doc.documentType);

          await uploadTagDocument(response.data.data._id, formData, token);
        }
      } catch (docErr) {
        console.error("Document upload failed:", docErr);

      }
    }


    try {
      if (!task && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "notification",
            message: `New task "${title}" has been created`,
            timestamp: new Date(),
            taskId: response.data.data._id,
            action: "create_task",
            data: {
              title,
              projectId,
              assignedTo,
              priority: priority.toLowerCase(),
              status,
              amount,
            },
          })
        );
      }
    } catch (sockErr) {
      console.error("Socket notification failed:", sockErr);
    }

    try {
      onSuccess?.(response.data);
      onSucces?.();
    } catch (callbackErr) {
      console.error("Callback error:", callbackErr);
    }
  };

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) => {
      const exists = prev.find((t) => t.text === tag);
      if (exists) {
        return prev.filter((t) => t.text !== tag);
      } else {
        return [...prev, { id: tag, text: tag }];
      }
    });
    setIsFormDirty(true);
  };

  const openDatePicker = (dateInputRef) => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker?.();
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchClientInfo(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (task?.project?._id) {
      fetchClientInfo(task.project._id);
    }
  }, [task?.project?._id]);

  useEffect(() => {
    if (task) {
      setTaskIncentivePercentage(task.taskIncentivePercentage || 0);
      setVerificationIncentivePercentage(task.verificationIncentivePercentage || 1);
    }
  }, [task]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await userApi.Allusers();
        setUsers(response.data?.data?.data || []);
      } catch (error) {
        setUserError("Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    };

    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const response = await projectsApi.getAllProjects();
        setProjects(response.data || []);
      } catch (error) {
        setProjectError("Failed to load projects");
      } finally {
        setLoadingProjects(false);
      }
    };

    if (token) {
      loadUsers();
      loadProjects();
    }
  }, [token]);

  const handleCancel = () => {
    if (isFormDirty) {
      setShowConfirmModal(true);
    } else {
      onCancel();
    }
  };

  const confirmDiscard = () => {
    setShowConfirmModal(false);
    onCancel();
  };

  const cancelDiscard = () => {
    setShowConfirmModal(false);
  };

  const handleProjectSuccess = async (updatedProject) => {
    setShowProjectForm(false);
    setProjectDueDateError(null);
    if (!projectIds) {
      setProjects((prev) =>
        prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
      );
    }
    toast.success("Project updated successfully");
  };

  const handleProjectCancel = () => {
    setShowProjectForm(false);
  };

  const openProjectForm = () => {
    setShowProjectForm(true);
  };

  return (
    <div className="fixed bg-black/20 bg-opacity-50 backdrop-blur-sm inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-3xl overflow-hidden transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-[#1c6ead] text-white p-3 rounded-lg shadow-sm">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {task ? 'Edit Task' : 'Create Task'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {task ? 'Update task details below' : 'Fill in the details to create a new task'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 hover:cursor-pointer transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Task Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setIsFormDirty(true); }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                    placeholder="Enter task title"
                    required
                  />
                </div>

                {/* Project */}
                {!projectIds && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={projectId}
                      onChange={(e) => { setProjectId(e.target.value); setIsFormDirty(true); }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 cursor-pointer"
                      required
                    >
                      <option value="">Select a project</option>
                      {loadingProjects ? (
                        <option disabled>Loading...</option>
                      ) : projectError ? (
                        <option disabled>{projectError}</option>
                      ) : (
                        projects.map(proj => (
                          <option key={proj._id} value={proj._id}>
                            {proj.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setIsFormDirty(true); }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="review">Review</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => { setPriority(e.target.value); setIsFormDirty(true); }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 cursor-pointer"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => {
                      setAssignedTo(e.target.value);
                      setIsFormDirty(true);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 cursor-pointer"
                    required
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                  {userError && (
                    <div className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="text-red-500 mr-1">⚠</span>
                      {userError}
                    </div>
                  )}
                </div>


                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={dueDateRef}
                      type="date"
                      value={dueDate}
                      onChange={(e) => { setDueDate(e.target.value); setIsFormDirty(true); }}
                      onClick={() => openDatePicker(dueDateRef)}
                      required
                      className="w-full px-4 py-3 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 cursor-pointer appearance-none"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount !== null ? amount : ""}
                    onChange={(e) => { setAmount(e.target.value === "" ? null : Number(e.target.value)); setIsFormDirty(true); }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-b[#1c6ead] transition-colors duration-200"
                    placeholder="Enter task amount"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Task Incentive % */}
                {/* {user?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Incentive % 
                    </label>
                    <input
                      type="number"
                      value={taskIncentivePercentage === null || taskIncentivePercentage === undefined ? '' : taskIncentivePercentage}
                      onChange={(e) => {
                        let val = e.target.value.replace(/^0+(?!$)/, '');
                        setTaskIncentivePercentage(val === '' ? '' : Number(val));
                        setIsFormDirty(true);
                      }}
                      onBlur={(e) => {
                        let val = e.target.value.replace(/^0+(?!$)/, '');
                        setTaskIncentivePercentage(val === '' ? '' : Number(val));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                      placeholder="Enter incentive percentage"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                )}

                {user?.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Incentive % 
                    </label>
                    <input
                      type="number"
                      value={verificationIncentivePercentage === null || verificationIncentivePercentage === undefined ? '' : verificationIncentivePercentage}
                      onChange={(e) => {
                        let val = e.target.value.replace(/^0+(?!$)/, '');
                        setVerificationIncentivePercentage(val === '' ? '' : Number(val));
                        setIsFormDirty(true);
                      }}
                      onBlur={(e) => {
                        let val = e.target.value.replace(/^0+(?!$)/, '');
                        setVerificationIncentivePercentage(val === '' ? '' : Number(val));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                      placeholder="Enter verification incentive percentage"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                )} */}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setIsFormDirty(true); }}
                  rows="4"
                  maxLength={500}
                  required
                  placeholder="Enter task details or requirements..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 resize-none"
                />
                <div className="flex justify-end items-center mt-2">
                  <p className={`text-sm ${description?.length > 400 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {description?.length || 0}/500
                  </p>
                </div>
              </div>

              {/* Attachment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments
                </label>

                <div className="flex items-center space-x-3">
                  <label
                    htmlFor="file"
                    className="cursor-pointer px-4 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-all duration-200 font-medium"
                  >
                    Upload Files
                  </label>
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {file.length > 0 ? `${file.length} file(s) selected` : "No files selected"}
                  </span>
                </div>

                <input
                  id="file"
                  type="file"
                  multiple   // ✅ allow multiple files
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* List of selected files */}
                {file.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-gray-700">
                    {file.map((fil, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="truncate max-w-xs">{fil.name}</span>
                        <span className="text-gray-500 text-xs">({(fil.size / 1024).toFixed(1)} KB)</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>


              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((tag) => {
                    const isSelected = selectedTags.some(t => t.text === tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${isSelected
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                          } transition-all duration-200`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tag Documents */}
              {selectedTags.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
                  </div>
                  {isLoadingClient && (
                    <div className="text-center text-gray-500 mb-2">Loading client information...</div>
                  )}
                  {isLoadingDocuments ? (
                    <div className="text-center text-gray-500">Loading documents...</div>
                  ) : (
                    <div className="space-y-4">
                      {selectedTags.map(tag => (
                        <TagDocumentUpload
                          key={tag.text}
                          tag={tag.text}
                          onUpload={handleTagDocumentUpload}
                          onRemindClient={task?._id ? handleRemindClient : null}
                          existingDocuments={tagDocuments}
                          clientInfo={clientInfo}
                          isLoading={isLoadingClient || isLoadingDocuments}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {projectDueDateError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Cannot create task for project "{projectDueDateError.projectName}"
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>This project doesn't have a due date set. Please add a due date to the project before creating tasks.</p>
                      <button
                        type="button"
                        onClick={openProjectForm}
                        className="mt-2 text-blue-600 hover:text-blue-800 underline cursor-pointer font-medium"
                      >
                        Add Due Date to Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 hover:cursor-pointer border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 hover:cursor-pointer bg-[#1c6ead] text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] disabled:from-blue-300 disabled:to-indigo-400 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none font-medium"
              >
                <span className="flex items-center">
                  {task ? 'Update Task' : 'Create Task'}
                </span>
              </button>
            </div>
          </form>
        </div>
        {/* Confirmation Popup */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Discard Changes?</h3>
                <button
                  onClick={cancelDiscard}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to discard changes? Any unsaved changes will be lost.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelDiscard}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDiscard}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 font-medium"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Form Modal */}
        {showProjectForm && selectedProject && (
          <ProjectForm
            project={selectedProject}
            onClose={handleProjectCancel}
            onSuccess={handleProjectSuccess}
            onCancel={handleProjectCancel}
          />
        )}
      </div>
    </div>
  );
};

export default TaskForm;