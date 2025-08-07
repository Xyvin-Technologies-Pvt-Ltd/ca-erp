import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { projectsApi } from "../api/projectsApi";
import CreateProjectModal from "../components/CreateProjectModal";
import { fetchTasks } from "../api/tasks";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  CalendarIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const statusColors = {
  completed: "bg-green-100 text-green-700 border-green-200",
  "in-progress": "bg-blue-100 text-[#1c6ead] border-blue-200",
  planning: "bg-purple-100 text-purple-700 border-purple-200",
  "on-hold": "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const priorityColors = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    client: "",
  });
  const [paginations, setPaginations] = useState({
    page: 1,
    total: 0,
    limit: 9,
  });
  const { user, role } = useAuth();
  const location = useLocation();
  const [totalPage, setTotalPage] = useState(0);
  const [pages, setPages] = useState([]);
  const [clients, setClients] = useState([]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getAllProjects({
        page: currentPage,
        limit: paginations.limit,
        status: filters.status,
        priority: filters.priority,
        client: filters.client,
      });

      if (!data?.data || !Array.isArray(data.data)) {
        throw new Error("Invalid API response format");
      }

      const sortedProjects = data.data.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      setProjects(sortedProjects);
      setPaginations({
        page: currentPage,
        total: data.total || 0,
        limit: 9,
      });

      const totalPages = Math.ceil(data.total / paginations.limit);
      setTotalPage(totalPages);

      const pageNumbers = [];
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      setPages(pageNumbers);

      // Fetch unique clients for the filter dropdown
      const uniqueClients = [...new Set(data.data.map((project) => project.client?._id))];
      const clientData = data.data
        .filter((project) => project.client)
        .map((project) => ({
          _id: project.client._id,
          name: project.client.name,
        }));
      setClients([...new Set(clientData.map(JSON.stringify))].map(JSON.parse));

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Failed to load projects. Please try again later.");
      setLoading(false);
    }
  };

  const loadTasksAndProjects = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        fetchTasks({ ...filters, page: currentPage, limit: 9 }),
        projectsApi.getAllProjects({
          status: filters.status,
          priority: filters.priority,
          client: filters.client,
        }),
      ]);

      const taskList = Array.isArray(tasksData.tasks) ? tasksData.tasks : [];
      const taskProjectIds = new Set(taskList.map((task) => task.project?._id).filter(Boolean));

      const allProjects = Array.isArray(projectsData.data) ? projectsData.data : [];

      const filteredProjects = allProjects
        .filter((project) => taskProjectIds.has(project._id))
        .sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });

      setProjects(filteredProjects);

      setPaginations({
        page: currentPage,
        total: tasksData.total,
        limit: tasksData.pagination?.next?.limit || 10,
      });

      const uniqueClients = [...new Set(allProjects.map((project) => project.client?._id))];
      const clientData = allProjects
        .filter((project) => project.client)
        .map((project) => ({
          _id: project.client._id,
          name: project.client.name,
        }));
      setClients([...new Set(clientData.map(JSON.stringify))].map(JSON.parse));

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load tasks. Please try again later.");
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1); 
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      priority: "",
      client: "",
    });
    setCurrentPage(1); 
  };

  const handlePageChanges = (newPage) => {
    setCurrentPage(newPage);
  };

  const deleteProject = async () => {
    try {
      await projectsApi.deleteProject(projectToDelete.id);
      loadProjects();
      setSuccessMessage("Project deleted successfully");
      setProjectToDelete(null);
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project. Please try again later.");
    }
  };

  useEffect(() => {
    if (user?.role === "staff") {
      loadTasksAndProjects();
    } else {
      loadProjects();
    }
  }, [currentPage, filters]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const handleProjectCreated = (newProject) => {
    setProjects((prevProjects) => [...prevProjects, newProject]);
    setSuccessMessage("Project created successfully");
    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
    return () => clearTimeout(timer);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-t-2 border-b-2 border-indigo-500 rounded-full"
        ></motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-b from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-red-50 p-4 rounded-lg shadow-sm border border-red-200"
        >
          <p className="text-red-700">{error}</p>
          <motion.button
            onClick={loadProjects}
            className="mt-4 px-4 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl min-h-[90vh] mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Success message notification */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6 bg-green-50 p-4 rounded-lg shadow-sm border border-green-200 flex justify-between items-center"
          >
            <p className="text-green-700">{successMessage}</p>
            <motion.button
              onClick={() => setSuccessMessage("")}
              className="text-green-700 hover:text-green-900 focus:outline-none"
              whileHover={{ scale: 1.1 }}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        </div>
        <div className="flex space-x-4">
          {role !== "staff" && (
            <motion.button
              onClick={() => setIsModalOpen(true)}
              className="group px-6 py-3 bg-[#1c6ead] text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:ring-offset-2 transition-all duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl flex items-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Project
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 md:mb-0 flex items-center">
            <CalendarIcon className="h-6 w-6 text-[#1c6ead] mr-2" />
            Filters
          </h2>
          <motion.button
            onClick={resetFilters}
            className="text-sm text-[#1c6ead] hover:text-indigo-800 transition-colors duration-200 cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            Reset Filters
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Status
            </label>
            <motion.select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-all duration-300 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="planning">Planning</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </motion.select>
          </div>

          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Priority
            </label>
            <motion.select
              id="priority"
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-all duration-300 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </motion.select>
          </div>

          <div>
            <label
              htmlFor="client"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Client
            </label>
            <motion.select
              id="client"
              name="client"
              value={filters.client}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-all duration-300 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </motion.select>
          </div>
        </div>
      </motion.div>

      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200 hover:shadow-md transition-all duration-300"
        >
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            No projects found
          </h2>
          <p className="text-gray-500 mb-6">
            Get started by creating your first project.
          </p>
          {/* {role !== "staff" && (
            <motion.button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-[#1c6ead] text-white rounded-lg shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create First Project
            </motion.button>
          )} */}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="flex w-full"
              >
                <Link
                  to={`/projects/${project.id}`}
                  className="block bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col w-full h-80"
                >
                  <div className="px-6 py-5 border-b border-gray-200 h-35 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col flex-1">
                        <h2 className="text-lg font-medium text-gray-900 line-clamp-2">
                          {project.name}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Client: {project.client?.name}
                        </p>
                      </div>
                      <motion.span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status] || "bg-gray-100"}`}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className={`h-2 w-2 rounded-full mr-1 ${statusColors[project.status]?.split(' ')[0]}`}></span>
                        {project.status}
                      </motion.span>
                    </div>
                  </div>

                  <div className="px-6 py-4 space-y-4 h-33 flex flex-col">
                    <div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-indigo-600" />
                        Timeline
                      </p>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {project.startDate
                          ? new Date(project.startDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "No start date"}{" "}
                        -{" "}
                        {project.dueDate
                          ? new Date(project.dueDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "No due date"}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-600">
                          {project.totalTasks && project.totalTasks > 0
                            ? Math.round((project.completedTasks || 0) / project.totalTasks * 100)
                            : 0}% Complete
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          {project.completedTasks || 0} / {project.totalTasks || 0} Tasks
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-2 rounded-full bg-[#1c6ead]"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${project.totalTasks && project.totalTasks > 0
                              ? Math.round((project.completedTasks || 0) / project.totalTasks * 100)
                              : 0}%`,
                          }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {project.team && project.team.length > 0 ? (
                        <motion.div
                          className="relative flex -space-x-2"
                          whileHover={{ scale: 1.05 }}
                        >
                          {project.team.slice(0, 3).map((member, index) => (
                            <div
                              key={member._id || member.id || index}
                              className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center"
                            >
                              <span className="text-xs font-medium text-gray-500">
                                {member.name
                                  ? member.name.charAt(0).toUpperCase()
                                  : member.email
                                  ? member.email.charAt(0).toUpperCase()
                                  : "?"}
                              </span>
                            </div>
                          ))}
                          {project.team.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                +{project.team.length - 3}
                              </span>
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileHover={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-5 left-0 bg-[#1c6ead] text-white text-xs rounded-lg p-2 z-10 shadow-lg min-w-max"
                          >
                            {project.team.map((member, index) => (
                              <div key={member._id || member.id || index}>
                                {member.name || member.email || "Unknown Member"}
                              </div>
                            ))}
                          </motion.div>
                        </motion.div>
                      ) : (
                        <div className="text-xs text-gray-500 flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1 text-gray-400" />
                          No team members
                        </div>
                      )}
                      <motion.span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[project.priority] || "bg-gray-100"}`}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span
                          className={`h-2 w-2 rounded-full mr-1 ${(priorityColors[project.priority] || "bg-gray-100").split(" ")[0]}`}
                        ></span>
                        {project.priority}
                      </motion.span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Controls */}
      {projects.length > 0 && (
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * paginations.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * paginations.limit, paginations.total)}
                </span>{" "}
                of <span className="font-medium">{paginations.total}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <motion.button
                  onClick={() => handlePageChanges(1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-indigo-600 hover:bg-indigo-50 border-gray-200"
                  }`}
                  whileHover={{ scale: currentPage === 1 ? 1 : 1.02 }}
                  whileTap={{ scale: currentPage === 1 ? 1 : 0.98 }}
                >
                  <span className="sr-only">First</span>
                  <ChevronLeftIcon className="h-5 w-5" />
                </motion.button>
                {pages.map((page) => (
                  <motion.button
                    key={page}
                    onClick={() => handlePageChanges(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                        : "bg-white border-gray-200 text-gray-500 hover:bg-indigo-50"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {page}
                  </motion.button>
                ))}
                <motion.button
                  onClick={() => handlePageChanges(currentPage + 1)}
                  disabled={currentPage === totalPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                    currentPage === totalPage
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-indigo-600 hover:bg-indigo-50 border-gray-200"
                  }`}
                  whileHover={{ scale: currentPage === totalPage ? 1 : 1.02 }}
                  whileTap={{ scale: currentPage === totalPage ? 1 : 0.98 }}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRightIcon className="h-5 w-5" />
                </motion.button>
              </nav>
            </div>
          </div>
        </div>
      )}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default Projects;