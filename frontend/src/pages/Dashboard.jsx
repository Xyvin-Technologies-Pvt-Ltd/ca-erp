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
import { getEvents, getEvent } from "../api/events.api";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import Modal from "react-modal";
import { Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, IndianRupee, MapPin, Play, User, TrendingUp, BarChart3 } from "lucide-react";
import { Pie, PieChart, Bar, BarChart, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

Modal.setAppElement('#root');


//******chart
const ChartContainer = ({ children, className }) => (
  <div className={`relative ${className}`}>
    {children}
  </div>
);

const ChartTooltip = ({ cursor, content, ...props }) => (
  <Tooltip cursor={cursor} content={content} {...props} />
);

const ChartTooltipContent = ({ active, payload, label, hideLabel }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        {!hideLabel && <p className="font-medium text-gray-900">{label}</p>}
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Static chart data
const projectStatusData = [
  { status: "Completed", count: 23, fill: "#1c6ead" },   // Fixed dark blue
  { status: "In Progress", count: 15, fill: "#f59e0b" }, 
  { status: "Planning", count: 12, fill: "#10b981" },    
  { status: "Archived", count: 3, fill: "#ef4444" },     
];

const monthlyRevenueData = [
  { month: "Jan", revenue: 45000, projects: 8 },
  { month: "Feb", revenue: 52000, projects: 12 },
  { month: "Mar", revenue: 48000, projects: 10 },
  { month: "Apr", revenue: 61000, projects: 15 },
  { month: "May", revenue: 55000, projects: 13 },
  { month: "Jun", revenue: 67000, projects: 18 },
];

// Project Status Pie Chart Component
const ProjectStatusChart = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-white rounded-2xl shadow-xl p-6 border border-[#1c6ead] hover:shadow-2xl transition-all duration-500"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <motion.div
            className="p-3 bg-[#1c6ead] rounded-xl shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <BarChart3 className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Project Status Overview</h3>
            <p className="text-sm text-gray-500">Distribution of current projects</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-semibold">+12.5%</span>
        </div>
      </div>

      <ChartContainer className="mx-auto aspect-square max-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={projectStatusData}
              dataKey="count"
              nameKey="status"
              stroke="0"
              strokeWidth={2}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {projectStatusData.map((item, index) => (
          <motion.div
            key={item.status}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
              hoveredIndex === index ? 'bg-gray-50 scale-105' : ''
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-xs font-medium text-gray-700">{item.status}</span>
            <span className="text-xs font-bold text-gray-900 ml-auto">{item.count}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Total Active Projects: {projectStatusData.reduce((sum, item) => sum + item.count, 0)}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Monthly Revenue Chart Component
const MonthlyRevenueChart = () => {
  const [activeBar, setActiveBar] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className="bg-white rounded-2xl shadow-xl p-6 border border-[#1c6ead] hover:shadow-2xl transition-all duration-500"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <motion.div
            className="p-3 bg-[#1c6ead] rounded-xl shadow-lg"
            whileHover={{ scale: 1.05, rotate: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <IndianRupee className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Monthly Revenue</h3>
            <p className="text-sm text-gray-500">Revenue trends over 6 months</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-semibold">+18.2%</span>
        </div>
      </div>

      <ChartContainer className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyRevenueData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1c6ead" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1c6ead" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              fontWeight={500}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              fontWeight={500}
              tickFormatter={(value) => `₹${value/1000}k`}
            />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg">
                      <p className="font-semibold text-gray-900 mb-2">{label} 2024</p>
                      <div className="space-y-1">
                        <p className="text-sm text-blue-600">
                          Revenue: ₹{payload[0]?.value?.toLocaleString()}
                        </p>
                        <p className="text-sm text-purple-600">
                          Projects: {payload[1]?.value}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#revenueGradient)"
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2, fill: "#ffffff" }}
            />
            <Bar
              dataKey="projects"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              opacity={0.7}
              onMouseEnter={(_, index) => setActiveBar(index)}
              onMouseLeave={() => setActiveBar(null)}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="p-4 bg-blue-50 rounded-xl border border-blue-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-sm font-medium text-blue-700">Avg Revenue</span>
          </div>
          <p className="text-xl font-bold text-blue-900">
            ₹{Math.round(monthlyRevenueData.reduce((sum, item) => sum + item.revenue, 0) / monthlyRevenueData.length).toLocaleString()}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="p-4 bg-purple-50 rounded-xl border border-purple-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="text-sm font-medium text-purple-700">Total Projects</span>
          </div>
          <p className="text-xl font-bold text-purple-900">
            {monthlyRevenueData.reduce((sum, item) => sum + item.projects, 0)}
          </p>
        </motion.div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Growth rate increasing month over month</span>
        </div>
      </div>
    </motion.div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-rose-600 text-center p-6">
          <div className="w-12 h-12 mx-auto mb-3 bg-rose-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p>Something went wrong with the calendar. Please try again later.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Status colors for events (customized based on event status)
const statusColors = {
  upcoming: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircleIcon },
  ongoing: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: ClockIcon },
  completed: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", icon: CalendarDaysIcon },
  cancelled: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", icon: XCircleIcon },
};

// Utility functions for calendar
function getMonthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function getDaysInMonth(year, month) {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const StatCard = ({ title, value, change, iconType, color }) => {
  const isPositive = change >= 0;
  const changeClass = isPositive ? "text-emerald-600" : "text-rose-600";
  const changeIcon = isPositive ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );

  const titleIcons = {
    "Total Projects": (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    "Active Tasks": (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    "Team Members": (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    "Revenue": (
      <IndianRupee className="w-6 h-6 text-yellow-600" />
    ),
  };

  return (
    <div className="group bg-white rounded-xl  border-2 border-[#1c6ead] shadow-lg  p-6 hover:shadow-lg hover:border-[#1c6ead] transition-all duration-300 hover:transform hover:-translate-y-1">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {titleIcons[title]}
            <p className="text-sm font-medium text-slate-600">{title}</p>
          </div>
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
      <div className={`p-3 rounded-xl ${config.bg} ${config.text} hover:scale-110 transition-all duration-200 border-[#1c6ead]`}>
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
    <div className="flex items-start space-x-4 py-4 px-2 rounded-lg hover:bg-slate-50 transition-all duration-200 group shadow-lg border-[#1c6ead]">
      {getActivityIcon(activity.type)}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200">{activity.title}</p>
          <p className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-full">
            {formatTimeAgo(activity.timestamp)}
          </p>
        </div>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          {(() => {
            // Format dueDate in description if present
            const desc = activity.description;
            const dueDateMatch = desc && desc.match(/dueDate:.*?([A-Za-z]{3} [A-Za-z]{3} \d{2} \d{4} [\d:]+ GMT[+-]\d{4} \(.*?\))/);
            if (dueDateMatch) {
              const dateStr = dueDateMatch[1];
              const dateObj = new Date(dateStr);
              if (!isNaN(dateObj.getTime())) {
                // Replace the raw date string with formatted date
                return desc.replace(dateStr, dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
              }
            }
            return desc;
          })()}
        </p>
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
    <div className="bg-white p-5 rounded-xl shadow-lg border border-[#1c6ead] mb-4 hover:shadow-lg hover:border-[#1c6ead] transition-all duration-300 group">
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
    <div className="bg-white rounded-xl shadow-lg border border-[#1c6ead] p-6 hover:shadow-lg transition-all duration-300">
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
            <div key={status} className="flex items-center p-4 border-2 border-blue-200 rounded-xl hover:border-[#1c6ead] hover:shadow-md transition-all duration-300 group">
              <div className={`w-3 h-3 rounded-full mr-3 ${config.dot} group-hover:scale-125 transition-transform duration-200`} />
              <div>
                <p className="text-xs text-slate-500 font-medium">{status}</p>
                <p className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-xl border-[#1c6ead]">
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
      <div className="bg-white rounded-xl shadow-sm border border-[#1c6ead] p-6">
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
      <div className="bg-white rounded-xl shadow-sm border border-[#1c6ead] p-6">
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
    <div className="bg-white rounded-xl shadow-sm border border-[#1c6ead] p-6 hover:shadow-lg transition-all duration-300">
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
    <div className="bg-white rounded-xl shadow-sm border border-[#1c6ead] p-6 hover:shadow-lg transition-all duration-300">
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
                <div key={deadline.id} className={`p-4 border-2 ${urgencyConfig.border} rounded-xl hover:shadow-md transition-all duration-300 group border-[#1c6ead]`}>
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
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
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

const eventStatusColors = {
  upcoming: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: Clock,
    gradient: 'from-blue-400 to-blue-600',
    dot: 'bg-blue-500',
    statusBg: 'bg-blue-100',
    statusText: 'text-blue-800'
  },
  ongoing: {
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: Play,
    gradient: 'from-emerald-400 to-emerald-600',
    dot: 'bg-emerald-500',
    statusBg: 'bg-emerald-100',
    statusText: 'text-emerald-800'
  },
  completed: {
    bg: 'bg-gray-50 hover:bg-gray-100',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: CheckCircle,
    gradient: 'from-gray-400 to-gray-600',
    dot: 'bg-gray-500',
    statusBg: 'bg-gray-100',
    statusText: 'text-gray-800'
  }
};

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

const EventCalendar = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // Helper function to get local date string (YYYY-MM-DD)
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to get today's date string
  const getTodayString = () => {
    return getLocalDateString(new Date());
  };

  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ['events', selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split("-");
      const range = getMonthRange(new Date(year, month - 1));
      const response = await getEvents({ ...range });
      console.log('getEvents response:', response);
      return response;
    },
  });

  const handleDateClick = async (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    const clickedDate = new Date(year, month - 1, day);
    setSelectedDate(clickedDate);
    
    try {
      const eventResponse = await getEvent(dateStr);
      console.log('getEvent response for', dateStr, ':', eventResponse);
      const fetchedEvents = eventResponse?.data?.events || [];
      setSelectedEvents(fetchedEvents);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching events for date:', dateStr, err);
      const fallbackEvents = eventsData?.data?.filter(event => {
        try {
          if (!event.startDate) return false;
          
          const startDate = new Date(event.startDate);
          const endDate = event.endDate ? new Date(event.endDate) : startDate;
          
          const actualStartDate = startDate <= endDate ? startDate : endDate;
          const actualEndDate = startDate <= endDate ? endDate : startDate;
          
          const clickedDate = new Date(dateStr);
          return clickedDate >= actualStartDate && clickedDate <= actualEndDate;
        } catch (error) {
          console.warn('Invalid event date in fallback:', event, error);
          return false;
        }
      }) || [];
      console.log('Fallback events for', dateStr, ':', fallbackEvents);
      setSelectedEvents(fallbackEvents);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvents([]);
    setSelectedDate(null);
  };

  const eventsByDate = {};
  eventsData?.data?.forEach((event) => {
    try {
      if (event.startDate) {
        const startDate = new Date(event.startDate);
        const endDate = event.endDate ? new Date(event.endDate) : startDate;
        
        const actualStartDate = startDate <= endDate ? startDate : endDate;
        const actualEndDate = startDate <= endDate ? endDate : startDate;
        
        const currentDate = new Date(actualStartDate);
        while (currentDate <= actualEndDate) {
          const dateStr = getLocalDateString(currentDate);
          if (!eventsByDate[dateStr]) {
            eventsByDate[dateStr] = [];
          }
          eventsByDate[dateStr].push(event);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    } catch (err) {
      console.warn('Invalid event date:', event, err);
    }
  });
  console.log('Events by date:', eventsByDate);

  const [year, month] = selectedMonth.split("-");
  const days = getDaysInMonth(Number(year), Number(month) - 1);
  const firstDayOfWeek = days[0].getDay();
  const eventDays = days.filter((day) => eventsByDate[getLocalDateString(day)]);

  const todayStr = getTodayString();

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-xl p-8 border border-[#1c6ead] hover:shadow-2xl transition-all duration-500 backdrop-blur-sm"
      >
        {/* Header with enhanced controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-6"
        >
          {/* Title Section */}
          <div className="flex items-center space-x-4">
            <motion.div
              className="p-3 bg-blue-500 rounded-xl shadow-lg border-[#1c6ead]"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Calendar className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Events Calendar</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your upcoming events</p>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Month Navigation */}
            <div className="flex items-center space-x-2 bg-gray-50 rounded-xl p-2 border-[#1c6ead]">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200"
                onClick={() => {
                  const date = new Date(selectedMonth);
                  date.setMonth(date.getMonth() - 1);
                  setSelectedMonth(date.toISOString().slice(0, 7));
                }}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </motion.button>
              
              <motion.input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border-0 bg-transparent text-center font-semibold text-gray-900 focus:outline-none focus:ring-0 min-w-[140px]"
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200"
                onClick={() => {
                  const date = new Date(selectedMonth);
                  date.setMonth(date.getMonth() + 1);
                  setSelectedMonth(date.toISOString().slice(0, 7));
                }}
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </motion.button>
            </div>

            {/* Status Legend */}
            <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 border-[#1c6ead]">
              {Object.entries(eventStatusColors).map(([status, colors]) => {
                const Icon = colors.icon;
                return (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors.dot}`}></div>
                    <Icon className={`h-4 w-4 ${colors.text}`} />
                    <span className="text-sm font-medium capitalize text-gray-700">{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Calendar Content */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded-lg w-1/3 mb-6"></div>
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 42 }, (_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl border-[#1c6ead]"></div>
              ))}
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-rose-600 font-medium">Error loading events</p>
            <p className="text-gray-500 text-sm mt-2">Please try refreshing the page</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-3">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="text-center font-bold text-gray-700 text-sm py-3 bg-gray-50 rounded-xl border-[#1c6ead]"
                >
                  {day}
                </motion.div>
              ))}
              
              {/* Empty cells for days before month start */}
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} className="h-24"></div>
              ))}
              
              {/* Calendar Days */}
              <AnimatePresence mode="wait">
                {days.map((day, index) => {
                  const dateStr = getLocalDateString(day);
                  const events = eventsByDate[dateStr] || [];
                  const firstEvent = events[0];
                  const isToday = dateStr === todayStr;
                  const hasMultipleEvents = events.length > 1;
                  
                  // Group events by status for better display
                  const eventsByStatus = events.reduce((acc, event) => {
                    if (!acc[event.status]) acc[event.status] = [];
                    acc[event.status].push(event);
                    return acc;
                  }, {});
                  
                  return (
                    <motion.div
                      key={dateStr}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.02,
                        type: "spring",
                        stiffness: 300 
                      }}
                      className={`relative rounded-2xl p-3 h-24 flex flex-col justify-between group cursor-pointer overflow-hidden ${
                        isToday 
                          ? 'bg-blue-500 text-white shadow-lg ring-2 ring-indigo-200 border-[#1c6ead]' 
                          : firstEvent 
                            ? `${eventStatusColors[firstEvent.status]?.bg} border-2 ${eventStatusColors[firstEvent.status]?.border}` 
                            : "bg-gray-50 border-2 border-gray-100 hover:border-gray-200"
                      } transition-all duration-300`}
                      whileHover={{ 
                        scale: 1.05, 
                        y: -2,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDateClick(dateStr)}
                    >
                      {/* Priority indicator */}
                      {firstEvent?.priority && (
                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${priorityColors[firstEvent.priority]}`} />
                      )}
                      
                      {/* Day number */}
                      <motion.span 
                        className={`font-bold text-lg ${
                          isToday 
                            ? 'text-white' 
                            : firstEvent 
                              ? eventStatusColors[firstEvent.status]?.text 
                              : 'text-gray-900'
                        }`}
                        whileHover={{ scale: 1.1 }}
                      >
                        {day.getDate()}
                      </motion.span>
                      
                      {/* Event indicators with status */}
                      <div className="flex flex-col gap-1 mt-1">
                        {Object.entries(eventsByStatus).slice(0, 2).map(([status, statusEvents]) => {
                          const Icon = eventStatusColors[status]?.icon;
                          return (
                            <motion.div
                              key={status}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                                isToday 
                                  ? 'bg-white/20 text-white' 
                                  : `${eventStatusColors[status]?.statusBg} ${eventStatusColors[status]?.statusText}`
                              }`}
                            >
                              <Icon className="h-3 w-3" />
                              <span className="capitalize">{status}</span>
                              {statusEvents.length > 1 && (
                                <span className="ml-1 text-xs">({statusEvents.length})</span>
                              )}
                            </motion.div>
                          );
                        })}
                        
                        {/* Show additional events indicator */}
                        {Object.keys(eventsByStatus).length > 2 && (
                          <div className={`text-xs px-2 py-1 rounded-md ${
                            isToday 
                              ? 'bg-white/20 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            +{Object.keys(eventsByStatus).length - 2} more
                          </div>
                        )}
                      </div>
                      
                      {/* Hover overlay */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={false}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
        

        {/* Enhanced Modal */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          className="bg-white rounded-2xl shadow-2xl p-0 max-w-4xl mx-auto mt-20 max-h-[80vh] overflow-hidden border-[#1c6ead]"
          overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Modal Header */}
            <div className="bg-blue-600 text-white p-6 rounded-t-2xl border-[#1c6ead]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedDate?.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  <p className="text-indigo-100 mt-1">
                    {selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'} scheduled
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {selectedEvents.length > 0 ? (
                <div className="space-y-6">
                  {selectedEvents.map((event, index) => {
                    const StatusIcon = eventStatusColors[event.status]?.icon;
                    return (
                      <motion.div
                        key={event._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`p-6 rounded-2xl border-2 ${eventStatusColors[event.status]?.bg} ${eventStatusColors[event.status]?.border} hover:shadow-lg transition-all duration-300 relative overflow-hidden border-[#1c6ead]`}>
                        {/* Background gradient for visual appeal */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${eventStatusColors[event.status]?.gradient} opacity-5`}></div>
                        
                        {/* Event Header */}
                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                            {StatusIcon && (
                              <div className={`p-3 rounded-xl bg-gradient-to-br ${eventStatusColors[event.status]?.gradient} shadow-lg`}>
                                <StatusIcon className="h-6 w-6 text-white" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${eventStatusColors[event.status]?.statusBg} ${eventStatusColors[event.status]?.statusText} border-2 ${eventStatusColors[event.status]?.border} mt-2`}>
                                <div className={`w-2 h-2 rounded-full ${eventStatusColors[event.status]?.dot}`}></div>
                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          {event.priority && (
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${priorityColors[event.priority]}`} />
                              <span className="text-sm font-medium text-gray-600 capitalize">{event.priority}</span>
                            </div>
                          )}
                        </div>

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                              <p className="text-gray-900">{event.description || 'No description available'}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Date Range</p>
                              <p className="text-gray-900 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(event.startDate).toLocaleDateString()}
                                {event.endDate && event.endDate !== event.startDate && 
                                  ` - ${new Date(event.endDate).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Created By</p>
                              <p className="text-gray-900 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {event.createdBy?.name || 'Unknown'}
                              </p>
                            </div>
                            
                            {event.location && (
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Location</p>
                                <p className="text-gray-900 flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">No events scheduled for this date</p>
                </motion.div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-6 rounded-b-2xl flex justify-end gap-3 border-[#1c6ead]">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeModal}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </Modal>
      </motion.div>
    </ErrorBoundary>
  );
};

const Dashboard = () => {
  const { user, role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    clients: { count: 0, change: 0 },
    projects: { count: 0, change: 0 },
    tasks: { count: 0, change: 0 },
    documents: { count: 0, change: 0 },
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [complianceTasks, setComplianceTasks] = useState([]);

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
  });

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

  if (isLoading || dashboardLoading) {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProjectStatusChart />
        <MonthlyRevenueChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-medium mb-4">Project Progress</h2>
          {projects.length > 0 ? (
            <>
              {projects.slice(0, 3).map((project) => (
                <ProjectProgress key={project.id} project={project} />
              ))}
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
            <div className="bg-white p-6 rounded-lg shadow text-center border-[#1c6ead]">
              <p className="text-gray-500 italic">No projects available.</p>
            </div>
          )}
        </div>
        <TaskSummary tasks={tasks} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RecentActivity activities={activities} />
        <UpcomingDeadlines projects={projects} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <EventCalendar />
      </div>
    </div>
  );
};

export default Dashboard;