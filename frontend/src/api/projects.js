import api from "./axios";

/**
 * Fetch projects data from the backend
 * @param {Object} params - Query parameters for filtering/sorting projects
 * @returns {Promise} Promise object containing projects data
 */
export const fetchProjects = async (params = {}) => {
  try {
    const response = await api.get("/projects", { params });
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching projects with params ${JSON.stringify(params)}:`,
      error.response ? error.response.data : error
    );
    throw error;
  }
};

/**
 * Fetch a single project by ID
 * @param {string} id - Project ID
 * @returns {Promise} Promise object containing project data
 */
export const fetchProjectById = async (id) => {
  try {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching project with id ${id}:`,
      error.response ? error.response.data : error
    );
    throw error;
  }
};

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @returns {Promise} Promise object containing the created project
 */
export const createProject = async (projectData) => {
  try {
    const response = await api.post("/projects", projectData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating project:",
      error.response ? error.response.data : error
    );
    throw error;
  }
};

/**
 * Update an existing project
 * @param {string} id - Project ID
 * @param {Object} updatedProject - Updated project data
 * @returns {Promise} Promise object containing the updated project
 */
export const updateProject = async (id, updatedProject) => {
  try {
    const response = await api.put(`/projects/${id}`, updatedProject);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating project with id ${id}:`,
      error.response ? error.response.data : error
    );
    throw error;
  }
};

/**
 * Delete a project
 * @param {string} id - Project ID
 * @returns {Promise} Promise object containing the result of deletion
 */
export const deleteProject = async (id) => {
  try {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting project with id ${id}:`,
      error.response ? error.response.data : error
    );
    throw error;
  }
};
export const fetchCompletedProjectsForInvoicing = async ({
  page = 1,
  limit = 10,
}) => {
  try {

    const response = await api.get("/projects", {
      params: {
        status: "completed",
        includeInvoiceStatus: true,
        page,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching completed projects:", error);
    throw error;
  }
};

export const markProjectAsInvoiced = async (id, invoiceData) => {
  try {
    // Make a real API call to update the project
    const response = await api.put(`/projects/${id}/invoice`, {
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceDate: invoiceData.invoiceDate,
      status: "invoiced",
      invoiceStatus: "Created",
      invoiceData: {
        ...invoiceData,
        createdAt: new Date().toISOString(),
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error marking project ${id} as invoiced:`, error);
    throw error;
  }
};
