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
  const changeClass = isPositive ? "text-emerald-600" : "text-rose-600";
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
    <div className="group bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:transform hover:-translate-y-1">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors duration-200">{value}</p>
          {change !== null && (
            <div className={`flex items-center ${changeClass}`}>
              <span className="flex items-center text-sm font-semibold">
                <span className="mr-1 transition-transform duration-200 group-hover:scale-110">
                  {changeIcon}
                </span>
                <span>
                  {Math.abs(change)}% from last month
                </span>
              </span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${color} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <div className="text-current opacity-80 group-hover:opacity-100 transition-opacity duration-200">
            {iconType}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ activity }) => {
  const getActivityIcon = (type) => {
    const iconConfig = {
      task_created: {
        bg: "bg-emerald-100",
        text: "text-emerald-600",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )
      },
      task_completed: {
        bg: "bg-blue-100",
        text: "text-blue-600",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )
      },
      client_added: {
        bg: "bg-purple-100",
        text: "text-purple-600",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        )
      },
      project_created: {
        bg: "bg-amber-100",
        text: "text-amber-600",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      },
      project_milestone: {
        bg: "bg-amber-100",
        text: "text-amber-600",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      },
      deadline_updated: {
        bg: "bg-orange-100",
        text: "text-orange-600",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      document_uploaded: {
        bg: "bg-indigo-100",
        text: "text-indigo-600",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )
      }
    };

    const config = iconConfig[type] || {
      bg: "bg-slate-100",
      text: "text-slate-600",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };

    return (
      <div className={`p-3 rounded-xl ${config.bg} ${config.text} hover:scale-110 transition-all duration-200`}>
        {config.icon}
      </div>
    );
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
    <div className="flex items-start space-x-4 py-4 px-2 rounded-lg hover:bg-slate-50 transition-all duration-200 group">
      {getActivityIcon(activity.type)}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200">{activity.title}</p>
          <p className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-full">
            {formatTimeAgo(activity.timestamp)}
          </p>
        </div>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{activity.description}</p>
      </div>
    </div>
  );
};

const ProjectProgress = ({ project }) => {
  const getStatusConfig = (status) => {
    const configs = {
      "On Track": { bg: "bg-emerald-100", text: "text-emerald-800", progress: "bg-emerald-500" },
      "At Risk": { bg: "bg-amber-100", text: "text-amber-800", progress: "bg-amber-500" }, 
      "Delayed": { bg: "bg-rose-100", text: "text-rose-800", progress: "bg-rose-500" }
    };
    return configs[status] || configs["On Track"];
  };

  const statusConfig = getStatusConfig(project.status);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-4 hover:shadow-md hover:border-slate-300 transition-all duration-300 group">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200">{project.name}</h3>
        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
          {project.status}
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-3 font-medium">Due {project.dueDate}</p>
      <div className="flex justify-between text-sm text-slate-600 mb-2 font-medium">
        <span>Progress</span>
        <span className="font-semibold">{project.completionPercentage}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${statusConfig.progress}`}
          style={{ width: `${project.completionPercentage}%` }}
        />
      </div>
    </div>
  );
};

const TaskSummary = ({ tasks }) => {
  const allStatuses = ["In Progress", "Pending", "Completed", "Review"];
  
  const statusMap = allStatuses.map(status => ({
    status,
    count: tasks.find(t => t.status === status)?.count || 0
  }));

  const getStatusConfig = (status) => {
    const configs = {
      "In Progress": { bg: "bg-blue-500", dot: "bg-blue-500" },
      "Pending": { bg: "bg-amber-500", dot: "bg-amber-500" },
      "Completed": { bg: "bg-emerald-500", dot: "bg-emerald-500" },
      "Review": { bg: "bg-purple-500", dot: "bg-purple-500" }
    };
    return configs[status] || configs["Pending"];
  };

  const completedTasks = tasks.find(t => t.status === "Completed")?.count || 0;
  const totalTasks = tasks.reduce((sum, t) => sum + (t.count || 0), 0);
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Task Summary</h2>
        <Link
          to={ROUTES.TASKS}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-all duration-200"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {statusMap.map(({ status, count }) => {
          const config = getStatusConfig(status);
          return (
            <div key={status} className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
              <div className={`w-3 h-3 rounded-full mr-3 ${config.dot} group-hover:scale-125 transition-transform duration-200`} />
              <div>
                <p className="text-xs text-slate-500 font-medium">{status}</p>
                <p className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-xl">
        <div className="flex justify-between text-sm text-slate-600 mb-2 font-medium">
          <span>Overall Completion</span>
          <span className="font-bold text-slate-900">{completionPercentage}%</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const RecentActivity = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const response = await fetchRecentActivity();
      return response;
    }
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-slate-200 rounded-lg w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="rounded-xl bg-slate-200 h-12 w-12"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded-lg w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded-lg w-1/2"></div>
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-rose-600 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-rose-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          Error loading recent activity
        </div>
      </div>
    );
  }

  const activities = data?.data?.activities || [];
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const currentActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const goToNextPage = () => {
    setCurrentPage(current => Math.min(current + 1, totalPages));
  };
  
  const goToPreviousPage = () => {
    setCurrentPage(current => Math.max(current - 1, 1));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
      </div>

      {activities.length > 0 ? (
        <>
          <div className="space-y-2">
            {currentActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
              <button 
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === 1 
                    ? 'text-slate-400 cursor-not-allowed bg-slate-100' 
                    : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium">
                {currentPage} of {totalPages}
              </span>
              
              <button 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === totalPages 
                    ? 'text-slate-400 cursor-not-allowed bg-slate-100' 
                    : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                }`}
              >
                Next
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">No recent activity to display</p>
        </div>
      )}
    </div>
  );
};

