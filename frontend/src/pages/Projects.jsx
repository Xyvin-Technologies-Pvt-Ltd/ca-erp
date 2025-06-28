import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { projectsApi } from "../api/projectsApi";
import CreateProjectModal from "../components/CreateProjectModal";
import { fetchTasks } from "../api/tasks";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  completed: "bg-green-100 text-green-800",
  "in-progress": "bg-blue-100 text-blue-800",
  planning: "bg-purple-100 text-purple-800",
  "on-hold": "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};


const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-green-100 text-green-800",
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [paginations, setPaginations] = useState({
    page: 1,
    total: 0,
    limit: 9,
  });
    const { user,role } = useAuth();
  

  const location = useLocation();

  // Function to load all projects
  // Add these state variables at the top with other states
  const [totalPage, setTotalPage] = useState(0);
  const [pages, setPages] = useState([]);
  
  // Update the loadProjects function
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getAllProjects({
        page: currentPage,
        limit: paginations.limit
      });
      
      if (!data?.data || !Array.isArray(data.data)) {
        throw new Error('Invalid API response format');
      }

      // Sort projects by dueDate (ascending)
      const sortedProjects = data.data.sort((a, b) => 
        new Date(a.dueDate) - new Date(b.dueDate)
      );

      setProjects(sortedProjects);
      setPaginations({
        page: currentPage,
        total: data.total || 0,
        limit: 9
      });
  
      // Calculate total pages
      const totalPages = Math.ceil(data.total / paginations.limit);
      setTotalPage(totalPages);
  
      // Generate page numbers array
      const pageNumbers = [];
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      setPages(pageNumbers);
      
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
      projectsApi.getAllProjects(),
    ]);

    const taskList = Array.isArray(tasksData.tasks) ? tasksData.tasks : [];

    
    console.log("Tasks:", taskList);

      // Step 1: Extract unique project IDs from assigned tasks
      const taskProjectIds = new Set(taskList.map(task => task.project?._id).filter(Boolean));

      // Step 2: Filter projects using those IDs
      const allProjects = Array.isArray(projectsData.data) ? projectsData.data : [];

      // Step 3: Filter and sort projects by dueDate (ascending)
      const filteredProjects = allProjects
        .filter(project => taskProjectIds.has(project._id))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      // Set filtered and sorted projects
      setProjects(filteredProjects);

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

  const handlePageChanges = (newPage) => {
    setCurrentPage(newPage);
  };

  // Function to delete a project
  const deleteProject = async () => {
    try {
      // Delete the project via API
      await projectsApi.deleteProject(projectToDelete.id);

      // Re-fetch the projects to reflect the changes
      loadProjects();  // Refresh the list of projects after deletion

      // Set success message and reset the project to delete
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

  // Check for success message from redirect (e.g., after project deletion)
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);

      // Clear the message from location state
      window.history.replaceState({}, document.title);

      // Auto-dismiss the success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [location]);

  // Handle newly created project
  const handleProjectCreated = (newProject) => {
    setProjects((prevProjects) => [...prevProjects, newProject]);
    setSuccessMessage("Project created successfully");

    // Auto-dismiss the success message after 5 seconds
    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  };

  console.log(projects,"for leave projects");
  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadProjects}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success message notification */}
      {successMessage && (
        <div className="mb-6 bg-green-50 p-4 rounded-md flex justify-between items-center">
          <p className="text-green-700">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-green-700 hover:text-green-900 focus:outline-none"
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
          </button>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <div className="flex space-x-4">
          {role !== "staff" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Project
            </button>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            No projects found
          </h2>
          <p className="text-gray-500 mb-6">
            Get started by creating your first project.
          </p>
          {role != "staff" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project.id}`}
              className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="px-6 py-5 border-b">
                <div className="flex items-start justify-between gap-[3px]">
                  <div className="min-h-[84px]">
                    <h2 className="text-lg font-medium text-gray-900 line-clamp-2">
                      {project.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Client: {project.client?.name}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status] || "bg-gray-100"}`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Timeline</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(project.startDate).toLocaleDateString()} -{" "}
                    {new Date(project.dueDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-600">
                      {project.tasks && project.tasks.length > 0 
                        ? Math.round((project.completedTasks || 0) / project.tasks.length * 100)
                        : 0}% Complete
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      {project.completedTasks || 0} / {project.tasks ? project.tasks.length : 0} Tasks
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${project.tasks && project.tasks.length > 0 
                          ? Math.round((project.completedTasks || 0) / project.tasks.length * 100)
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {project.team && project.team.length > 0 ? (
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 3).map((member) => (
                        <div
                          key={member}
                          className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center"
                          title={member}
                        >
                          <span className="text-xs font-medium text-gray-600">
                            {/* {member.charAt(0)} */}
                             <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
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
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No team members</div>
                  )}

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[project.priority] || "bg-gray-100"}`}
                  >
                    {project.priority}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChanges(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:text-blue-900 border border-gray-300"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChanges(currentPage + 1)}
              disabled={currentPage === totalPage}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === totalPage
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
                <button
                  onClick={() => handlePageChanges(1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  <span className="sr-only">First</span>
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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
                  onClick={() => handlePageChanges(currentPage + 1)}
                  disabled={currentPage === totalPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                    currentPage === totalPage
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default Projects;