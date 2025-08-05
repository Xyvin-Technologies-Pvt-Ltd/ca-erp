import axios from './axios';

export const cronJobsApi = {
  // Get all cron jobs for a client
  getCronJobs: async (params = {}) => {
    try {
      const response = await axios.get('/cronjobs', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single cron job
  getCronJob: async (id) => {
    try {
      const response = await axios.get(`/cronjobs/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create cron job
  createCronJob: async (data) => {
    try {
      const response = await axios.post('/cronjobs', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update cron job
  updateCronJob: async (id, data) => {
    try {
      const response = await axios.put(`/cronjobs/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete cron job
  deleteCronJob: async (id) => {
    try {
      const response = await axios.delete(`/cronjobs/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get sections for a client
  getSections: async (clientId) => {
    try {
      const response = await axios.get(`/cronjobs/sections/${clientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
}; 