const UpcomingDeadlines = ({ projects }) => {
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
      .filter(deadline => deadline !== null)
      .filter(deadline => deadline.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const allDeadlines = extractDeadlines();
  const totalPages = Math.ceil(allDeadlines.length / itemsPerPage);
  const currentDeadlines = allDeadlines.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const goToNextPage = () => {
    setCurrentPage(current => Math.min(current + 1, totalPages));
  };
  
  const goToPreviousPage = () => {
    setCurrentPage(current => Math.max(current - 1, 1));
  };

  const getUrgencyConfig = (daysLeft) => {
    if (daysLeft <= 1) {
      return { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-200" };
    } else if (daysLeft <= 3) {
      return { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" };
    } else {
      return { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" };
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming Deadlines</h2>
        <Link
          to={ROUTES.PROJECTS}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-all duration-200"
        >
          View all →
        </Link>
      </div>

      {allDeadlines.length > 0 ? (
        <>
          <div className="space-y-4">
            {currentDeadlines.map((deadline) => {
              const urgencyConfig = getUrgencyConfig(deadline.daysLeft);
              return (
                <div key={deadline.id} className={`p-4 border-2 ${urgencyConfig.border} rounded-xl hover:shadow-md transition-all duration-300 group`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-slate-900 flex-1 mr-3 group-hover:text-indigo-600 transition-colors duration-200">
                      {deadline.title}
                    </h3>
                    <span className={`text-xs px-3 py-2 rounded-full font-bold ${urgencyConfig.bg} ${urgencyConfig.text} flex-shrink-0`}>
                      {deadline.daysLeft === 0
                        ? "Today"
                        : deadline.daysLeft === 1
                        ? "Tomorrow"
                        : `${deadline.daysLeft} days left`}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3 font-medium">Due on {deadline.date}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xs text-slate-500 mr-2 font-medium">Project:</span>
                      <Link
                        to={`${ROUTES.PROJECTS}/${deadline.projectId}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline transition-all duration-200"
                      >
                        {deadline.project}
                      </Link>
                    </div>
                    <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
              <button 
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className={`flex items-center text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === 1 
                    ? 'text-slate-400 cursor-not-allowed bg-slate-100' 
                    : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium">
                {currentPage} of {totalPages}
              </span>
              
              <button 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentPage === totalPages 
                    ? 'text-slate-400 cursor-not-allowed bg-slate-100' 
                    : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
                }`}
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

  // Get logged-in user id from localStorage
  let userId = undefined;
  try {
    const userData = JSON.parse(localStorage.getItem('userData'));
    userId = userData?._id;
  } catch (e) {
    userId = undefined;
  }

  const {
    data,
    isLoading: dashboardLoading,
    error,
  } = useQuery({
    queryKey: ["dashboardData", userId],
    queryFn: () => fetchDashboardData(userId),
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
        const response = await fetchDashboardData(userId);
        setStats(response.stats);
        setRecentTasks(response.tasks);
        setComplianceTasks(response.complianceTasks);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [userId]);

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
       
              <StatCard
                title="Revenue"
                value={dashboardStats.revenue.value}
                change={dashboardStats.revenue.change}
                iconType={dashboardStats.revenue.iconType}
                color={dashboardStats.revenue.color}
              />
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