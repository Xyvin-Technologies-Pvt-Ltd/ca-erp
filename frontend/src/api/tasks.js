import api from "./axios";

/**
 * Fetch tasks data
 * @param {Object} params - Query parameters for fetching tasks
 * @returns {Promise} Promise object containing tasks data
 */
export const fetchTasks = async (filters = {}) => {
  try {
    const query = new URLSearchParams(filters).toString();

    const response = await api.get(`/tasks?${query}`);

    return {
      tasks: response.data.data,
      pagination: response.data.pagination,
      total: response.data.total,
      team: response.data.team, // if this exists
    };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};
export const removeDoc = async (id,taskId) => {
  try {
    const response = await api.put(`/tasks/removedoc/${id}`,{taskId});
    return response
  } catch (error) {
    console.error("Error when removing document:", error);
    throw error;
  }
};
/**
 * @returns {Promise} Promise object containing all tasks data
 */
export const fetchAllTasks = async () => {
  try {
    const response = await api.get("/tasks/all");
    return {
      tasks: response.data.data,
      count: response.data.count,
    };
  } catch (error) {
    console.error("Error fetching all tasks (no pagination):", error);
    throw error;
  }
};

/**
 * Fetch a single task by ID
 * @param {string} id - Task ID
 * @returns {Promise} Promise object containing task data
 */
export const fetchTaskById = async (id) => {
  try {
    // In a real app, we would fetch from the backend
    const response = await api.get(`/tasks/${id}`);

    return response.data.data;
  } catch (error) {
    console.error(`Error fetching task ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch tasks by project ID
 * @param {string} projectId - Project ID
 * @returns {Promise} Promise object containing tasks data for the project
 */
export const fetchTasksByProject = async (projectId) => {
  try {
    // In a real app, we would fetch from the backend
    const response = await api.get(`/projects/${projectId}/tasks`);
    // return response.data;

    return {
      data: response.data.data,
      pagination: response.data.pagination,
      total: response.data.total,
    };

    // For demo purposes, filter the mock tasks by project ID
    // const { tasks } = await fetchTasks();
    // return {
    //     tasks: tasks.filter(task => task.project?.id === projectId),
    //     total: tasks.filter(task => task.project?.id === projectId).length
    // };
  } catch (error) {
    console.error(`Error fetching tasks for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @returns {Promise} Promise object containing the created task
 */
export const createTask = async (taskData, token) => {
  try {
    const isFormData = taskData instanceof FormData;

    const response = await api.post("/tasks", taskData, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isFormData && { "Content-Type": "multipart/form-data" }),
      },
    });

    return response;
  } catch (error) {
    // Improved error logging with response data (if available)
    if (error.response) {
      console.error("Error creating task:", error.response.data);
    } else {
      console.error("Error creating task:", error.message);
    }
    throw error;
  }
};

/**
 * Update an existing task
 * @param {string} id - Task ID
 * @param {Object} taskData - Updated task data
 * @returns {Promise} Promise object containing the updated task
 */
export const updateTask = async (id, taskData, token) => {
  try {
    const isFormData = taskData instanceof FormData;

    const response = await api.put(`/tasks/${id}`, taskData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        ...(isFormData
          ? { "Content-Type": "multipart/form-data" }
          : {
              "Content-Type": "application/json",
            }),
      },
    });

    return response.data; // safer than returning raw response
  } catch (error) {
    console.error(`Error updating task ${id}:`, error.response || error);
    throw error;
  }
};

/**
 * Delete a task
 * @param {string} id - Task ID
 * @returns {Promise} Promise object containing the result of deletion
 */
