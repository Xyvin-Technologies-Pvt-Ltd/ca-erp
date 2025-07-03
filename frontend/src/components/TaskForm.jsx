import { useState, useEffect } from "react";
import axios from "axios";
import { userApi } from "../api/userApi";
import { createTask, updateTask, uploadTagDocument, getTaskTagDocuments, remindClientForDocument } from "../api/tasks";
import { WithContext as ReactTags } from "react-tag-input";
import { projectsApi } from "../api/projectsApi";
import { useNotifications } from "../context/NotificationContext";
import Select from "react-select";
import TagDocumentUpload from "./TagDocumentUpload";
import { tagDocumentRequirements } from "../utils/tagDocumentFields";
import { motion } from "framer-motion";
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
} from "@heroicons/react/24/outline";

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
      alert('Failed to upload document');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Unauthorized: No token found");
      return;
    }

    if (!projectId) {
      alert("Please select a project.");
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
        console.log(response, "response");
      } else {
        response = await createTask(taskPayload, token);

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
      alert(err.response?.data?.message || "Failed to create/update task");
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
    <motion.div
      className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <DocumentTextIcon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 mr-2" />
        {task ? "Edit Task" : "Create Task"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
            Task Title <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            placeholder="Enter task title"
            required
          />
        </motion.div>

        {/* Project */}
        {!projectIds && (
          <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <BriefcaseIcon className="h-5 w-5 text-indigo-600 mr-2" />
              Project <span className="text-red-600">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
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
          </motion.div>
        )}

        {/* Status */}
        <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <FlagIcon className="h-5 w-5 text-indigo-600 mr-2" />
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="review">Review</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </motion.div>

        {/* Priority */}
        <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <FlagIcon className="h-5 w-5 text-indigo-600 mr-2" />
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </motion.div>

        {/* Assigned To */}
        <motion.div className="relative z-10" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <UserIcon className="h-5 w-5 text-indigo-600 mr-2" />
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
                borderColor: '#e0e7ff',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  borderColor: '#c7d2fe',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                },
                borderRadius: '0.5rem',
                padding: '0.25rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
                zIndex: 10,
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
                backgroundColor: isFocused ? '#e0e7ff' : '#fff',
                color: '#1f2937',
                cursor: 'pointer',
              }),
            }}
          />
          {userError && (
            <p className="mt-1 text-sm text-red-600">{userError}</p>
          )}
        </motion.div>

        {/* Due Date */}
        <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <CalendarIcon className="h-5 w-5 text-indigo-600 mr-2" />
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
          />
        </motion.div>

        {/* Amount */}
        <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <CurrencyDollarIcon className="h-5 w-5 text-indigo-600 mr-2" />
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            placeholder="Enter task amount"
            min="0"
            step="0.01"
          />
        </motion.div>

        {/* Description */}
        <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <InformationCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            placeholder="Enter task details or requirements..."
          />
        </motion.div>

        {/* Attachment */}
        <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <PaperClipIcon className="h-5 w-5 text-indigo-600 mr-2" />
            Attachment
          </label>
          <div className="flex items-center">
            <label
              htmlFor="file"
              className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all duration-300"
            >
              Upload File
            </label>
            <span className="ml-3 text-sm text-gray-600 truncate max-w-xs">
              {file ? file.name : "No file selected"}
            </span>
          </div>
          <input
            id="file"
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
        </motion.div>

        {/* Tags */}
        <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <TagIcon className="h-5 w-5 text-indigo-600 mr-2" />
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => {
              const isSelected = selectedTags.some(t => t.text === tag);
              return (
                <motion.button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${isSelected
                    ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                  } transition-all duration-200`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tag}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Tag Documents */}
        {selectedTags.length > 0 && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
              Required Documents
            </h3>
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
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <motion.button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-indigo-300 rounded-lg text-gray-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all duration-300 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all duration-300 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {task ? "Update Task" : "Create Task"}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default TaskForm;