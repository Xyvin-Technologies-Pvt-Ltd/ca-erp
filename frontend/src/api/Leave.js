import api from "./axios";

export const getLeaves = async () => {
  try {
    const response = await api.get("/leaves");
    return Array.isArray(response.data.data.leaves) ? response.data.data.leaves : [];
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return [];
  }
};

export const getMyLeaves = async () => {
  try {
    const response = await api.get("/leaves/my");
    const leaves = response.data?.data?.leaves || response.data?.leaves || response.data || [];
    return Array.isArray(leaves) ? leaves : [];
  } catch (error) {
    console.error("Error fetching my leaves:", error);
    return [];
  }
};

export const getLeave = async (id) => {
  const response = await api.get(`/leaves/${id}`);
  return response.data;
};

export const createLeave = async (data) => {
  const response = await api.post("/leaves", data);
  return response.data;
};

export const updateLeave = async (id, data) => {
  const response = await api.patch(`/leaves/${id}`, data);
  return response.data;
};

export const deleteLeave = async (id) => {
  const response = await api.delete(`/leaves/${id}`);
  return response.data;
};

export const reviewLeave = async (id, data) => {
  const response = await api.patch(`/leaves/${id}/review`, data);
  return response.data;
}; 