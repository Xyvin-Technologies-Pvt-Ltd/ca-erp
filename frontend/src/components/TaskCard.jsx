import React from "react";
import { Link } from "react-router-dom";
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

// Due date formatter
const DueDate = ({ date, wasOverdue }) => {
  if (!date) return null;

  const formattedDate = new Date(date).toLocaleDateString();

  if (wasOverdue) {
    return (
      <span className="text-red-700 font-semibold">
        {formattedDate} (Overdue)
      </span>
    );
  }

  return <span className="text-gray-600">{formattedDate}</span>;
};

const TaskCard = ({ task, showProject = true, showAssignee = true }) => {
  return (
   <Link
  to={`${ROUTES.TASKS}/${task.id}`}
  className={`block rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200
    ${
      task.wasOverdue
        ? "bg-red-50 border border-red-200"
        : "bg-white"
    }
  `}
>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
            {task.title}
          </h3>
          <StatusBadge status={task.status} />
        </div>

        {showProject && task.project && (
          <p className="mt-1 text-sm text-gray-600">
            Project: {task.project.name}
          </p>
        )}

        {task.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4">
          {showAssignee && task.assignedTo && (
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {task.assignedTo.avatar ? (
                  <img
                    src={task.assignedTo.avatar}
                    alt={task.assignedTo.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 text-xs font-medium">
                    {task.assignedTo.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="ml-2 text-sm text-gray-600 truncate">
                {task.assignedTo.name}
              </div>
            </div>
          )}

          {task.dueDate && (
            <div className="text-sm">
              <span className="text-gray-500 mr-1">Due:</span>
              <DueDate
                date={task.dueDate}
                wasOverdue={task.wasOverdue}
              />
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
          <div className="flex space-x-2">
            <PriorityBadge priority={task.priority || "Medium"} />
            {task.estimatedHours && (
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                {task.estimatedHours} hrs
              </span>
            )}
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap">
              {task.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="ml-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="ml-1 text-xs text-gray-500">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default TaskCard;
