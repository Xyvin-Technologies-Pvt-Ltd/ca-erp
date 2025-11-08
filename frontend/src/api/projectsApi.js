import api from './axios';

export const projectsApi = {
    // Project operations
    getAllProjects: async (params) => {
        try {
            const response = await api.get('/projects', { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching all projects:", error);
            throw error;
        }
    },

    getProjectById: async (id) => {
        try {
            const response = await api.get(`/projects/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching project by ID (${id}):`, error);
            throw error;
        }
    },

    createProject: async (formData) => {
        try {
            const response = await api.post("/projects", formData, {
                headers: {
                    
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error creating project:", error);
            throw error;
        }
    },

    // Update project status
    updateProject: async (projectId, formData) => {
        try {
            const response = await api.put(`/projects/${projectId}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error updating project:", error);
            throw error;
        }
    },

    deleteProject: async (id) => {
        try {
            const response = await api.delete(`/projects/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting project ID (${id}):`, error);
            throw error;
        }
    },

    // Task operations
    getAllTasks: async (params) => {
        try {
            const response = await api.get('/tasks', { params });
            return response.data;
        } catch (error) {
            console.error("Error fetching all tasks:", error);
            throw error;
        }
    },

    getTaskById: async (id) => {
        try {
            const response = await api.get(`/tasks/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching task by ID (${id}):`, error);
            throw error;
        }
    },

    updateTask: async (id, taskData) => {
        try {
            const response = await api.put(`/tasks/${id}`, taskData);
            return response.data;
        } catch (error) {
            console.error(`Error updating task ID (${id}):`, error);
            throw error;
        }
    },

    deleteTask: async (id) => {
        try {
            const response = await api.delete(`/tasks/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting task ID (${id}):`, error);
            throw error;
        }
    },

    // Project tasks operations
    getProjectTasks: async (projectId, params) => {
        try {
            const response = await api.get(`/projects/${projectId}/tasks`, { params });
            return response.data;
        } catch (error) {
            console.error(`Error fetching tasks for project ID (${projectId}):`, error);
            throw error;
        }
    },

    // Task status update
    updateTaskStatus: async (id, status) => {
        try {
            const response = await api.patch(`/tasks/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error(`Error updating task status for ID (${id}):`, error);
            throw error;
        }
    },

    // Task assignment
    assignTask: async (taskId, userId) => {
        try {
            const response = await api.post(`/tasks/${taskId}/assign`, { userId });
            return response.data;
        } catch (error) {
            console.error(`Error assigning task ID (${taskId}) to user ID (${userId}):`, error);
            throw error;
        }
    },

    // Task approval
    approveTask: async (taskId, approvalData) => {
        try {
            const response = await api.post(`/tasks/${taskId}/approve`, approvalData);
            return response.data;
        } catch (error) {
            console.error(`Error approving task ID (${taskId}):`, error);
            throw error;
        }
    },
};
