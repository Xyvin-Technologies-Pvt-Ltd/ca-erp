import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchTaskById, updateTask, deleteTask, updateTaskTime } from "../api/tasks";
import TaskForm from "../components/TaskForm";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  "in-Progress": "bg-blue-100 text-blue-800",
  review: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-green-100 text-green-800",
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
  

  const token = localStorage.getItem("auth_token");
  const user = JSON.parse(localStorage.getItem("userData")); // Adjust key if stored under a different name

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


  
  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const data = await fetchTaskById(id);
        // Convert the first letter of status to uppercase for display
        // const formattedStatus = data.status.charAt(0).toUpperCase() + data.status.slice(1);

        // // Update task with the formatted status
        // setTask({ ...data, status: formattedStatus });
        setTask(data);
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
      console.log("API returned updated task:", updatedTask);

      setTask(prevTask => ({
        ...prevTask,
        ...updatedTask,
      }));
    //  setLoading(false);
     setRefresh(prev => !prev);

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
      navigate("/tasks", { state: { message: "Task deleted successfully" } });
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task. Please try again later.");
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
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
        project: task.project?._id || "",       // Ensures backend gets raw ID
        assignedTo: task.assignedTo?._id || "", // Same as above
      };

      const updatedTaskResponse = await updateTask(id, updatedTask, token);

      setTask(updatedTaskResponse);
      setNewComment("");
      setRefresh(prev => !prev);
    } catch (err) {
      console.error("Failed to add comment:", err.response?.data || err.message);
      setError("Failed to add comment. Please try again later.");
    }
  };

 