export const deleteTask = async (id) => {
  try {
    // In a real app, we would delete from the backend
    await api.delete(`/tasks/${id}`);
    // return { success: true };

    // For demo purposes, return success
    return { success: true, message: "Task deleted successfully" };
  } catch (error) {
    console.error(`Error deleting task ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch all completed tasks that need invoicing
 * @returns {Promise} Promise object representing the tasks data
 */
export const fetchCompletedTasksForInvoicing = async () => {
  try {
    const allTasks = await fetchTasks();

    if (!Array.isArray(allTasks.tasks)) {
      console.error(
        "Tasks array is undefined or not an array:",
        allTasks.tasks
      );
      throw new Error("Failed to load tasks for invoicing");
    }

    const completedTasks = allTasks.tasks.filter(
      (task) =>
        task.status === "completed" &&
        (!task.invoiceStatus || task.invoiceStatus === "Not Invoiced")
    );

    return {
      tasks: completedTasks,
      team: allTasks.team,
    };
  } catch (error) {
    console.error("Error fetching completed tasks for invoicing:", error);
    throw error;
  }
};

/**
 * Mark a task as invoiced
 * @param {string} id - Task ID
 * @param {Object} invoiceData - Invoice data including invoice number and date
 * @returns {Promise} Promise object containing the updated task
 */
export const markProjectAsInvoiced = async (id, invoiceData) => {
  try {
    const project = await fetchProjectById(id);

    // Mark the project as invoiced
    return {
      ...project,
      status: "Invoiced",
      invoiceStatus: "Invoiced",
      invoiceData: {
        ...invoiceData,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(`Error marking project ${id} as invoiced:`, error);
    throw error;
  }
};
// export const markTaskAsInvoiced = async (id, invoiceData) => {
//     try {
//         // In a real app, we would put to the backend
//         // const response = await api.put(`/api/tasks/${id}/invoice`, invoiceData);
//         // return response.data;

//         const task = await fetchTaskById(id);

//         // Mark the task as invoiced
//         return {
//             ...task,
//             status: 'Invoiced',
//             invoiceStatus: 'Invoiced',
//             invoiceData: {
//                 ...invoiceData,
//                 createdAt: new Date().toISOString()
//             }
//         };
//     } catch (error) {
//         console.error(`Error marking task ${id} as invoiced:`, error);
//         throw error;
//     }
// };
export const updateTaskTime = async (id, timeData, token) => {
  try {
    const response = await api.put(`/tasks/${id}/time`, timeData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data; // Assuming the updated task or time entry is returned
  } catch (error) {
    console.error(
      `Error updating time for task ${id}:`,
      error.response || error
    );
    throw error;
  }
};

/**
 * Upload a tag document for a task
 * @param {string} taskId - Task ID
 * @param {Object} formData - Document data including file and tag info
 * @param {string} token - Auth token
 * @returns {Promise} Promise object containing the uploaded document info
 */
export const uploadTagDocument = async (taskId, formData, token) => {
  try {
    // Log all FormData entries
    for (let [key, value] of formData.entries()) {
      console.log("FormData entry:", key, typeof value, value);
    }

    const response = await api.post(
      `/tasks/${taskId}/tag-documents`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error uploading document:", error.response?.data || error);
    throw error;
  }
};

/**
 * Get tag documents for a task
 * @param {string} taskId - Task ID
 * @returns {Promise} Promise object containing the task's tag documents
 */
export const getTaskTagDocuments = async (taskId) => {
  try {
    const response = await api.get(`/tasks/${taskId}/tag-documents`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tag documents for task ${taskId}:`, error);
    throw error;
  }
};

export const addTaskRating = async (id, rating, token) => {
  try {
    const response = await api.post(
      `/tasks/${id}/rating`,
      { rating },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data; // the updated task
  } catch (error) {
    console.error(
      `Error adding rating to task ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Send reminder to client for document
 * @param {string} taskId - Task ID
 * @param {Object} reminderData - Reminder data including document name, type, and tag
 * @param {string} token - Auth token
 * @returns {Promise} Promise object containing the reminder response
 */
export const remindClientForDocument = async (taskId, reminderData, token) => {
  try {
    const response = await api.post(
      `/tasks/${taskId}/remind-client`,
      reminderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error sending reminder for task ${taskId}:`, error);
    throw error;
  }
};

