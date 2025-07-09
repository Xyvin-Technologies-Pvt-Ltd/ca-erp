import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { projectsApi } from "../api";
import { clientsApi } from "../api/clientsApi";
import { useAuth } from "../context/AuthContext";
import {
  DocumentTextIcon,
  UserIcon,
  FlagIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const ProjectForm = ({ project = null, onSuccess, onCancel }) => {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!project;
  const { user, role } = useAuth();
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      name: "",
      client: { id: "" },
      description: "",
      status: "planning",
      priority: "medium",
      startDate: "",
      dueDate: "",
      budget: "",
    },
  });

  const startDate = watch("startDate");
  const dueDate = watch("dueDate");
  const projectName = watch("name");

  useEffect(() => {
    const loadClientsAndProjects = async () => {
      try {
        const [clientsResponse, projectsResponse] = await Promise.all([
          clientsApi.getAllClients(),
          projectsApi.getAllProjects({ limit: 1000 }),
        ]);
        setClients(clientsResponse.data);
        setProjects(projectsResponse.data || []);
      } catch (error) {
        console.error("Error loading clients or projects:", error);
      }
    };

    loadClientsAndProjects();
  }, []);

  useEffect(() => {
    if (project && clients.length > 0) {
      const formattedProject = {
        ...project,
        startDate: project.startDate
          ? new Date(project.startDate).toISOString().split("T")[0]
          : "",
        dueDate: project.dueDate
          ? new Date(project.dueDate).toISOString().split("T")[0]
          : "",
        client: {
          id: String(project.client?._id || project.client?.id || ""),
          name: project.client?.name || "",
        },
        priority: project.priority?.toLowerCase() || "medium",
      };
      reset(formattedProject);
    }
  }, [project, clients, reset]);

  const onSubmit = async (data) => {
    if (data.startDate && data.dueDate && new Date(data.dueDate) < new Date(data.startDate)) {
      setError("dueDate", {
        type: "manual",
        message: "Due date cannot be earlier than start date",
      });
      return;
    } else {
      clearErrors("dueDate");
    }

    const isDuplicateName = projects.some(
      (p) => p.name.toLowerCase() === data.name.toLowerCase() && (!isEditMode || p._id !== project?._id)
    );
    if (isDuplicateName) {
      setError("name", {
        type: "manual",
        message: "Project name already exists",
      });
      return;
    } else {
      clearErrors("name");
    }

    setLoading(true);
    try {
      const projectData = {
        client: data.client.id,
        status: data.status ? data.status.toLowerCase() : "planning",
        budget: data.budget ? Number(data.budget) : undefined,
        priority: data.priority ? data.priority.toLowerCase() : "medium",
        description: data.description || "No description provided",
        name: data.name,
        startDate: data.startDate,
        dueDate: data.dueDate,
      };

      if (!["planning", "in-progress", "completed", "archived"].includes(projectData.status)) {
        console.error(`Invalid status: ${projectData.status}`);
        return;
      }

      let result;
      if (isEditMode && project?.id) {
        result = await projectsApi.updateProject(project.id, projectData);
      } else {
        result = await projectsApi.createProject(projectData);
      }

      setLoading(true);
      reset();
      if (onSuccess) onSuccess(result.data);
    } catch (error) {
      console.error("Error saving project:", error.response ? error.response.data : error);
      if (error.response?.data?.message?.includes("name already exists")) {
        setError("name", {
          type: "manual",
          message: "Project name already exists",
        });
      }
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm("Are you sure you want to discard changes?");
      if (!confirmDiscard) {
        return;
      }
    }
    onCancel();
  };

  const openDatePicker = (dateInputRef) => {
    if (dateInputRef.current) {
      dateInputRef.current.focus();
      dateInputRef.current.click();
      dateInputRef.current.showPicker?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 text-white p-3 rounded-lg shadow-sm">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Project' : 'Create New Project'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isEditMode ? 'Update project details below' : 'Fill in the details to create a new project'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleCancel} 
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
            {/* Project Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("name", { required: "Project name is required" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    placeholder="Enter project name"
                  />
                  {errors.name && (
                    <div className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="text-red-500 mr-1">⚠</span>
                      {errors.name.message}
                    </div>
                  )}
                </div>

                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("client.id", { required: "Client is required" })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={String(client._id)}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {errors.client?.id && (
                    <div className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="text-red-500 mr-1">⚠</span>
                      {errors.client.id.message}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("status")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("priority")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={startDateRef}
                      type="date"
                      onClick={() => openDatePicker(startDateRef)}
                      {...register("startDate", { required: "Start date is required" })}
                      className="w-full px-4 py-3 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
                    />
                    {/* <button
                      type="button"
                      onClick={() => openDatePicker(startDateRef)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                    >
                      <CalendarIcon className="h-5 w-5" />
                    </button> */}
                  </div>
                  {errors.startDate && (
                    <div className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="math-red-500 mr-1">⚠</span>
                      {errors.startDate.message}
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={endDateRef}
                      type="date"
                      onClick={() => openDatePicker(endDateRef)}
                      {...register("dueDate", { required: "Due date is required" })}
                      className="w-full px-4 py-3 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 cursor-pointer"
                    />
                    {/* <button
                      type="button"
                      onClick={() => openDatePicker(endDateRef)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200"
                    >
                      <CalendarIcon className="h-5 w-5" />
                    </button> */}
                  </div>
                  {errors.dueDate && (
                    <div className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="text-red-500 mr-1">⚠</span>
                      {errors.dueDate.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("description", { required: "Description is required" })}
                  rows="4"
                  maxLength={500}
                  placeholder="Enter project description..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                ></textarea>
                <div className="flex justify-end items-center mt-2">
                  <p className={`text-sm ${watch("description")?.length > 400 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {watch("description")?.length || 0}/500
                  </p>
                </div>
                {errors.description && (
                  <div className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="text-red-500 mr-1">⚠</span>
                    {errors.description.message}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:from-blue-300 disabled:to-indigo-400 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none font-medium"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditMode ? 'M5 13l4 4L19 7' : 'M12 4v16m8-8H4'} />
                    </svg>
                    {isEditMode ? 'Update Project' : 'Create Project'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;