const handleAddSubtask = async () => {
  if (!newSubtask.title.trim()) return;

  try {
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
      project: task.project ? task.project._id : '', // Ensure this is a string
      assignedTo: task.assignedTo ? task.assignedTo._id : '', // Ensure this is a string
    };

    console.log("Updated Task:", updatedTask);

    const updatedTaskResponse = await updateTask(id, updatedTask,token);

    setTask(updatedTaskResponse);
    setNewSubtask({ title: "", status: "pending" });
    setShowAddSubtaskModal(false);
    setRefresh(prev => !prev);
  } catch (err) {
    console.error("Failed to add subtask:", err.response ? err.response.data : err.message);
  }
};



  // const handleAddAttachment = async () => {
  //  if (!newAttachment.name.trim() || !newAttachment.file) return;
   
  //   try {
  //     // In a real app, you would upload the file to a server
  //     // Here we just simulate it with a local object

  //     const updatedAttachments = [
  //       ...(task.attachments || []),
  //       {
  //         id: Date.now().toString(),
  //         name: newAttachment.name,
  //         size: "1.2 MB", // In a real app, this would be the actual file size
  //         uploadedAt: new Date().toISOString(),
  //         uploadedBy: 1, // Current user ID
  //       },
  //     ];

  //     const updatedTask = await updateTask(id, {
  //       ...task,
  //       attachments: updatedAttachments,
  //     });

  //     setTask(updatedTask);
  //     setNewAttachment({ name: "", file: null, description: "" });
  //     setShowAddAttachmentModal(false);
  //   } catch (err) {
  //     console.error("Failed to add attachment:", err);
   
  //   }
  // };

  const handleAddAttachment = async () => {
  if (!newAttachment.name.trim() || !newAttachment.file) return;

  try {
    const formData = new FormData();
    formData.append('file', newAttachment.file);
    formData.append('name', newAttachment.name);
    formData.append('description', newAttachment.description || '');
    
    // Attach other task fields if needed
    formData.append('attachments', JSON.stringify([
      ...(task.attachments || []),
    ]));

    const updatedTask = await updateTask(id, formData, token); // token from your auth

    setTask(updatedTask);
    setNewAttachment({ name: '', file: null, description: '' });
    setShowAddAttachmentModal(false);
    setRefresh(prev => !prev);
  } catch (err) {
    console.error('Failed to add attachment:', err);
  }
};


  const handleAddTimeEntry = async () => {
    if (!newTimeEntry.hours || !newTimeEntry.description) return;

    try {
      const hours = parseFloat(newTimeEntry.hours);
      if (isNaN(hours) || hours <= 0) {
        // Show error for invalid hours
        return;
      }

      const result = await updateTaskTime(id, {
        hours,
        description: newTimeEntry.description,
        date: newTimeEntry.date,
      });

      // Append the returned entry and update task state
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
     setRefresh(prev => !prev);
    } catch (err) {
      console.error("Failed to add time entry:", err);
      // Show error message
    }
  };
  
  

  const handleNotifyFinance = async () => {
    try {
      setNotifyingFinance(true);
      // In a real app, you would send a notification to the finance team
      // Here we just update the task status
      const updatedTask = await updateTask(id, {
        ...task,
        invoiceStatus: "Pending Invoice",
        invoiceNotification: {
          sentAt: new Date().toISOString(),
          sentBy: "You", // In a real app, use the actual user name
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
        setRefresh(prev => !prev);

      setTask(updatedTask);
    } catch (err) {
      console.error("Failed to update subtask status:", err);
      // Show error message
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
            onClick={() => navigate("/tasks")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 p-4 rounded-md">
          <p className="text-yellow-700">Task not found.</p>
          <button
            onClick={() => navigate("/tasks")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Tasks
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
            Back to Task Details
          </button>
        </div>
        <TaskForm
          task={task}
          onSuccess={handleTaskUpdate}
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with back button and actions */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/tasks")}
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
          Back to Tasks
        </button>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Task
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                {task.project && (
                  <Link
                    to={`/projects/${task.project.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 mb-2"
                  >
                    {task.project.name}
                  </Link>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {task.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2">
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[task.status] || "bg-gray-100"
                  }`}
                >
                  {task.status}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    priorityColors[task.priority] || "bg-gray-100"
                  }`}
                >
                  {task.priority}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">Due:</span>
                <span className="font-medium">{formatDate(task.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b">
              <h2 className="text-lg font-medium text-gray-900">Description</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 whitespace-pre-line">
                {task.description}
              </p>
            </div>
          </div>

          {/* Subtasks section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Subtasks</h2>
              <button
                onClick={() => setShowAddSubtaskModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                Add Subtask
              </button>
            </div>
            <div className="p-6">
              {task.subtasks && task.subtasks.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {task.subtasks.map((subtask) => (
                    <li key={subtask.id} className="py-3">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleToggleSubtaskStatus(subtask.id)}
                          className={`flex-shrink-0 w-5 h-5 rounded-full ${
                            subtask.status === "completed"
                              ? "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        ></button>
                        <div className="ml-3 flex-grow">
                          <p
                            className={`text-sm ${
                              subtask.status === "completed"
                                ? "text-gray-500 line-through"
                                : "text-gray-700"
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
                <p className="text-center text-gray-500">
                  No subtasks yet. Add a subtask to break down this task.
                </p>
              )}
            </div>
          </div>

          {/* Comments section with add comment functionality */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b">
              <h2 className="text-lg font-medium text-gray-900">Comments</h2>
            </div>
            <div className="p-6">
              {/* Add comment form */}
              <div className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Add a comment..."
                ></textarea>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                  >
                    Add Comment
                  </button>
                </div>
              </div>

              {/* Comments list */}
              {task.comments && task.comments.length > 0 ? (
                <ul className="space-y-6">
                  {task.comments.map((comment) => (
                    <li key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {comment.user.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={`${import.meta.env.VITE_BASE_URL}${comment.user.avatar}`}
                               
                                alt=""
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-500">
                                {comment.user.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {comment.user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-gray-700">
                        {comment.text}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500">No comments yet</p>
              )}
            </div>
          </div>

          {/* Attachments section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Attachments</h2>
              <button
                onClick={() => setShowAddAttachmentModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
                Add Attachment
              </button>
            </div>
            <div className="p-6">
              {task.attachments && task.attachments.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {task.attachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="py-3 flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
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
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attachment.size} ·{" "}
                            {new Date(
                              attachment.uploadedAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-800">
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
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500">
                  No attachments yet. Upload files to this task.
                </p>
              )}
            </div>
          </div>

          {/* Time tracking */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Time Tracking
              </h2>
              <button
                onClick={() => setShowAddTimeEntryModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                {/* <svg
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg> */}
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>

              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Estimated: {task.estimatedHours} hours</span>
                  <span>Actual: {task.actualHours || 0} hours</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((task.actualHours || 0) / task.estimatedHours) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
              {/* {task.timeTracking && task.timeTracking.entries.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {task.timeTracking.entries.map((entry, index) => (
                    <li key={index} className="py-3 flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {entry.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm text-gray-700">
                        {entry.hours} hours
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500">
                  No time entries yet. Add time spent on this task.
                </p>
              )} */}

              {task?.timeTracking?.entries?.length > 0 ? (
  <ul className="divide-y divide-gray-200">
    {task.timeTracking.entries.map((entry, index) => (
      entry && (
        <li key={index} className="py-3 flex justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {entry?.description || 'No description'}
            </p>
            <p className="text-xs text-gray-500">
              {entry?.date ? new Date(entry.date).toLocaleDateString() : 'No date'}
            </p>
          </div>
          <span className="text-sm text-gray-700">
            {entry?.hours || 0} hours
          </span>
        </li>
      )
    ))}
  </ul>
) : (
  <p className="text-center text-gray-500">
    No time entries yet. Add time spent on this task.
  </p>
)}
            </div>
          </div>

          {/* Invoice status section */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Invoice Information
              </h3>
              {task.status === "Completed" && !task.invoiceStatus && (
                <button
                  onClick={handleNotifyFinance}
                  disabled={notifyingFinance}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
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
          </div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Change status */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b">
              <h2 className="text-lg font-medium text-gray-900">Status</h2>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {[
                  "pending",
                  "in-progress",
                  "review",
                  "completed",
                  "cancelled",
                ].map((status) => (
                  <button
                    // type="button"
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                      task.status === status
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Task details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b">
              <h2 className="text-lg font-medium text-gray-900">Details</h2>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-500">Assigned To</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <div className="flex-shrink-0 h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                      {task.assignedTo?.avatar ? (
                        <img
                          className="h-6 w-6 rounded-full"
                          src={task.assignedTo.avatar}
                          alt=""
                        />
                      ) : (
                        <span className="text-xs font-medium text-gray-500">
                          {task.assignedTo?.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    {task.assignedTo?.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Project</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link
                      to={`/projects/${task.project?.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {task.project?.name}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(task.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Due Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(task.dueDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Estimated Hours</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {task.estimatedHours}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Add Subtask Modal */}
      <div>
    {/* Triggering button to show modal */}
    {/* <button onClick={() => setShowAddSubtaskModal(true)}>Add Subtask</button> */}

    {/* Conditional rendering of modal */}
    {showAddSubtaskModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Subtask</h3>
            <button
              className="text-gray-400 hover:text-gray-500"
              onClick={() => setShowAddSubtaskModal(false)}
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddSubtask();
            }}
          >
            <div className="mb-4">
              <label
                htmlFor="subtaskTitle"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddSubtaskModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!newSubtask.title.trim()}
              >
                Add Subtask
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>


      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this task? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Attachment Modal */}
      {showAddAttachmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add Attachment
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowAddAttachmentModal(false)}
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
              onSubmit={(e) => {
                e.preventDefault();
                handleAddAttachment();
              }}
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
                    <label className="text-sm text-gray-600">
                      <span className="text-blue-600 hover:text-blue-500 cursor-pointer">
                        Click to upload
                      </span>
                      {" or drag and drop"}
                   
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          console.log("Selected file:", file);
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
                    <p className="text-sm text-blue-600 mt-2">
                      Selected: {newAttachment.name}
                    </p>
                  )}
                </div>
              </div>

              {/* <div className="mb-4">
                <label
                  htmlFor="attachmentName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  File Name
                </label>
                <input
                  type="text"
                  id="attachmentName"
                  value={newAttachment.name}
  
                  onChange={(e) =>
                    setNewAttachment({ ...newAttachment, name: e.target.value })
                  }
                  placeholder="Enter file name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div> */}

              <div className="mb-4">
                <label
                  htmlFor="attachmentDescription"
                  className="block text-sm font-medium text-gray-700 mb-1"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddAttachmentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={!newAttachment.name.trim()}
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Time Entry Modal */}
      {showAddTimeEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add Time Entry
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowAddTimeEntryModal(false)}
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
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTimeEntry();
              }}
            >
              <div className="mb-4">
                <label
                  htmlFor="timeEntryHours"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hours Spent
                </label>
                <input
                  type="number"
                  id="timeEntryHours"
                  value={newTimeEntry.hours}
                  onChange={(e) =>
                    setNewTimeEntry({ ...newTimeEntry, hours: e.target.value })
                  }
                  placeholder="Enter hours"
                  step="0.25"
                  min="0.25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="timeEntryDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="timeEntryDescription"
                  className="block text-sm font-medium text-gray-700 mb-1"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddTimeEntryModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={!newTimeEntry.hours || !newTimeEntry.description}
                >
                  Add Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
