import api from "./axios";

export const getLeaves = async () => {
  try {
    const response = await api.get("/leaves");
    console.log(response);
    
    return Array.isArray(response.data.data.leaves) ? response.data.data.leaves : [];
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return [];
  }
};

export const getMyLeaves = async () => {
  try {
    const response = await api.get("/leaves/my");
    console.log("Raw API response:", response);
    
    // Handle different response structures
    let leaves = [];
    if (response.data?.data?.leaves) {
      leaves = response.data.data.leaves;
    } else if (response.data?.leaves) {
      leaves = response.data.leaves;
    } else if (Array.isArray(response.data)) {
      leaves = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      leaves = response.data.data;
    }
    
    console.log("Processed leaves:", leaves);
    return leaves;
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