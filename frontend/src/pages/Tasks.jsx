import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchTasks } from "../api/tasks";
import { fetchProjects } from "../api/projects";
import CreateTaskModal from "../components/CreateTaskModal";
import { FaGreaterThan } from "react-icons/fa";
import { FaLessThan } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-blue-100 text-blue-800",
  review: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
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
  const [currentPage, setCurrentPage] = useState(1);
  // const [totalPage, settotalPage] = useState(1);
  const [paginations, setPaginations] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const {role} = useAuth()


  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    project: "",
    assignedTo: "",
  });

  const [teamMembers, setTeamMembers] = useState([]);

  const loadTasksAndProjects = async () => {
    try {
      setLoading(true);
      const [tasksData, projectsData] = await Promise.all([
        fetchTasks({ ...filters, page: currentPage, limit: 10 }),
        fetchProjects(),
      ]);
  
      // Set tasks
      setTasks(Array.isArray(tasksData.tasks) ? tasksData.tasks : []);
      console.log("Tasks:", tasksData.tasks);
  
      // Set projects
      setProjects(Array.isArray(projectsData.data) ? projectsData.data : []);
  
      // Set team members
      setTeamMembers(
        Array.isArray(tasksData.tasks)
          ? tasksData.tasks.map((task) => task.assignedTo).filter(Boolean)
          : []
      );
  
      // Set pagination
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

  console.log(paginations,'page');
  
  

  useEffect(() => {
    loadTasksAndProjects();
  }, [filters, currentPage]);
  
  const handlePageChanges = (newPage) => {
    setCurrentPage(newPage);
  };
  

  const handleTaskCreated = (newTask) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      priority: "",
      project: "",
      assignedTo: "",
    });
  };

  // Apply filters to tasks
  // const filteredTasks = tasks.filter((task) => {
  //   if (filters.status && task.status !== filters.status) return false;
  //   if (filters.priority && task.priority !== filters.priority) return false;
  //   if (filters.project && task.project?.id !== filters.project) return false;
  //   if (filters.assignedTo && task.assignedTo?.id !== filters.assignedTo)
  //     return false;
  //   return true;
  // });
  const uniqueMembers = Array.from(
    new Map(
      tasks
        .filter((t) => t.assignedTo)
        .map((t) => [t.assignedTo._id, t.assignedTo])
    ).values()
  );
  const totalPage = Math.ceil(paginations.total / paginations.limit);
  const pages = Array.from({ length: totalPage }, (_, i) => i + 1);

  console.log('total',totalPage,pages,'page');


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white text-black">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadTasksAndProjects}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white text-black">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Tasks</h1>
          {role !== "staff" && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Task
        </button>
          )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 bg-white text-black">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-2 md:mb-0">
            Filters
          </h2>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white text-black">
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="project"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Project
            </label>
            <select
              id="project"
              name="project"
              value={filters.project}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Projects</option>
              {projects &&
                Array.isArray(projects) &&
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="assignedTo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Assigned To
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={filters.assignedTo}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Team Members</option>
              {uniqueMembers.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0  ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            No tasks found
          </h2>
          <p className="text-gray-500 mb-6">
            {tasks.length === 0
              ? "Get started by creating your first task."
              : "Try changing your filters or create a new task."}
          </p>
          { role != "staff" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Task
          </button>
          )}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Task Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Assigned To
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          statusColors[task.status]
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                          priorityColors[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.project?.name || "No Project"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.assignedTo?.name || "Unassigned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChanges(currentPage - 1)}

              disabled={currentPage=== 1}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                currentPage=== 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:text-blue-900 border border-gray-300"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChanges(currentPage + 1)}

              disabled={currentPage=== totalPage}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                currentPage=== totalPage
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:text-blue-900 border border-gray-300"
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage- 1) * paginations.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage* paginations.limit, paginations.total)}
                  </span>{" "}
                  of <span className="font-medium">{paginations.total}</span> results
                </p>
              </div>
              <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                    onClick={() => handlePageChanges(1)}
                  disabled={currentPage === 1}

                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                      currentPage=== 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                    }`}
                  >
                     <span className="sr-only">First</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {pages.map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChanges(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                   <button
                    onClick={() => handlePageChanges(currentPage+ 1)}
                    disabled={currentPage=== totalPage}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                      currentPage=== totalPage
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
              </nav>
              </div>


          </div>
        </div>
      </div>

      {/* Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
};

export default Tasks;