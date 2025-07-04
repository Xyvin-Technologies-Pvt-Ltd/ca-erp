import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { userApi } from "../api/userApi";
import { createTask, updateTask, uploadTagDocument, getTaskTagDocuments, remindClientForDocument } from "../api/tasks";
import { projectsApi } from "../api/projectsApi";
import { useNotifications } from "../context/NotificationContext";
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
import toast from "react-hot-toast";

const TaskForm = ({ projectIds, onSuccess, onCancel, task = null }) => {
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
  const [file, setFile] = useState(null);
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
  const [amount, setAmount] = useState(task?.amount || 0);
  const dueDateRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

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
      console.log('Uploading document:', { tag, documentType, file });

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

    try {
      let taskPayload;
      const tagList = selectedTags.map(tag => tag.text);

      taskPayload = new FormData();
      taskPayload.append("title", title);
      taskPayload.append("project", projectId);
      taskPayload.append("status", status);
      taskPayload.append("priority", priority.toLowerCase());
      taskPayload.append("assignedTo", assignedTo);
      taskPayload.append("amount", amount !== undefined ? amount : 0);
      taskPayload.append("dueDate", dueDate);
      taskPayload.append("description", description);
      if (file) taskPayload.append("file", file);
      tagList.forEach(tag => taskPayload.append("tags[]", tag));

      let response;
      if (task) {
        response = await updateTask(task._id, taskPayload, token);
        toast.success("Task updated successfully");
      } else {
        response = await createTask(taskPayload, token);
        toast.success("Task created successfully");

        const tempDocs = Object.entries(tagDocuments).filter(([_, doc]) => doc.isTemp);
        for (const [key, doc] of tempDocs) {
          const formData = new FormData();
          formData.append('file', doc.file);
          formData.append('tag', doc.tag);
          formData.append('documentType', doc.documentType);

          await uploadTagDocument(response.data.data._id, formData, token);
        }

        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
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
              amount
            }
          }));
        }
      }

      onSuccess(response.data);
    } catch (err) {
      console.error("Failed to create/update task", err);
      toast.error(err.response?.data?.message || "Failed to create/update task");
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

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-3xl overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 text-white p-3 rounded-lg shadow-sm">
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
              onClick={onCancel} 
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
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
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
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
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
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
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
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
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>
                  <Select
                    value={users.find((user) => user._id === assignedTo)}
                    onChange={(selectedOption) => setAssignedTo(selectedOption?._id)}
                    getOptionLabel={(e) => e.name || e.email}
                    getOptionValue={(e) => e._id}
                    isLoading={loadingUsers}
                    options={users}
                    placeholder="Select a user"
                    className="mt-1"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: '#d1d5db',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#3b82f6',
                        },
                        borderRadius: '0.5rem',
                        padding: '0.25rem',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 20,
                        backgroundColor: '#fff',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }),
                      option: (base, { isFocused }) => ({
                        ...base,
                        backgroundColor: isFocused ? '#e0f2fe' : '#fff',
                        color: '#1f2937',
                        cursor: 'pointer',
                      }),
                    }}
                  />
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
                    Due Date
                  </label>
                  <div className="relative">
                    <input
                      ref={dueDateRef}
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      onClick={() => openDatePicker(dueDateRef)}
                      className="w-full px-4 py-3 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer appearance-none"
                      // style={{
                      //   backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E")`,
                      //   backgroundRepeat: 'no-repeat',
                      //   backgroundPosition: 'right 0.75rem center',
                      //   backgroundSize: '1.5rem',
                      // }}
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
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter task amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                  maxLength={500}
                  placeholder="Enter task details or requirements..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
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
                  Attachment
                </label>
                <div className="flex items-center space-x-3">
                  <label
                    htmlFor="file"
                    className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg hover:blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium"
                  >
                    Upload File
                  </label>
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {file ? file.name : "No file selected"}
                  </span>
                </div>
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
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

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:from-blue-300 disabled:to-indigo-400 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none font-medium"
              >
                <span className="flex items-center">
                  {/* <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={task ? 'M5 13l4 4L19 7' : 'M12 4v16m8-8H4'} />
                  </svg> */}
                  {task ? 'Update Task' : 'Create Task'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;