
import api from "./axios";

export const presetProjectsApi = {
  // Get all preset projects
  getAll: async () => {
    const res = await api.get("/preset-projects");
    return res.data;
  },

  // Get single preset project
  getById: async (id) => {
    const res = await api.get(`/preset-projects/${id}`);
    return res.data;
  },

  // Create preset project
  create: async (data) => {
    const res = await api.post("/preset-projects", data);
    return res.data;
  },

  // Update preset project
  update: async (id, data) => {
    const res = await api.put(`/preset-projects/${id}`, data);
    return res.data;
  },

  // Delete preset project
  delete: async (id) => {
    const res = await api.delete(`/preset-projects/${id}`);
    return res.data;
  },

  // Apply preset to create a real project
  applyToProject: async (presetId, payload) => {
    const res = await api.post(
      `/preset-projects/${presetId}/apply`,
      payload
    );
    return res.data;
  },

  applyPresetCreateProject: async (presetId, projectData) => {
    return api.post(`/preset-projects/${presetId}/apply`, {
      projectData,
    });
  },

};