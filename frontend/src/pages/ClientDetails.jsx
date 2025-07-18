import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { clientsApi } from "../api/clientsApi";
import { projectsApi } from "../api/projectsApi";
import { getActivityHistory } from "../api/activity";
import { cronJobsApi } from "../api/cronJobs";
import { toast } from "react-toastify";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import CronJobSection from "../components/CronJobSection";
import CronJobList from "../components/CronJobList";
import { sectionsApi } from '../api/sections';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Cron job states
  const [cronJobs, setCronJobs] = useState([]);
  const [cronJobsLoading, setCronJobsLoading] = useState(false);
  const [cronJobsError, setCronJobsError] = useState(null);
  const [sections, setSections] = useState([]);
  const [newSection, setNewSection] = useState('');
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);

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

  const handleAddSection = async () => {
    if (!newSection.trim()) {
      toast.error('Please enter a section name');
      return;
    }
    try {
      await sectionsApi.createSection({ name: newSection, client: id });
      toast.success('Section created successfully');
      setNewSection('');
      setShowNewSectionForm(false);
      loadSections();
      loadCronJobs();
    } catch (error) {
      toast.error(error.message || 'Failed to create section');
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
                const res = await getActivityHistory("project", project.id || project._id);
                return (res.activities || []).map((log) => ({ ...log, _project: project }));
              } catch {
                return [];
              }
            })
          );
          // 3. Flatten and sort logs by timestamp descending
          const allLogs = logsArr.flat().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setAllProjectLogs(allLogs);
        } catch (err) {
          setAllProjectLogsError("Failed to load project logs for this client.");
        } finally {
          setAllProjectLogsLoading(false);
        }
      };
      fetchAllProjectLogs();
    }
  }, [tab, id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this client?")) {
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
      }
    }
  };

  // ProjectCard logic (inline, not imported)
 const ProjectCard = ({ project }) => {
    const getDaysRemaining = () => {
      if (!project.dueDate) {
        return { text: "No due date", className: "text-gray-500" };
      }
      const today = new Date();
      const dueDate = new Date(project.dueDate);
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return { text: `${Math.abs(diffDays)} days overdue`, className: "text-red-600" };
      } else if (diffDays === 0) {
        return { text: "Due today", className: "text-yellow-600" };
      } else {
        return { text: `${diffDays} days remaining`, className: "text-green-600" };
      }
    };
    const daysRemaining = getDaysRemaining();
    return (
      <Link
        to={`/projects/${project.id || project._id}`}
        className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 h-full"
      >
        <div className="p-5 h-full flex flex-col">
          {/* Header Section - Fixed Height */}
          <div className="h-16 flex justify-between items-start mb-3">
            <h3 className="text-lg font-medium text-gray-900 flex-1 pr-3 line-clamp-2 overflow-hidden">{project.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
              project.status?.toLowerCase() === "completed"
                ? "bg-green-100 text-green-800"
                : project.status?.toLowerCase() === "in progress"
                ? "bg-blue-100 text-blue-800"
                : project.status?.toLowerCase() === "on hold"
                ? "bg-yellow-100 text-yellow-800"
                : project.status?.toLowerCase() === "cancelled"
                ? "bg-red-100 text-red-800"
                : project.status?.toLowerCase() === "planning"
                ? "bg-purple-100 text-purple-800"
                : "bg-gray-100 text-gray-800"
            }`}>{project.status}</span>
          </div>
          
          {/* Client Section - Fixed Height */}
          <div className="h-8 ">
            <p className="text-sm text-gray-600 truncate">
              {project.client ? project.client.name : "No client assigned"}
            </p>
          </div>
          
          {/* Progress Section - Fixed Height */}
          <div className="h-16">
            <div className="flex justify-between items-center ">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-gray-700">
                {project.completionPercentage || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#1c6ead] h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.completionPercentage || 0}%` }}
              ></div>
            </div>
          </div>
          
          {/* Dates Section - Fixed Height */}
          <div className="h-20 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Start Date</p>
                <p className="font-medium h-5 truncate">
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : "No start date"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Due Date</p>
                <div className="h-5 flex items-center">
                  <p className="font-medium truncate">
                    {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "No due date"}
                  </p>
                </div>
                <div className="mt-1 h-3">
                  <span className={`text-xs ${daysRemaining.className}`}>{daysRemaining.text}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Section - Fixed Height */}
          <div className="mt-auto pt-4 border-t border-gray-100 h-16">
            <div className="flex justify-between items-center h-full">
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.priority?.toLowerCase() === "high"
                    ? "bg-red-100 text-red-800"
                    : project.priority?.toLowerCase() === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : project.priority?.toLowerCase() === "low"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>{project.priority}</span>
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
                          className="w-full h-full rounded-full object-cover"
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

  // Logs timeline logic (inline, not imported)
  const paginatedActivities = activities.slice((logsPage - 1) * logsPerPage, logsPage * logsPerPage);
  const totalLogsPages = Math.ceil(activities.length / logsPerPage);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
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
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Link
              to="/clients"
              className="inline-flex items-center text-[#1c6ead] hover:text-blue-800 transition-colors duration-200 group"
            >
              <svg className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Clients
            </Link>
            <div className="flex items-center space-x-4">
              <div className="bg-[#1c6ead] text-white p-3 rounded-lg shadow-sm">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                <p className="text-gray-600 mt-1">Client Details</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/clients/${id}/edit`}
              className="inline-flex items-center px-5 py-2.5 bg-[#1c6ead] to- text-white rounded-lg  transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Client
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-5 py-2.5 bg-red-500  text-white rounded-lg  transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Client
            </button>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-10 flex justify-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
          <TabsTrigger value="info" className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200 border-2 ${tab === 'info' ? 'bg-white text-blue-700 border-[#1c6ead] shadow-lg' : 'bg-blue-100 text-[#1c6ead] border-transparent hover:bg-blue-200'} mx-1`}>Client Info</TabsTrigger>
          <TabsTrigger value="logs" className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200 border-2 ${tab === 'logs' ? 'bg-white text-blue-700 border-[#1c6ead] shadow-lg' : 'bg-blue-100 text-[#1c6ead] border-transparent hover:bg-blue-200'} mx-1`}>Master Data</TabsTrigger>
          <TabsTrigger value="annual" className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200 border-2 ${tab === 'annual' ? 'bg-white text-blue-700 border-[#1c6ead] shadow-lg' : 'bg-blue-100 text-[#1c6ead] border-transparent hover:bg-blue-200'} mx-1`}>Annual & Monthly</TabsTrigger>
          <TabsTrigger value="projects" className={`px-8 py-3 rounded-xl font-semibold text-base transition-all duration-200 border-2 ${tab === 'projects' ? 'bg-white text-blue-700 border-[#1c6ead] shadow-lg' : 'bg-blue-100 text-[#1c6ead] border-transparent hover:bg-blue-200'} mx-1`}>Projects</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          {/* Client Details */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg className="h-5 w-5 mr-2 text-[#1c6ead]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                      <svg className="h-5 w-5 text-[#1c6ead]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Contact Details</h3>
                  </div>
                  <div className="space-y-5">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">Contact Person</p>
                      <p className="text-gray-900 font-medium">{client.contactName || "N/A"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">Email</p>
                      <p className="text-gray-900 font-medium">{client.contactEmail}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">Phone</p>
                      <p className="text-gray-900 font-medium">{client.contactPhone || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Business Details</h3>
                  </div>
                  <div className="space-y-5">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">Industry</p>
                      <p className="text-gray-900 font-medium">{client.industry || "N/A"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">Status</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        client.status === 'Active' ? 'bg-green-100 text-green-800' :
                        client.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-500 mb-2">Website</p>
                      <div className="text-gray-900 font-medium">
                        {client.website ? (
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[#1c6ead] hover:text-blue-800 transition-colors duration-200"
                          >
                            {client.website}
                            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Tax Information</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">GSTIN</p>
                    <p className="text-gray-900 font-medium">{client.gstin || "N/A"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">PAN</p>
                    <p className="text-gray-900 font-medium">{client.pan || "N/A"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">CIN</p>
                    <p className="text-gray-900 font-medium">{client.cin || "N/A"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">Currency Format</p>
                    <p className="text-gray-900 font-medium">{client.currencyFormat || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">Created At</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(client.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-500 mb-2">Address</p>
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
                    <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
                    <p className="text-gray-900 font-medium whitespace-pre-wrap">{client.notes || "N/A"}</p>
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{allProjectLogsError}</div>
          ) : allProjectLogs.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Activity Yet</h3>
              <p className="text-gray-500">No logs found for any projects of this client.</p>
            </div>
          ) : (
            <div>
              <div className="flow-root">
                <ul className="-mb-8">
                  {allProjectLogs.slice((allProjectLogsPage-1)*allProjectLogsPerPage, allProjectLogsPage*allProjectLogsPerPage).map((activity, activityIdx) => (
                    <li key={activity.id || activity._id}>
                      <div className="relative pb-8">
                        {activityIdx !== allProjectLogs.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                              <p className="text-sm text-gray-500">{activity.description}</p>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-gray-500">by {activity.user?.name || 'Unknown User'}</span>
                                {activity._project && (
                                  <span className="ml-2 text-xs text-[#1c6ead]">[{activity._project.name}]</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={activity.timestamp} title={formatFullDate(activity.timestamp)}>
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
                    onClick={() => setAllProjectLogsPage((p) => Math.max(p - 1, 1))}
                    disabled={allProjectLogsPage === 1}
                    className={`flex items-center text-sm font-medium p-2 ${allProjectLogsPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-[#1c6ead] hover:text-blue-800"}`}
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {allProjectLogsPage} of {Math.ceil(allProjectLogs.length / allProjectLogsPerPage)}</span>
                  <button
                    onClick={() => setAllProjectLogsPage((p) => Math.min(p + 1, Math.ceil(allProjectLogs.length / allProjectLogsPerPage)))}
                    disabled={allProjectLogsPage === Math.ceil(allProjectLogs.length / allProjectLogsPerPage)}
                    className={`flex items-center text-sm font-medium p-2 ${allProjectLogsPage === Math.ceil(allProjectLogs.length / allProjectLogsPerPage) ? "text-gray-400 cursor-not-allowed" : "text-[#1c6ead] hover:text-blue-800"}`}
                  >
                    Next
                    <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="annual">
          <div className="bg-white rounded-xl p-8 shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Annual & Monthly Cron Jobs</h2>
              <button
                onClick={() => setShowNewSectionForm(!showNewSectionForm)}
                className="inline-flex items-center px-4 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Section
              </button>
            </div>

            {showNewSectionForm && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    placeholder="Enter section name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                  />
                  <button
                    onClick={handleAddSection}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    Create Section
                  </button>
                  <button
                    onClick={() => {
                      setShowNewSectionForm(false);
                      setNewSection('');
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {cronJobsLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1c6ead]"></div>
              </div>
            ) : cronJobsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{cronJobsError}</div>
            ) : (
              <div className="space-y-6">
                {/* Sections */}
                {sections.map((section) => (
                  <CronJobSection
                    key={section._id}
                    section={section}
                    clientId={id}
                    onUpdate={() => {
                      loadCronJobs();
                      loadSections();
                    }}
                  />
                ))}

                {/* Existing Cron Jobs */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Cron Jobs</h3>
                  <CronJobList
                    cronJobs={cronJobs.filter(job => job.isActive && job.section)}
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{projectsError}</div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {projects.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">No projects found for this client.</div>
              ) : (
                projects.map((project) => <ProjectCard key={project.id || project._id} project={project} />)
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetails;