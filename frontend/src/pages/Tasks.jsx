import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchTasks } from "../api/tasks";
import { fetchProjects } from "../api/projects";
import { motion, AnimatePresence } from "framer-motion";
import CreateTaskModal from "../components/CreateTaskModal";
import PresetTaskCompletionWizard from "../components/PresetTaskCompletionWizard";
import { useAuth } from "../context/AuthContext";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-blue-100 text-blue-800",
  review: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  verification: "bg-indigo-100 text-indigo-800",
};

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-green-100 text-green-800",
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginations, setPaginations] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const { role, user } = useAuth();

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    project: "",
    assignedTo: "",
  });

  const [teamMembers, setTeamMembers] = useState([]);
  const [staffProjects, setStaffProjects] = useState([]);
  const [reload, setReload] = useState(false);
  const [pendingSetupTasks, setPendingSetupTasks] = useState([]);

  const loadTasksAndProjects = async () => {
    try {
      setLoading(true);
      setLoading(true);
      const [tasksData, projectsData, pendingData] = await Promise.all([
        fetchTasks({ ...filters, page: currentPage, limit: 10 }),
        fetchProjects(),
        fetchTasks({ isPresetPending: 'true', limit: 100 }),
      ]);


      setTasks(Array.isArray(tasksData.tasks) ? tasksData.tasks : []);
      setProjects(Array.isArray(projectsData.data) ? projectsData.data : []);
      setPendingSetupTasks(Array.isArray(pendingData.tasks) ? pendingData.tasks : []);

      // If logged-in user is staff → filter assigned projects
      if (role === "staff") {
        const assigned = projectsData.data.filter((p) =>
          p.assignedTo?.some((a) => a.user?._id === user._id)
        );
        setStaffProjects(assigned);
      }

      setTeamMembers(
        Array.isArray(tasksData.tasks)
          ? tasksData.tasks.map((task) => task.assignedTo).filter(Boolean)
          : []
      );

      setPaginations({
        page: currentPage,
        total: tasksData.total,
        limit: tasksData.pagination?.next?.limit || 10,
      });

      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load tasks. Please try again later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasksAndProjects();
  }, [filters, currentPage, reload]);

  const handlePageChanges = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
    loadTasksAndProjects();
    setIsModalOpen(false);
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
      project: "",
      assignedTo: "",
    });
    setCurrentPage(1);
  };

  const uniqueMembers = Array.from(
    new Map(
      tasks
        .filter((t) => t.assignedTo)
        .map((t) => [t.assignedTo._id, t.assignedTo])
    ).values()
  );

  const totalPage = Math.ceil(paginations.total / paginations.limit);
  const pages = Array.from({ length: totalPage }, (_, i) => i + 1);

  const capitalizeText = (text) => {
    if (!text) return text;
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Staff create-task permission check
  const canStaffCreateTask =
    role === "staff" &&
    staffProjects.some((project) =>
      project.assignedTo.some(
        (a) =>
          a.user?._id === user._id &&
          a.levelIndex === project.currentLevelIndex
      )
    );

  const visibleTasks = tasks;

  const isAdmin = role === 'admin' || role === 'manager' || role === 'superadmin';
  const wizardTasks = isAdmin
    ? pendingSetupTasks
    : pendingSetupTasks.filter(t => (t.assignedTo?._id === user?._id || t.assignedTo === user?._id || t.assignedTo?.id === user?._id));

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center items-center h-screen"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-16 w-16 border-t-2 border-b-2 border-[#1c6ead] rounded-full"
        ></motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-b from-gray-50 to-gray-100"
      >
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-red-700">{error}</p>
          <motion.button
            onClick={loadTasksAndProjects}
            className="mt-4 px-4 py-2 bg-[#1c6ead] text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max îndex-w-7xl min-h-[90vh] mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-b from-gray-50 to-gray-100"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-3 mb-4 sm:mb-0"
        >
          <ClipboardDocumentListIcon className="h-8 w-8 text-[#1c6ead]" />
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        </motion.div>
         {/* {(role === "admin" || role === "manager" || canStaffCreateTask) && ( */}
        {(role === "admin" || role === "manager") && (
          <motion.button
            onClick={() => setIsModalOpen(true)}
            className="group px-6 py-3 bg-[#1c6ead] text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:ring-offset-2 transition-all duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl flex items-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-2">
              <PlusIcon className="h-5 w-5" />
              <span>Create Task</span>
            </div>
          </motion.button>
        )}
      </div>

      {/* Pending Tasks Section */}
      {pendingSetupTasks.length > 0 && role !== "staff" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-amber-800 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {wizardTasks.length > 0 ? "Pending Setup Action Required" : "Project Setup in Progress"}
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                {wizardTasks.length > 0
                  ? `You have ${wizardTasks.length} tasks that need to be set up.`
                  : `There are ${pendingSetupTasks.length} pending tasks waiting for completion by other members.`}
              </p>
            </div>
            {wizardTasks.length > 0 && (
              <button
                onClick={() => setIsWizardOpen(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 shadow-sm transition-all"
              >
                Complete Setup
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 md:mb-0 flex items-center">
            <ClipboardDocumentListIcon className="h-6 w-6 text-[#1c6ead] mr-2" />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
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
              htmlFor="project"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Project
            </label>
            <motion.select
              id="project"
              name="project"
              value={filters.project}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-all duration-300 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <option value="">All Projects</option>
              {projects &&
                Array.isArray(projects) &&
                projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
            </motion.select>
          </div>

          <div>
            <label
              htmlFor="assignedTo"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Assigned To
            </label>
            <motion.select
              id="assignedTo"
              name="assignedTo"
              value={filters.assignedTo}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-300 transition-all duration-300 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <option value="">All Team Members</option>
              {uniqueMembers.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </motion.select>
          </div>
        </div>
      </motion.div>

      {/* Task List */}
      <AnimatePresence mode="wait">
        {visibleTasks.length === 0 ? (
          <motion.div
            key="no-tasks"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow p-8 text-center border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              No tasks found
            </h2>
            <p className="text-gray-500 mb-6">
              {tasks.length === 0
                ? "Get started by creating your first task."
                : "Try changing your filters or create a new task."}
            </p>
            {/* {role !== "staff" && (
              <motion.button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-[#1c6ead] text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-2">
                  <PlusCircleIcon className="h-5 w-5" />
                  <span>Create Task</span>
                </div>
              </motion.button>
            )} */}
          </motion.div>
        ) : (
          <motion.div
            key="task-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Task Name
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {visibleTasks.map((task, index) => (
                      <motion.tr
                        key={task._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link to={`/tasks/${task._id}`} className="text-gray-500 hover:text-blue-600">
                            {task.title.charAt(0).toUpperCase() + task.title.slice(1)}
                          </Link>
                          {task.title === 'Project Verification Task' && (
                            <div className="mt-1">
                              {/* <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                Verification Task
                              </span> */}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          <motion.span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${statusColors[task.status]}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {task.status}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          <motion.span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${priorityColors[task.priority]}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {task.priority}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.project?.name || "No Project"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {capitalizeText(task.assignedTo?.name || "Unassigned")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {task.amount !== undefined ? `₹${task.amount}` : "-"}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {/* {tasks.length > 0 && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="px-6 py-4 border-t border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <motion.button
              onClick={() => handlePageChanges(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "text-indigo-600 hover:text-indigo-900 border border-indigo-200 hover:bg-indigo-50 cursor-pointer"
              } transition-all duration-300`}
              whileHover={{ scale: currentPage === 1 ? 1 : 1.02 }}
              whileTap={{ scale: currentPage === 1 ? 1 : 0.98 }}
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Previous
            </motion.button>
            <motion.button
              onClick={() => handlePageChanges(currentPage + 1)}
              disabled={currentPage === totalPage}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === totalPage
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "text-indigo-600 hover:text-indigo-900 border border-indigo-200 hover:bg-indigo-50 cursor-pointer"
              } transition-all duration-300`}
              whileHover={{ scale: currentPage === totalPage ? 1 : 1.02 }}
              whileTap={{ scale: currentPage === totalPage ? 1 : 0.98 }}
            >
              Next
              <ChevronRightIcon className="h-5 w-5 ml-1" />
            </motion.button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
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
                      : "bg-white text-gray-500 hover:bg-indigo-50 border-indigo-200 cursor-pointer"
                  } transition-all duration-300`}
                  whileHover={{ scale: currentPage === 1 ? 1 : 1.02 }}
                  whileTap={{ scale: currentPage === 1 ? 1 : 0.98 }}
                >
                  <span className="sr-only">First</span>
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
                </motion.button>
                {pages.map((page) => (
                  <motion.button
                    key={page}
                    onClick={() => handlePageChanges(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                        : "bg-white border-indigo-200 text-gray-500 hover:bg-indigo-50 cursor-pointer"
                    } transition-all duration-300`}
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
                      : "bg-white text-gray-500 hover:bg-indigo-50 border-indigo-200 cursor-pointer"
                  } transition-all duration-300`}
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
      </motion.div>
       )} */}

      {tasks.length > 0 && (
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
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-[#1c6ead] hover:bg-indigo-50 border-gray-200"
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
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                      ? "z-10 bg-indigo-50 border-[#1c6ead] text-[#1c6ead]"
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
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${currentPage === totalPage
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-[#1c6ead] hover:bg-indigo-50 border-gray-200"
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
      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CreateTaskModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onTaskCreated={handleTaskCreated}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset Wizard */}
      {isWizardOpen && (
        <PresetTaskCompletionWizard
          tasks={wizardTasks}
          onClose={() => {
            setIsWizardOpen(false);
            setReload(!reload);
          }}
        />
      )}
    </motion.div>
  );
};

export default Tasks;