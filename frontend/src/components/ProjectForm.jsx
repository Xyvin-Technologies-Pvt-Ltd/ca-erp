import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { projectsApi } from "../api";
import { clientsApi } from "../api/clientsApi";
import { useAuth } from "../context/AuthContext";

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
          projectsApi.getAllProjects({ limit: 1000 })
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
      (p) => p.name.toLowerCase() === data.name.toLowerCase() && 
             (!isEditMode || p._id !== project?._id)
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6">
        {isEditMode ? "Edit Project" : "Create New Project"}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              {...register("name", { required: "Project name is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client <span className="text-red-600">*</span>
            </label>
            <select
              {...register("client.id", { required: "Client is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register("status")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              {...register("priority")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              {...register("startDate", { required: "Start date is required" })}
              min={isEditMode ? undefined : today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              {...register("dueDate", { required: "Due date is required" })}
              min={isEditMode ? undefined : today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            {...register("description", { required: "Description is required" })}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading
              ? "Saving..."
              : isEditMode
                ? "Update Project"
                : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;