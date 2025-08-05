import api from "./axios";

export const getLeaves = async (params = {}) => {
  try {
    const { page = 1, limit = 10, ...rest } = params;
    const response = await api.get("/leaves", {
      params: { page, limit, ...rest },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return { data: { leaves: [] }, total: 0, page: 1, totalPages: 1 };
  }
};

export const getMyLeaves = async () => {
  try {
    const response = await api.get("/leaves/my");

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

export const casualLeaveAvailable = async () => {
  const res = await api.get("/leaves/casualLeaveAvailable");
  return res;
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
