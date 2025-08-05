import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects } from "../api/projects";
import { ROUTES } from "../config/constants";

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "on hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "planning":
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

// Progress bar component
const ProgressBar = ({ percentage }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

// Project card component
const ProjectCard = ({ project }) => {
  // Calculate days remaining or overdue
  const getDaysRemaining = () => {
    if (!project.dueDate) {
      return {
        text: "No due date",
        className: "text-gray-500",
      };
    }
    
    const today = new Date();
    const dueDate = new Date(project.dueDate);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)} days overdue`,
        className: "text-red-600",
      };
    } else if (diffDays === 0) {
      return {
        text: "Due today",
        className: "text-yellow-600",
      };
    } else {
      return {
        text: `${diffDays} days remaining`,
        className: "text-green-600",
      };
    }
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Link
      to={`${ROUTES.PROJECTS}/${project.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
          <StatusBadge status={project.status} />
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {project.client ? project.client.name : "No client assigned"}
        </p>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">
              {project.completionPercentage}%
            </span>
          </div>
          <ProgressBar percentage={project.completionPercentage} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Start Date</p>
            <p className="font-medium">
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : "No start date"}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Due Date</p>
            <p className="font-medium flex items-center">
              {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "No due date"}
              <span className={`ml-2 text-xs ${daysRemaining.className}`}>
                {daysRemaining.text}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <PriorityBadge priority={project.priority} />
              <span className="ml-2 text-sm text-gray-500">
                {project.totalTasks} tasks
              </span>
            </div>
            <div className="flex -space-x-2">
              {project.teamMembers &&
                project.teamMembers.slice(0, 3).map((member, index) => (
                  <div
                    key={index}
                    className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
                    title={member.name}
                  >
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </div>
                ))}
              {project.teamMembers && project.teamMembers.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                  +{project.teamMembers.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

const ProjectList = () => {
  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");

  // Fetch projects data
  const {
    data: projectsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    // Sample data for testing
    initialData: {
      projects: [
        {
          id: "1",
          name: "Website Redesign",
          status: "In Progress",
          client: { id: "1", name: "Acme Corporation" },
          startDate: "2023-03-15",
          dueDate: "2023-08-30",
          completionPercentage: 65,
          priority: "High",
          totalTasks: 24,
          teamMembers: [
            { id: "1", name: "Alice Smith", avatar: null },
            { id: "2", name: "Bob Johnson", avatar: null },
            { id: "3", name: "Carol Williams", avatar: null },
            { id: "4", name: "Dave Brown", avatar: null },
          ],
        },
        {
          id: "2",
          name: "Mobile App Development",
          status: "In Progress",
          client: { id: "2", name: "TechSolutions Inc." },
          startDate: "2023-05-01",
          dueDate: "2023-11-15",
          completionPercentage: 35,
          priority: "Medium",
          totalTasks: 42,
          teamMembers: [
            { id: "2", name: "Bob Johnson", avatar: null },
            { id: "5", name: "Eve Davis", avatar: null },
            { id: "6", name: "Frank Miller", avatar: null },
          ],
        },
        {
          id: "3",
          name: "E-commerce Platform",
          status: "Planning",
          client: { id: "3", name: "Global Retail Group" },
          startDate: "2023-07-10",
          dueDate: "2024-01-20",
          completionPercentage: 10,
          priority: "Medium",
          totalTasks: 36,
          teamMembers: [
            { id: "1", name: "Alice Smith", avatar: null },
            { id: "7", name: "Grace Wilson", avatar: null },
          ],
        },
        {
          id: "4",
          name: "CRM System Implementation",
          status: "On Hold",
          client: { id: "4", name: "EcoEnergy Solutions" },
          startDate: "2023-02-15",
          dueDate: "2023-07-01",
          completionPercentage: 50,
          priority: "Low",
          totalTasks: 18,
          teamMembers: [
            { id: "3", name: "Carol Williams", avatar: null },
            { id: "8", name: "Helen Adams", avatar: null },
          ],
        },
      ],
    },
  });

  // Filter and sort projects
  const filteredProjects = projectsData?.projects.filter((project) => {
    return (
      (statusFilter === "all" || project.status.toLowerCase() === statusFilter) &&
      (clientFilter === "all" || project.client.name.toLowerCase().includes(clientFilter)) &&
      (priorityFilter === "all" || project.priority.toLowerCase() === priorityFilter)
    );
  });

  const sortedProjects = filteredProjects?.sort((a, b) => {
    if (sortBy === "dueDate") {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1; // Projects without due date go to the end
      if (!b.dueDate) return -1; // Projects without due date go to the end
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (sortBy === "completionPercentage") {
      return a.completionPercentage - b.completionPercentage;
    }
    return 0;
  });

  if (isLoading) return <p>Loading...</p>;

  if (error) return <p>Error fetching projects. Please try again later.</p>;

  return (
    <div>
      <div className="flex justify-between mb-6">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search projects..."
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in progress">In Progress</option>
            <option value="on hold">On Hold</option>
            <option value="planning">Planning</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            className="input"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex items-center space-x-4">
          <select
            className="input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="completionPercentage">Sort by Progress</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedProjects?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};

export default ProjectList;
