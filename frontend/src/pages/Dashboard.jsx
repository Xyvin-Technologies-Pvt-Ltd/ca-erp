import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "../config/constants";
import { fetchDashboardStats } from "../api/stats";
import { fetchRecentActivity } from "../api/activity";
import { Card, StatusBadge, Avatar, StatIcon } from "../ui";
import { projectsApi, clientsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { fetchDashboardData } from "../api/dashboard";

const StatCard = ({ title, value, change, iconType, color }) => {
  const isPositive = change >= 0;
  const changeClass = isPositive ? "text-green-600" : "text-red-600";
  const changeIcon = isPositive ? (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 10l7-7m0 0l7 7m-7-7v18"
      />
    </svg>
  ) : (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 14l-7 7m0 0l-7-7m7 7V3"
      />
    </svg>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== null && (
            <div className={`flex items-center mt-1 ${changeClass}`}>
              <span className="flex items-center text-xs font-medium">
                {changeIcon}
                <span className="ml-1">
                  {Math.abs(change)}% from last month
                </span>
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <StatIcon iconType={iconType} />
        </div>
      </div>
    </div>
  );
};

const TaskTable = ({ tasks }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Task
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Client
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Due Date
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Assigned To
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {task.title}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{task.client}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{task.dueDate}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={task.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Avatar name={task.assignedTo} size="sm" className="mr-2" />
                  <div className="text-sm font-medium text-gray-900">
                    {task.assignedTo}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ComplianceTable = ({ tasks }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Compliance Task
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Client
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Due Date
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Priority
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {task.task}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{task.client}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{task.dueDate}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    task.status === "Due Soon"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {task.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    task.priority === "High"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {task.priority}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const StatsCard = ({ title, value, icon, change, changeType, linkTo }) => {
  return (
    <Link
      to={linkTo}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {change && (
            <p
              className={`text-sm mt-2 font-medium flex items-center ${
                changeType === "increase"
                  ? "text-green-600"
                  : changeType === "decrease"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {changeType === "increase" ? (
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 15l7-7 7 7"
                  ></path>
                </svg>
              ) : changeType === "decrease" ? (
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              ) : null}
              {change}
            </p>
          )}
        </div>
        <div className="p-3 rounded-full bg-blue-50 text-blue-600">{icon}</div>
      </div>
    </Link>
  );
};

const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case "task_created":
        return (
          <div className="p-2 rounded-full bg-green-100 text-green-600">
            <svg
              className="w-4 h-4"
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
          </div>
        );
      case "task_completed":
        return (
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
        );
      case "client_added":
        return (
          <div className="p-2 rounded-full bg-purple-100 text-purple-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              ></path>
            </svg>
          </div>
        );
      case "project_created":
      case "project_milestone":
        return (
          <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              ></path>
            </svg>
          </div>
        );
      case "deadline_updated":
        return (
          <div className="p-2 rounded-full bg-orange-100 text-orange-600">
            <svg
              className="w-4 h-4"
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
              ></path>
            </svg>
          </div>
        );
      case "document_uploaded":
        return (
          <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-100 text-gray-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
        );
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  };

  return (
    <div className="flex items-start space-x-3 py-3">
      {getActivityIcon(activity.type)}
      <div className="flex-1">
        <div className="flex justify-between">
          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
          <p className="text-xs text-gray-500">
            {formatTimeAgo(activity.timestamp)}
          </p>
        </div>
        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
        {/* {activity.link && (
          <Link
            to={activity.link}
            className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
          >
            View details
          </Link>
        )} */}
      </div>
    </div>
  );
};

const ProjectProgress = ({ project }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">{project.name}</h3>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            project.status === "On Track"
              ? "bg-green-100 text-green-800"
              : project.status === "At Risk"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {project.status}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">Due {project.dueDate}</p>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progress</span>
        <span>{project.completionPercentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div
          className={`h-2 rounded-full ${
            project.status === "On Track"
              ? "bg-green-500"
              : project.status === "At Risk"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          style={{ width: `${project.completionPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// const TaskSummary = ({ tasks }) => {
//   const statusCounts = {
//     "In Progress": tasks.filter((task) => task.status === "In Progress").length,
//     Pending: tasks.filter((task) => task.status === "Pending").length,
//     Completed: tasks.filter((task) => task.status === "Completed").length,
//     Review: tasks.filter((task) => task.status === "Review").length,
//   };
//   return (
//     <div className="bg-white rounded-lg shadow-sm p-6">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-lg font-medium">Task Summary</h2>
//         <Link
//           to={ROUTES.TASKS}
//           className="text-sm text-blue-600 hover:text-blue-800"
//         >
//           View all
//         </Link>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         {Object.entries(statusCounts).map(([status, count]) => (
//           <div key={status} className="flex items-center p-3 border rounded-lg">
//             <div
//               className={`w-3 h-3 rounded-full mr-2 ${
//                 status === "In Progress"
//                   ? "bg-blue-500"
//                   : status === "Pending"
//                   ? "bg-yellow-500"
//                   : status === "Completed"
//                   ? "bg-green-500"
//                   : "bg-purple-500"
//               }`}
//             ></div>
//             <div>
//               <p className="text-xs text-gray-500">{status}</p>
//               <p className="text-lg font-bold">{count}</p>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="mt-4">
//         <div className="flex justify-between text-xs text-gray-500 mb-1">
//           <span>Tasks Completed</span>
//           <span>
//             {Math.round((statusCounts.Completed / tasks.length) * 100)}%
//           </span>
//         </div>
//         <div className="w-full h-2 bg-gray-200 rounded-full">
//           <div
//             className="h-2 bg-green-500 rounded-full"
//             style={{
//               width: `${(statusCounts.Completed / tasks.length) * 100}%`,
//             }}
//           ></div>
//         </div>
//       </div>
//     </div>
//   );
// };

const TaskSummary = ({ tasks }) => {
  // Define all possible statuses
  const allStatuses = ["In Progress", "Pending", "Completed", "Review"];
  
  // Create a map of all statuses with their counts
  const statusMap = allStatuses.map(status => ({
    status,
    count: tasks.find(t => t.status === status)?.count || 0
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Task Summary</h2>
        <Link
          to={ROUTES.TASKS}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statusMap.map(({ status, count }) => (
          <div key={status} className="flex items-center p-3 border rounded-lg">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                status === "In Progress"
                  ? "bg-blue-500"
                  : status === "Pending"
                  ? "bg-yellow-500"
                  : status === "Completed"
                  ? "bg-green-500"
                  : "bg-purple-500"
              }`}
            ></div>
            <div>
              <p className="text-xs text-gray-500">{status}</p>
              <p className="text-lg font-bold">{count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        {/* Rest of the component remains the same */}
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Tasks Completed</span>
          <span>
            {Math.round(
              ((tasks.find(t => t.status === "Completed")?.count || 0) / 
              tasks.reduce((sum, t) => sum + (t.count || 0), 0)) * 100
            ) || 0}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-green-500 rounded-full"
            style={{
              width: `${Math.round(
                ((tasks.find(t => t.status === "Completed")?.count || 0) / 
                tasks.reduce((sum, t) => sum + (t.count || 0), 0)) * 100
              ) || 0}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const RecentActivity = () => {
  // Updated to object syntax for React Query v5
  const { data, isLoading, error } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const response = await fetchRecentActivity();
      return response;
    }
  });
  
  // Set up pagination with state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // Show 4 items per page as requested

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-red-600">Error loading recent activity</div>
      </div>
    );
  }

  // Extract activities from the response structure
  const activities = data?.data?.activities || [];
  
  // Calculate total pages
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  
  // Get current page items
  const currentActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle page navigation
  const goToNextPage = () => {
    setCurrentPage(current => Math.min(current + 1, totalPages));
  };
  
  const goToPreviousPage = () => {
    setCurrentPage(current => Math.max(current - 1, 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Recent Activity</h2>
        {/* <Link to="/activity" className="text-sm text-blue-600 hover:text-blue-800">
          View all
        </Link> */}
      </div>

      {activities.length > 0 ? (
        <>
          <div className="space-y-4">
            {currentActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-2 border-t">
              <button 
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center text-sm font-medium p-1 ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center text-sm font-medium p-1 ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Next
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-6 text-gray-500">
          No recent activity to display
        </div>
      )}
    </div>
  );
};



const UpcomingDeadlines = ({ projects }) => {
  // Add state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  

  const parseDate = (dateString) => {
    try {
      if (!dateString) {
        throw new Error('Empty date string');
      }
      const [day, month, year] = dateString.split('/');
      if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) {
        throw new Error('Invalid date format');
      }
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      date.setHours(0, 0, 0, 0);
      return date;
    } catch (error) {
      console.warn(`Failed to parse date: ${dateString}`, error.message);
      return null;
    }
  };
  const extractDeadlines = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return projects
      .map(project => {
        const dueDate = parseDate(project.dueDate);

        if (!dueDate) {
          console.warn(`Invalid dueDate for project ${project.name}: ${project.dueDate}`);
          return null;
        }

        // Calculate days left
        const diffTime = dueDate - today;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: project.id,
          title: `${project.name} Completion`,
          date: project.dueDate,
          daysLeft,
          project: project.name,
          projectId: project.id,
          completionPercentage: project.completionPercentage || project.progress || 0,
        };
      })
      // Remove invalid entries
      .filter(deadline => deadline !== null)
      // Filter upcoming deadlines (today or future, within 30 days)
      .filter(deadline => deadline.daysLeft >= 0)
      // Sort by days left (most urgent first)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const allDeadlines = extractDeadlines();
  console.log(allDeadlines,"huuuh");
  
  
  // Calculate total pages
  const totalPages = Math.ceil(allDeadlines.length / itemsPerPage);
  
  // Get current page items
  const currentDeadlines = allDeadlines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle page navigation
  const goToNextPage = () => {
    setCurrentPage(current => Math.min(current + 1, totalPages));
  };
  
  const goToPreviousPage = () => {
    setCurrentPage(current => Math.max(current - 1, 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Upcoming Deadlines</h2>
        <Link
          to={ROUTES.PROJECTS}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View all
        </Link>
      </div>

      {allDeadlines.length > 0 ? (
        <>
          <div className="space-y-3">
            {currentDeadlines.map((deadline) => (
              <div key={deadline.id} className="p-3 border rounded-lg">
                {/* <div className="flex justify-between">
                  <h3 className="font-medium">{deadline.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      deadline.daysLeft <= 1
                        ? "bg-red-100 text-red-800"
                        : deadline.daysLeft <= 3
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {deadline.daysLeft === 0
                      ? "Today"
                      : deadline.daysLeft === 1
                      ? "Tomorrow"
                      : `${deadline.daysLeft} days left`}
                  </span>
                </div> */}
                <div className="flex justify-between items-start">
                  <h3 className="font-medium flex-1 mr-3">{deadline.title}</h3>
                  <span
                    className={`text-xs px-3 py-2 rounded-full flex-shrink-0 ${
                      deadline.daysLeft <= 1
                        ? "bg-red-100 text-red-800"
                        : deadline.daysLeft <= 3
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {deadline.daysLeft === 0
                      ? "Today"
                      : deadline.daysLeft === 1
                      ? "Tomorrow"
                      : `${deadline.daysLeft} days left`}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Due on {deadline.date}</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-500 mr-2">Project:</span>
                  <Link
                    to={`${ROUTES.PROJECTS}/${deadline.projectId}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {deadline.project}
                  </Link>
                </div>
                
                
              </div>
            ))}
          </div>
          
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-2 border-t">
              <button 
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center text-sm font-medium p-1 ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center text-sm font-medium p-1 ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Next
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-6 text-gray-500">
          No upcoming deadlines in the next 30 days
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user,role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    clients: { count: 0, change: 0 },
    projects: { count: 0, change: 0 },
    tasks: { count: 0, change: 0 },
    documents: { count: 0, change: 0 },
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [complianceTasks, setComplianceTasks] = useState([]);

  const {
    data,
    isLoading: dashboardLoading,
    error,
  } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: fetchDashboardData,
    // Sample data for testing
    initialData: {
      stats: {
        totalProjects: {
          value: 12,
          change: 8.5,
          iconType: (
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          ),
          color: "bg-blue-100",
        },
        activeTasks: {
          value: 48,
          change: 12.3,
          iconType: (
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          ),
          color: "bg-green-100",
        },
        teamMembers: {
          value: 16,
          change: 0,
          iconType: (
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ),
          color: "bg-purple-100",
        },
        revenue: {
          value: "$24,500",
          change: -2.7,
          iconType: (
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          color: "bg-yellow-100",
        },
      },
      projects: [
        {
          id: "1",
          name: "Website Redesign",
          status: "On Track",
          progress: 75,
          dueDate: "Aug 20, 2023",
        },
        {
          id: "2",
          name: "Mobile App Development",
          status: "At Risk",
          progress: 45,
          dueDate: "Sep 15, 2023",
        },
        {
          id: "3",
          name: "Database Migration",
          status: "Delayed",
          progress: 30,
          dueDate: "Jul 30, 2023",
        },
      ],
      tasks: [
        {
          id: "1",
          title: "Design Homepage",
          status: "In Progress",
          assignee: "John Doe",
        },
        {
          id: "2",
          title: "API Integration",
          status: "In Progress",
          assignee: "Jane Smith",
        },
        {
          id: "3",
          title: "User Testing",
          status: "Pending",
          assignee: "Mike Johnson",
        },
        {
          id: "4",
          title: "Documentation",
          status: "Completed",
          assignee: "Sarah Williams",
        },
        {
          id: "5",
          title: "Bug Fixes",
          status: "Review",
          assignee: "Alex Brown",
        },
        {
          id: "6",
          title: "Performance Testing",
          status: "Pending",
          assignee: "Lisa Green",
        },
        {
          id: "7",
          title: "Security Audit",
          status: "Completed",
          assignee: "Tom Wilson",
        },
      ],
      activities: [
        {
          id: "1",
          type: "task",
          user: "John Doe",
          action: 'completed "Design Homepage" task',
          time: "2 hours ago",
        },
        {
          id: "2",
          type: "comment",
          user: "Jane Smith",
          action: 'commented on "API Integration" task',
          time: "4 hours ago",
        },
        {
          id: "3",
          type: "project",
          user: "Mike Johnson",
          action: 'created "Mobile App" project',
          time: "1 day ago",
        },
        {
          id: "4",
          type: "task",
          user: "Sarah Williams",
          action: 'assigned "Bug Fixes" to Alex',
          time: "2 days ago",
        },
      ],
      deadlines: [
        {
          id: "1",
          title: "Complete API Documentation",
          date: "Jul 28, 2023",
          daysLeft: 0,
          project: "Website Redesign",
          projectId: "1",
        },
        {
          id: "2",
          title: "User Testing Phase 1",
          date: "Jul 30, 2023",
          daysLeft: 2,
          project: "Mobile App Development",
          projectId: "2",
        },
        {
          id: "3",
          title: "Server Migration",
          date: "Aug 05, 2023",
          daysLeft: 8,
          project: "Database Migration",
          projectId: "3",
        },
      ],
    },
  });

  if (dashboardLoading) {
    return <div>Loading...</div>; 
  }
  useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetchDashboardData();
      setStats(response.stats);
      setRecentTasks(response.tasks);
      setComplianceTasks(response.complianceTasks);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  fetchData();
}, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
          Error loading dashboard data. Please try again.
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

  const {
    stats: dashboardStats,
    projects,
    tasks,
    activities,
    deadlines,
  } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your projects.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Projects"
          value={dashboardStats.totalProjects.value}
          change={dashboardStats.totalProjects.change}
          iconType={dashboardStats.totalProjects.iconType}
          color={dashboardStats.totalProjects.color}
        />
        <StatCard
          title="Active Tasks"
          value={dashboardStats.activeTasks.value}
          change={dashboardStats.activeTasks.change}
          iconType={dashboardStats.activeTasks.iconType}
          color={dashboardStats.activeTasks.color}
        />
        <StatCard
          title="Team Members"
          value={dashboardStats.teamMembers.value}
          change={dashboardStats.teamMembers.change}
          iconType={dashboardStats.teamMembers.iconType}
          color={dashboardStats.teamMembers.color}
        />
        {["admin", "manager", "finance"].includes(role) && (
              <StatCard
                title="Monthly Revenue"
                value={dashboardStats.revenue.value}
                change={dashboardStats.revenue.change}
                iconType={dashboardStats.revenue.iconType}
                color={dashboardStats.revenue.color}
              />
        )}
        </div>


      {/* Project progress and Task summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-medium mb-4">Project Progress</h2>

          {projects.length > 0 ? (
            <>
              {projects.slice(0,3).map((project) => (
                <ProjectProgress key={project.id} project={project} />
              ))}

              {/* only show link when there actually are projects */}
              <div className="text-center mt-4">
                <Link
                  to={ROUTES.PROJECTS}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all projects
                </Link>
              </div>
            </>
          ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-500 italic">
              No projects available.
            </p>
          </div>
        )}
        </div>

        <TaskSummary tasks={tasks} />
      </div>



      {/* Recent Activity and Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={activities} />
        <UpcomingDeadlines projects={projects} />
      </div>
    </div>
  );
};

export default Dashboard;
