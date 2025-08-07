import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { clientsApi } from "../api/clientsApi";
import { projectsApi } from "../api/projectsApi";
import { getActivityHistory } from "../api/activity";
import { cronJobsApi } from "../api/cronJobs";
import { toast } from "react-toastify";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import CronJobSection from "../components/CronJobSection";
import CronJobList from "../components/CronJobList";
import { sectionsApi } from "../api/sections";
import useHeaderStore from "../stores/useHeaderStore";
import { TrashIcon } from "@heroicons/react/20/solid"; // Assuming TrashIcon is from @heroicons/react

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [edit, setEdit] = useState(false);
  const [tab, setTab] = useState("info");
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  // For logs
  const [activities, setActivities] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [logsPage, setLogsPage] = useState(1);
  const logsPerPage = 10;
  const [allProjectLogs, setAllProjectLogs] = useState([]);
  const [allProjectLogsLoading, setAllProjectLogsLoading] = useState(false);
  const [allProjectLogsError, setAllProjectLogsError] = useState(null);
  const [allProjectLogsPage, setAllProjectLogsPage] = useState(1);
  const allProjectLogsPerPage = 10;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Added state for delete modal
  // Cron job states
  const [cronJobs, setCronJobs] = useState([]);
  const [cronJobsLoading, setCronJobsLoading] = useState(false);
  const [cronJobsError, setCronJobsError] = useState(null);
  const [sections, setSections] = useState([]);
  const [newSection, setNewSection] = useState("");
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [editedSection, setEditedSection] = useState({
    name: "",
    _id: "",
  });
  const { profileIsActive, profileDropdown } = useHeaderStore();
  const checkHeader = () => {
    if (profileDropdown === true) {
      profileIsActive(false);
    }
  };
  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        const response = await clientsApi.getClientById(id);
        if (response.success) {
          setClient(response.data);
        } else {
          throw new Error(response.error || "Failed to fetch client details");
        }
      } catch (err) {
        console.error("Error loading client:", err);
        setError(err.message || "Failed to load client details");
        toast.error(err.message || "Failed to load client details");
      } finally {
        setLoading(false);
      }
    };
    loadClient();
  }, [id]);

  useEffect(() => {
    if (tab === "projects") {
      const loadProjects = async () => {
        try {
          setProjectsLoading(true);
          setProjectsError(null);
          const response = await projectsApi.getAllProjects({ client: id });
          setProjects(response.data || []);
        } catch (err) {
          setProjectsError("Failed to load projects for this client.");
        } finally {
          setProjectsLoading(false);
        }
      };
      loadProjects();
    }
  }, [tab, id]);

  useEffect(() => {
    if (tab === "annual") {
      loadCronJobs();
      loadSections();
    }
  }, [tab, id]);

  const loadCronJobs = async () => {
    try {
      setCronJobsLoading(true);
      setCronJobsError(null);
      const response = await cronJobsApi.getCronJobs({ client: id });
      setCronJobs(response.data || []);
    } catch (err) {
      setCronJobsError("Failed to load cron jobs for this client.");
    } finally {
      setCronJobsLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const response = await sectionsApi.getSectionsByClient(id);
      setSections(response.data || []);
    } catch (err) {
      console.error("Failed to load sections:", err);
    }
  };
  const handleSectionEdit = (status, name, key) => {
    console.log(name, key);
    setEditedSection((prev) => ({
      ...prev,
      name: name,
      _id: key,
    }));
    setEdit(true);
  };
  const handleSectionDelete = async (id) => {
    const response = await sectionsApi.deleteSection(id);
    console.log(response);

    if (response.success === true) {
      loadSections();
    }
  };
  const handleEditedSectionChange = (e) => {
    const { name, value } = e.target;
    setEditedSection((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleEditedSectionUpdate = async (e) => {
    try {
      e.preventDefault();
      const response = await sectionsApi.editSection(editedSection);
      if (response.success === true) {
        setEdit(false);
        loadSections();
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleAddSection = async () => {
    if (!newSection.trim()) {
      toast.error("Please enter a section name");
      return;
    }
    try {
      await sectionsApi.createSection({ name: newSection, client: id });
      toast.success("Section created successfully");
      setNewSection("");
      setShowNewSectionForm(false);
      loadSections();
      loadCronJobs();
    } catch (error) {
      toast.error(error.message || "Failed to create section");
    }
  };

  useEffect(() => {
    if (tab === "logs") {
      const fetchAllProjectLogs = async () => {
        setAllProjectLogsLoading(true);
        setAllProjectLogsError(null);
        try {
          // 1. Fetch all projects for this client
          const projectsRes = await projectsApi.getAllProjects({ client: id });
          const projects = projectsRes.data || [];
          // 2. Fetch logs for each project
          const logsArr = await Promise.all(
            projects.map(async (project) => {
              try {
                const res = await getActivityHistory(
                  "project",
                  project.id || project._id
                );
                return (res.activities || []).map((log) => ({
                  ...log,
                  _project: project,
                }));
              } catch {
                return [];
              }
            })
          );
          // 3. Flatten and sort logs by timestamp descending
          const allLogs = logsArr
            .flat()
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAllProjectLogs(allLogs);
        } catch (err) {
          setAllProjectLogsError(
            "Failed to load project logs for this client."
          );
        } finally {
          setAllProjectLogsLoading(false);
        }
      };
      fetchAllProjectLogs();
    }
  }, [tab, id]);

  const handleDelete = () => {
    setIsDeleteModalOpen(true); 
  };

  const confirmDelete = async () => {
    try {
      const response = await clientsApi.deleteClient(id);
      if (response.success) {
        toast.success("Client deleted successfully");
        navigate("/clients");
      } else {
        throw new Error(response.error || "Failed to delete client");
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete client");
    } finally {
      setIsDeleteModalOpen(false); // Close the modal
    }
  };

  // ProjectCard logic (inline, not imported)
  const ProjectCard = ({ project }) => {
    // Calculate progress percentage
    const progress =
      project.totalTasks && project.totalTasks > 0
        ? Math.round(((project.completedTasks || 0) / project.totalTasks) * 100)
        : 0;

    // Status and priority color mappings (copied from Projects.jsx)
    const statusColors = {
      completed: "bg-green-100 text-green-700 border-green-200",
      "in progress": "bg-blue-100 text-[#1c6ead] border-blue-200",
      planning: "bg-purple-100 text-purple-700 border-purple-200",
      "on hold": "bg-yellow-100 text-yellow-700 border-yellow-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    const priorityColors = {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-orange-100 text-orange-700 border-orange-200",
      low: "bg-green-100 text-green-700 border-green-200",
    };

    // Days remaining logic (from original ProjectCard)
    const getDaysRemaining = () => {
      if (!project.dueDate) {
        return { text: "No due date", className: "text-gray-500" };
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
        return { text: "Due today", className: "text-yellow-600" };
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
        to={`/projects/${project.id || project._id}`}
        className="block bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col w-full h-80"
      >
        <div className="px-6 py-5 border-b border-gray-200 h-33 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col flex-1">
              <h2 className="text-lg font-medium text-gray-900 line-clamp-2">
                {project.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Client: {project.client?.name || "No client assigned"}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[project.status?.toLowerCase()] || "bg-gray-100"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full mr-1 ${
                  (
                    statusColors[project.status?.toLowerCase()] || "bg-gray-100"
                  ).split(" ")[0]
                }`}
              ></span>
              {project.status}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4 h-45 flex flex-col">
          <div className="flex items-center justify-between h-15">
            <div>
              <p className="text-sm text-gray-500 flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
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
            <div className="ml-4 flex-shrink-0">
              <span className={`text-xs ${daysRemaining.className}`}>
                {daysRemaining.text}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-600">
                {progress}% Complete
              </span>
              <span className="text-xs font-medium text-gray-500">
                {project.completedTasks || 0} / {project.totalTasks || 0} Tasks
              </span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-[#1c6ead]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            {project.team && project.team.length > 0 ? (
              <div className="relative flex -space-x-2 group">
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
                <div className="absolute bottom-8 left-0 bg-[#1c6ead] text-white text-xs rounded-lg p-2 z-10 shadow-lg min-w-max opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                  {project.team.map((member, index) => (
                    <div key={member._id || member.id || index}>
                      {member.name || member.email || "Unknown Member"}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 flex items-center">
                <svg
                  className="h-4 w-4 mr-1 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75"
                  />
                </svg>
                No team members
              </div>
            )}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                priorityColors[project.priority?.toLowerCase()] || "bg-gray-100"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full mr-1 ${
                  (
                    priorityColors[project.priority?.toLowerCase()] ||
                    "bg-gray-100"
                  ).split(" ")[0]
                }`}
              ></span>
              {project.priority}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  // Logs timeline logic (inline, not imported)
  const paginatedActivities = activities.slice(
    (logsPage - 1) * logsPerPage,
    logsPage * logsPerPage
  );
  const totalLogsPages = Math.ceil(activities.length / logsPerPage);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return activityTime.toLocaleDateString();
  };
  const formatFullDate = (timestamp) => new Date(timestamp).toLocaleString();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1c6ead] border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Client</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <Link
            to="/clients"
            className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6  lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Link
              to="/clients"
              className="inline-flex items-center text-[#1c6ead] hover:text-blue-800 transition-colors duration-200 group"
            >
              <svg
                className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Clients
            </Link>
            <div className="flex items-center space-x-4">
              <div className="bg-[#1c6ead] text-white p-3 rounded-lg shadow-sm">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {client.name}
                </h1>
                <p className="text-gray-600 mt-1">Client Details</p>
              </div>
            </div>
          </div>
          <div className="flex mr-9 space-x-3">
            <Link
              to={`/clients/${id}/edit`}
              className="inline-flex items-center px-5 py-2.5 bg-[#1c6ead] to- text-white rounded-lg  transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Client
            </Link>
            <button
              onClick={handleDelete}
              className={
                profileDropdown === true
                  ? `opacity-10 inline-flex items-center px-5 py-2.5 bg-red-100  text-white rounded-lg  transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5`
                  : `inline-flex items-center px-5 py-2.5 bg-red-500  text-white rounded-lg  transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5`
              }
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Client
            </button>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-10 flex justify-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
          <TabsTrigger
            value="info"
            className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200 border-2 ${
              tab === "info"
                ? "bg-white text-blue-700 border-[#1c6ead] shadow-lg"
                : "bg-blue-100 text-[#1c6ead] border-transparent hover:bg-blue-200"
            } mx-1`}
          >
            Client Info
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200 border-2 ${
              tab === "logs"
                ? "bg-white text-blue-700 border-[#1c6ead] shadow-lg"
                : "bg-blue-100 text-[#1c6ead] border-transparent hover:bg-blue-200"
            } mx-1`}
          >
            Master Data
          </TabsTrigger>
          <TabsTrigger
            value="annual"
            className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200 border-2 ${
              tab === "annual"
                ? "bg-white text-blue-700 border-[#1c6ead] shadow-lg"
                : "bg-blue-100 text-[#1c6ead] border-transparent hover:bg-blue-200"
            } mx-1`}
          >
            Annual & Monthly
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200 border-2 ${
              tab === "projects"
                ? "bg-white text-blue-700 border-[#1c6ead] shadow-lg"
                : "bg-blue-100 text-[#1c6ead] border-transparent hover:bg-blue-200"
            } mx-1`}
          >
            Projects
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          {/* Client Details */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-[#1c6ead]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Client Information
              </h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Details */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <svg
                        className="h-5 w-5 text-[#1c6ead]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Contact Details
                    </h3>
                  </div>
                  <div className="space-y-5">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Contact Person
                      </p>
                      <p className="text-gray-900 font-medium">
                        {client.contactName || "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Email
                      </p>
                      <p className="text-gray-900 font-medium">
                        {client.contactEmail}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Phone
                      </p>
                      <p className="text-gray-900 font-medium">
                        {client.contactPhone || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Business Details
                    </h3>
                  </div>
                  <div className="space-y-5">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Industry
                      </p>
                      <p className="text-gray-900 font-medium">
                        {client.industry || "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Status
                      </p>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          client.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : client.status === "Inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Website
                      </p>
                      <div className="text-gray-900 font-medium">
                        {client.website ? (
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[#1c6ead] hover:text-blue-800 transition-colors duration-200"
                          >
                            {client.website}
                            <svg
                              className="h-4 w-4 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Tax Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      GSTIN
                    </p>
                    <p className="text-gray-900 font-medium">
                      {client.gstin || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      PAN
                    </p>
                    <p className="text-gray-900 font-medium">
                      {client.pan || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      CIN
                    </p>
                    <p className="text-gray-900 font-medium">
                      {client.cin || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Currency Format
                    </p>
                    <p className="text-gray-900 font-medium">
                      {client.currencyFormat || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <svg
                      className="h-5 w-5 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Additional Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Created At
                    </p>
                    <p className="text-gray-900 font-medium">
                      {new Date(client.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Address
                    </p>
                    <div className="text-gray-900 font-medium">
                      <div>Country: {client.country || "N/A"}</div>
                      <div>State: {client.state || "N/A"}</div>
                      <div>City: {client.city || "N/A"}</div>
                      <div>PIN: {client.pin || "N/A"}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Notes
                    </p>
                    <p className="text-gray-900 font-medium whitespace-pre-wrap">
                      {client.notes || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="logs">
          {allProjectLogsLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1c6ead]"></div>
            </div>
          ) : allProjectLogsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {allProjectLogsError}
            </div>
          ) : allProjectLogs.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Project Activity Yet
              </h3>
              <p className="text-gray-500">
                No logs found for any projects of this client.
              </p>
            </div>
          ) : (
            <div>
              <div className="flow-root">
                <ul className="-mb-8">
                  {allProjectLogs
                    .slice(
                      (allProjectLogsPage - 1) * allProjectLogsPerPage,
                      allProjectLogsPage * allProjectLogsPerPage
                    )
                    .map((activity, activityIdx) => (
                      <li key={activity.id || activity._id}>
                        <div className="relative pb-8">
                          {activityIdx !== allProjectLogs.length - 1 ? (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {activity.title}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {activity.description}
                                </p>
                                <div className="flex items-center mt-1">
                                  <span className="text-xs text-gray-500">
                                    by {activity.user?.name || "Unknown User"}
                                  </span>
                                  {activity._project && (
                                    <span className="ml-2 text-xs text-[#1c6ead]">
                                      [{activity._project.name}]
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time
                                  dateTime={activity.timestamp}
                                  title={formatFullDate(activity.timestamp)}
                                >
                                  {formatTimeAgo(activity.timestamp)}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
              {/* Pagination */}
              {Math.ceil(allProjectLogs.length / allProjectLogsPerPage) > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <button
                    onClick={() =>
                      setAllProjectLogsPage((p) => Math.max(p - 1, 1))
                    }
                    disabled={allProjectLogsPage === 1}
                    className={`flex items-center text-sm font-medium p-2 ${
                      allProjectLogsPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-[#1c6ead] hover:text-blue-800"
                    }`}
                  >
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {allProjectLogsPage} of{" "}
                    {Math.ceil(allProjectLogs.length / allProjectLogsPerPage)}
                  </span>
                  <button
                    onClick={() =>
                      setAllProjectLogsPage((p) =>
                        Math.min(
                          p + 1,
                          Math.ceil(
                            allProjectLogs.length / allProjectLogsPerPage
                          )
                        )
                      )
                    }
                    disabled={
                      allProjectLogsPage ===
                      Math.ceil(allProjectLogs.length / allProjectLogsPerPage)
                    }
                    className={`flex items-center text-sm font-medium p-2 ${
                      allProjectLogsPage ===
                      Math.ceil(allProjectLogs.length / allProjectLogsPerPage)
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-[#1c6ead] hover:text-blue-800"
                    }`}
                  >
                    Next
                    <svg
                      className="w-5 h-5 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="annual">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl p-8 shadow-xl border border-gray-100">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#1c6ead] rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-[#1c6ead] bg-clip-text text-transparent">
                    Annual & Monthly Auto Projects
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Automate your project creation with scheduled tasks
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewSectionForm(!showNewSectionForm)}
                className="inline-flex items-center px-6 py-3 bg-[#1c6ead] text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add New Section
              </button>
            </div>

            {showNewSectionForm && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 border border-blue-200 shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Section Name
                    </label>
                    <input
                      type="text"
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      placeholder="Enter a descriptive section name..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAddSection}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                    >
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Create Section
                    </button>
                    <button
                      onClick={() => {
                        setShowNewSectionForm(false);
                        setNewSection("");
                      }}
                      className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {cronJobsLoading ? (
              <div className="flex flex-col justify-center items-center min-h-[300px]">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <div
                    className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">
                  Loading cron jobs...
                </p>
              </div>
            ) : cronJobsError ? (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 text-red-700 shadow-lg">
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-semibold">{cronJobsError}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Sections */}
                {sections.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-2 h-8 bg-[#1c6ead] rounded-full"></div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Section Templates
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {sections.length} section
                        {sections.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {edit ? (
                        <form
                          onSubmit={handleEditedSectionUpdate}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
                        >
                          <input
                            type="text"
                            name="name"
                            value={editedSection.name}
                            onChange={handleEditedSectionChange}
                            placeholder="Name"
                            className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-lg"
                          />

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEdit(false)}
                              className="text-gray-600 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {sections.map((section) => (
                            <CronJobSection
                              id={section._id}
                              section={section}
                              clientId={id}
                              name={section.name}
                              handleSectionDelete={handleSectionDelete}
                              handleSectionEdit={handleSectionEdit}
                              onUpdate={() => {
                                loadCronJobs();
                                loadSections();
                              }}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Cron Jobs by Section */}
                <div className="mt-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-600 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Active Auto Projects
                    </h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {
                        cronJobs.filter((job) => job.isActive && job.section)
                          .length
                      }{" "}
                      job
                      {cronJobs.filter((job) => job.isActive && job.section)
                        .length !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>
                  <CronJobList
                    cronJobs={cronJobs.filter(
                      (job) => job.isActive && job.section
                    )}
                    sections={sections}
                    onUpdate={() => {
                      loadCronJobs();
                      loadSections();
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="projects">
          {projectsLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1c6ead]"></div>
            </div>
          ) : projectsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {projectsError}
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {projects.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">
                  No projects found for this client.
                </div>
              ) : (
                projects.map((project) => (
                  <ProjectCard
                    key={project.id || project._id}
                    project={project}
                  />
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in px-4">
          <div className="bg-white rounded-2xl p-6 max-w-full sm:max-w-lg w-full shadow-2xl transform transition-all duration-300 scale-95 animate-scale-in">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 6v10h6V6H7zm5 2a1 1 0 00-1 1v6a1 1 0 102 0V9a1 1 0 00-1-1zm-3 1a1 1 0 00-1 1v4a1 1 0 102 0V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Are you sure you want to delete this client? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all duration-300 transform hover:scale-105 flex items-center shadow-md text-sm sm:text-base"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetails;