import axios from './axios';

export const sectionsApi = {
  // Create section
  createSection: async (data) => {
    const response = await axios.post('/sections', data);
    return response.data;
  },
  // List sections by client
  getSectionsByClient: async (clientId) => {
    const response = await axios.get(`/sections/client/${clientId}`);
    return response.data;
  },
  // Delete section
  deleteSection: async (id) => {
    const response = await axios.delete(`/sections/${id}`);
    return response.data;
  },
}; 