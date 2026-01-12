import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "../api/tasks";
import { ROUTES } from "../config/constants";
import TaskCard from "../components/TaskCard";

const TaskList = () => {
  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("board"); // 'board' or 'list'

  // Fetch tasks data
  const {
    data: tasksData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    // Sample data for testing
    initialData: {
      tasks: [
        {
          id: "1",
          title: "Design Homepage Mockup",
          description:
            "Create wireframes and design mockups for the new homepage layout based on client feedback.",
          status: "Completed",
          project: { id: "1", name: "Website Redesign" },
          priority: "High",
          assignedTo: { id: "1", name: "Alice Smith", avatar: null },
          dueDate: "2023-07-15",
          estimatedHours: 6,
          tags: ["Design", "UI/UX"],
        },
        {
          id: "2",
          title: "Implement User Authentication",
          description:
            "Set up user authentication system with JWT and OAuth2 integration.",
          status: "In Progress",
          project: { id: "1", name: "Website Redesign" },
          priority: "High",
          assignedTo: { id: "2", name: "Bob Johnson", avatar: null },
          dueDate: "2023-08-05",
          estimatedHours: 12,
          tags: ["Backend", "Security"],
        },
        {
          id: "3",
          title: "Database Schema Design",
          description:
            "Create and document the database schema for the application, including tables, relationships, and constraints.",
          status: "Completed",
          project: { id: "2", name: "Mobile App Development" },
          priority: "Medium",
          assignedTo: { id: "3", name: "Carol Williams", avatar: null },
          dueDate: "2023-07-20",
          estimatedHours: 8,
          tags: ["Database", "Architecture"],
        },
        {
          id: "4",
          title: "API Documentation",
          description:
            "Create comprehensive documentation for the RESTful API endpoints, including request formats, responses, and error codes.",
          status: "Pending",
          project: { id: "2", name: "Mobile App Development" },
          priority: "Low",
          assignedTo: { id: "4", name: "Dave Brown", avatar: null },
          dueDate: "2023-08-10",
          estimatedHours: 5,
          tags: ["Documentation", "API"],
        },
        {
          id: "5",
          title: "Product Catalog Component",
          description:
            "Develop the product catalog component with filtering, sorting, and pagination capabilities.",
          status: "In Progress",
          project: { id: "3", name: "E-commerce Platform" },
          priority: "Medium",
          assignedTo: { id: "5", name: "Eve Davis", avatar: null },
          dueDate: "2023-08-01",
          estimatedHours: 10,
          tags: ["Frontend", "React"],
        },
        {
          id: "6",
          title: "Payment Gateway Integration",
          description:
            "Integrate with Stripe and PayPal payment gateways to enable secure checkout process.",
          status: "Pending",
          project: { id: "3", name: "E-commerce Platform" },
          priority: "High",
          assignedTo: { id: "6", name: "Frank Miller", avatar: null },
          dueDate: "2023-08-20",
          estimatedHours: 15,
          tags: ["Backend", "Payment"],
        },
        {
          id: "7",
          title: "Dashboard Analytics",
          description:
            "Implement data visualization components for the admin dashboard using Chart.js.",
          status: "Review",
          project: { id: "5", name: "Financial Dashboard" },
          priority: "Medium",
          assignedTo: { id: "7", name: "Grace Wilson", avatar: null },
          dueDate: "2023-07-25",
          estimatedHours: 8,
          tags: ["Frontend", "Analytics"],
        },
        {
          id: "8",
          title: "User Profile Settings",
          description:
            "Create user profile settings page with ability to update personal information, password, and preferences.",
          status: "In Progress",
          project: { id: "6", name: "Patient Portal" },
          priority: "Low",
          assignedTo: { id: "8", name: "Henry Taylor", avatar: null },
          dueDate: "2023-08-15",
          estimatedHours: 6,
          tags: ["Frontend", "UX"],
        },
      ],
      projects: [
        { id: "1", name: "Website Redesign" },
        { id: "2", name: "Mobile App Development" },
        { id: "3", name: "E-commerce Platform" },
        { id: "4", name: "CRM System Implementation" },
        { id: "5", name: "Financial Dashboard" },
        { id: "6", name: "Patient Portal" },
      ],
      statuses: ["Pending", "In Progress", "Review", "Completed", "Cancelled"],
      priorities: ["High", "Medium", "Low"],
      team: [
        { id: "1", name: "Alice Smith" },
        { id: "2", name: "Bob Johnson" },
        { id: "3", name: "Carol Williams" },
        { id: "4", name: "Dave Brown" },
        { id: "5", name: "Eve Davis" },
        { id: "6", name: "Frank Miller" },
        { id: "7", name: "Grace Wilson" },
        { id: "8", name: "Henry Taylor" },
      ],
    },
  });

  // Get projects, statuses, priorities, and team members from the data
  const projects = tasksData?.projects || [];
  const statuses = tasksData?.statuses || [];
  const priorities = tasksData?.priorities || [];
  const team = tasksData?.team || [];

  // Filter tasks
  const filteredTasks =
    tasksData?.tasks.filter((task) => {
      // Search filter
      if (
        searchQuery &&
        !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(
          task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      ) {
        return false;
      }

      // Status filter
      if (
        statusFilter !== "all" &&
        task.status.toLowerCase() !== statusFilter.toLowerCase()
      ) {
        return false;
      }

      // Project filter
      if (projectFilter !== "all" && task.project.id !== projectFilter) {
        return false;
      }

      // Priority filter
      if (
        priorityFilter !== "all" &&
        task.priority.toLowerCase() !== priorityFilter.toLowerCase()
      ) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter !== "all" && task.assignedTo.id !== assigneeFilter) {
        return false;
      }

      return true;
    }) || [];

  // Group tasks by status for board view
  const groupedTasks = {};
  statuses.forEach((status) => {
    groupedTasks[status] = filteredTasks.filter(
      (task) => task.status.toLowerCase() === status.toLowerCase()
    );
  });

  // Handler for clearing all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setProjectFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-gray-600">Manage and organize your tasks</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to={ROUTES.TASK_NEW}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1c6ead]"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Task
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 bg-white p-4 shadow-sm rounded-lg">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label htmlFor="search" className="sr-only">
              Search Tasks
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#1c6ead] focus:border-[#1c6ead] sm:text-sm"
                placeholder="Search tasks by title or description"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Project Filter */}
          <div>
            <label htmlFor="project" className="sr-only">
              Filter by Project
            </label>
            <select
              id="project"
              name="project"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#1c6ead] focus:border-[#1c6ead] sm:text-sm rounded-md"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label htmlFor="viewMode" className="sr-only">
              View Mode
            </label>
            <div className="flex justify-center rounded-md shadow-sm">
              <button
                type="button"
                className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                  viewMode === "board"
                    ? "bg-blue-50 text-blue-700 z-10 border-[#1c6ead]"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => setViewMode("board")}
              >
                <svg
                  className="mr-2.5 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                Board
              </button>
              <button
                type="button"
                className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                  viewMode === "list"
                    ? "bg-blue-50 text-blue-700 z-10 border-[#1c6ead]"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => setViewMode("list")}
              >
                <svg
                  className="mr-2.5 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                List
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="sr-only">
              Filter by Status
            </label>
            <select
              id="status"
              name="status"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#1c6ead] focus:border-[#1c6ead] sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status.toLowerCase()}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label htmlFor="priority" className="sr-only">
              Filter by Priority
            </label>
            <select
              id="priority"
              name="priority"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#1c6ead] focus:border-[#1c6ead] sm:text-sm rounded-md"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority.toLowerCase()}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <label htmlFor="assignee" className="sr-only">
              Filter by Assignee
            </label>
            <select
              id="assignee"
              name="assignee"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#1c6ead] focus:border-[#1c6ead] sm:text-sm rounded-md"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="all">All Assignees</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          {/* Clear filters */}
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={clearFilters}
          >
            Clear filters
          </button>

          {/* Results count */}
          <span className="text-sm text-gray-500">
            Showing {filteredTasks.length} of {tasksData?.tasks.length} tasks
          </span>
        </div>
      </div>

      {/* Task Display */}
      {isLoading ? (
        <div className="text-center py-12">
          <svg
            className="animate-spin h-10 w-10 text-blue-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      ) : error ? (
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
            Error loading tasks. Please try again.
          </p>
          <button
            className="mt-2 text-blue-600 hover:text-blue-800"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg
            className="h-12 w-12 text-gray-400 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">
            No tasks found matching your filters
          </p>
          <button
            className="mt-2 text-blue-600 hover:text-blue-800"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      ) : viewMode === "board" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {statuses.map((status) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{status}</h3>
                <span className="text-sm font-medium text-gray-500 px-2 py-1 bg-white rounded-full">
                  {groupedTasks[status].length}
                </span>
              </div>
              <div className="space-y-4">
                {groupedTasks[status].length > 0 ? (
                  groupedTasks[status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      showProject={true}
                      showAssignee={true}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <li key={task.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`${ROUTES.TASKS}/${task.id}`}
                      className="text-lg font-medium text-blue-600 hover:text-blue-800 truncate"
                    >
                      {task.title}
                    </Link>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="mr-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {task.project.name}
                      </p>
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {task.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {task.assignedTo.name}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <svg
                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Due on {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                        {task.priority}
                      </span>
                      {task.estimatedHours && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {task.estimatedHours} hrs
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TaskList;
