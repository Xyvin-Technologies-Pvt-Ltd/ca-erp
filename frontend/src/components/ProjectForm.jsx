import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { projectsApi } from "../api";
import { clientsApi } from "../api/clientsApi";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  DocumentTextIcon,
  UserIcon,
  FlagIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const ProjectForm = ({ project = null, onSuccess, onCancel }) => {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!project;
  const { user, role } = useAuth();

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

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

      setLoading(false);
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

  return (
    <motion.div
      className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center">
        <DocumentTextIcon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 mr-2" />
        {isEditMode ? "Edit Project" : "Create New Project"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
              Project Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              {...register("name", { required: "Project name is required" })}
              className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300"
              placeholder="Enter project name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </motion.div>

          <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <UserIcon className="h-5 w-5 text-indigo-600 mr-2" />
              Client <span className="text-red-600">*</span>
            </label>
            <select
              {...register("client.id", { required: "Client is required" })}
              className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client._id} value={String(client._id)}>
                  {client.name}
                </option>
              ))}
            </select>
            {errors.client?.id && (
              <p className="mt-1 text-sm text-red-600">{errors.client.id.message}</p>
            )}
          </motion.div>

          <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <FlagIcon className="h-5 w-5 text-indigo-600 mr-2" />
              Status
            </label>
            <select
              {...register("status")}
              className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </motion.div>

          <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <FlagIcon className="h-5 w-5 text-indigo-600 mr-2" />
              Priority
            </label>
            <select
              {...register("priority")}
              className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </motion.div>

          <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <CalendarIcon className="h-5 w-5 text-indigo-600 mr-2" />
              Start Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              {...register("startDate", { required: "Start date is required" })}
              min={isEditMode ? undefined : today}
              className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300"
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </motion.div>

          <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <CalendarIcon className="h-5 w-5 text-indigo-600 mr-2" />
              Due Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              {...register("dueDate", { required: "Due date is required" })}
              min={isEditMode ? undefined : today}
              className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300"
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
            )}
          </motion.div>

          {/* <motion.div className="relative md:col-span-2" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <CurrencyDollarIcon className="h-5 w-5 text-indigo-600 mr-2" />
              Budget
            </label>
            <input
              type="number"
              {...register("budget")}
              className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300"
              placeholder="Enter budget (optional)"
            />
          </motion.div> */}
        </div>

        <motion.div className="relative" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
            <InformationCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            {...register("description", { required: "Description is required" })}
            rows="4"
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm hover:shadow-md transition-all duration-300"
            placeholder="Enter project description"
          ></textarea>
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </motion.div>

        <div className="flex justify-end space-x-3">
          <motion.button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 border border-indigo-300 rounded-lg text-gray-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all duration-300 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
          <motion.button
            type="submit"
            disabled={loading}
            className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading
              ? "Saving..."
              : isEditMode
                ? "Update Project"
                : "Create Project"}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default ProjectForm;