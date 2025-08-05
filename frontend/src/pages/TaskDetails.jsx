import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTaskDetails, updateTask, addTaskComment } from "../api/tasks";
import { ROUTES } from "../config/constants";

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle()}`}
    >
      {status}
    </span>
  );
};

// Priority badge component
const PriorityBadge = ({ priority }) => {
  const getPriorityStyle = () => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyle()}`}
    >
      {priority}
    </span>
  );
};

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [comment, setComment] = useState("");

  // Fetch task details
  const {
    data: task,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["task", id],
    queryFn: () => fetchTaskDetails(id),
    // Sample data for testing
    initialData: {
      id: "1",
      title: "Design Homepage Mockup",
      description:
        "Create wireframes and design mockups for the new homepage layout based on client feedback. Focus on responsive design and modern UI elements.",
      status: "In Progress",
      project: { id: "1", name: "Website Redesign" },
      priority: "High",
      assignedTo: {
        id: "1",
        name: "Alice Smith",
        email: "alice@example.com",
        avatar: null,
      },
      createdBy: {
        id: "2",
        name: "Bob Johnson",
        email: "bob@example.com",
        avatar: null,
      },
      dueDate: "2023-08-15",
      estimatedHours: 6,
      actualHours: 4,
      completionPercentage: 65,
      tags: ["Design", "UI/UX", "Frontend"],
      attachments: [
        {
          id: "a1",
          name: "design-brief.pdf",
          size: "2.4 MB",
          type: "application/pdf",
          uploadedAt: "2023-07-28T10:30:00Z",
          uploadedBy: { id: "2", name: "Bob Johnson" },
        },
        {
          id: "a2",
          name: "reference-design.jpg",
          size: "1.8 MB",
          type: "image/jpeg",
          uploadedAt: "2023-07-29T14:15:00Z",
          uploadedBy: { id: "1", name: "Alice Smith" },
        },
      ],
      comments: [
        {
          id: "c1",
          content:
            "Let's make sure we follow the color palette from the brand guidelines.",
          user: { id: "2", name: "Bob Johnson", avatar: null },
          createdAt: "2023-07-30T09:45:00Z",
        },
        {
          id: "c2",
          content: "I've added some reference designs as inspiration.",
          user: { id: "1", name: "Alice Smith", avatar: null },
          createdAt: "2023-07-30T15:20:00Z",
        },
      ],
      history: [
        {
          id: "h1",
          action: "Task created",
          user: { id: "2", name: "Bob Johnson" },
          timestamp: "2023-07-28T10:00:00Z",
        },
        {
          id: "h2",
          action: "Task assigned to Alice Smith",
          user: { id: "2", name: "Bob Johnson" },
          timestamp: "2023-07-28T10:05:00Z",
        },
        {
          id: "h3",
          action: "Status changed from 'Pending' to 'In Progress'",
          user: { id: "1", name: "Alice Smith" },
          timestamp: "2023-07-29T08:30:00Z",
        },
      ],
      createdAt: "2023-07-28T10:00:00Z",
      updatedAt: "2023-07-30T15:20:00Z",
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries(["task", id]);
      setEditMode(false);
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: addTaskComment,
    onSuccess: () => {
      queryClient.invalidateQueries(["task", id]);
      setComment("");
    },
  });

  // Handle comment submission
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      addCommentMutation.mutate({ taskId: id, content: comment });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${
        diffInMinutes === 1 ? "minute" : "minutes"
      } ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    }

    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1c6ead]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <svg
          className="h-12 w-12 text-red-500 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <p className="mt-4 text-red-600">
          Error loading task details. Please try again.
        </p>
        <button
          className="mt-2 text-blue-600 hover:text-blue-800"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex text-sm text-gray-600">
          <li className="flex items-center">
            <Link to={ROUTES.DASHBOARD} className="hover:text-blue-600">
              Dashboard
            </Link>
            <svg
              className="h-4 w-4 mx-2"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </li>
          <li className="flex items-center">
            <Link to={ROUTES.TASKS} className="hover:text-blue-600">
              Tasks
            </Link>
            <svg
              className="h-4 w-4 mx-2"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </li>
          <li className="text-gray-400">{task.title}</li>
        </ol>
      </nav>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Content */}
        <div className="md:w-2/3">
          {/* Header */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {task.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm mb-4">
                  <Link
                    to={`${ROUTES.PROJECTS}/${task.project.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {task.project.name}
                  </Link>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1c6ead]"
                >
                  {editMode ? "Cancel" : "Edit"}
                </button>
                <Link
                  to={`${ROUTES.TASKS}/${id}/edit`}
                  className="px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1c6ead]"
                >
                  Full Edit
                </Link>
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Description
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {task.description}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Progress
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {task.completionPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${task.completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Attachments
            </h2>
            {task.attachments.length > 0 ? (
              <ul className="space-y-3">
                {task.attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-md mr-3">
                        <svg
                          className="h-6 w-6 text-gray-500"
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
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {attachment.size} • Uploaded by{" "}
                          {attachment.uploadedBy.name}
                        </p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No attachments for this task.</p>
            )}
            <div className="mt-4">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1c6ead]">
                <svg
                  className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add Attachment
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Comments</h2>
            <div className="space-y-4 mb-6">
              {task.comments.length > 0 ? (
                task.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {comment.user.avatar ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={comment.user.avatar}
                          alt={comment.user.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                          {comment.user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {comment.user.name}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No comments yet.</p>
              )}
            </div>

            {/* Add comment form */}
            <form onSubmit={handleCommentSubmit}>
              <div className="mt-2">
                <textarea
                  rows="3"
                  className="shadow-sm block w-full focus:ring-[#1c6ead] focus:border-[#1c6ead] sm:text-sm border-gray-300 rounded-md"
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1c6ead]"
                >
                  Post Comment
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:w-1/3">
          {/* Task Details */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Assigned To
                </h3>
                <div className="mt-1 flex items-center">
                  {task.assignedTo.avatar ? (
                    <img
                      className="h-8 w-8 rounded-full mr-2"
                      src={task.assignedTo.avatar}
                      alt={task.assignedTo.name}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium mr-2">
                      {task.assignedTo.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm text-gray-900">
                    {task.assignedTo.name}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(task.dueDate)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Created By
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  {task.createdBy.name}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Created At
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(task.createdAt)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Estimated Hours
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  {task.estimatedHours || "Not specified"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Actual Hours
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  {task.actualHours || "Not specified"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity History */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Activity</h2>
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {task.history.map((event, eventIdx) => (
                  <li key={event.id}>
                    <div className="relative pb-8">
                      {eventIdx !== task.history.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        ></span>
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-[#1c6ead] flex items-center justify-center ring-8 ring-white">
                            <svg
                              className="h-5 w-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              {event.action}{" "}
                              <span className="font-medium text-gray-900">
                                by {event.user.name}
                              </span>
                            </p>
                          </div>
                          <div className="text-right text-xs whitespace-nowrap text-gray-500">
                            {formatTimeAgo(event.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
