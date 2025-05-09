import api from './axios';

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
            tasks: response.data.data, // ✅ This is the array of tasks
            pagination: response.data.pagination,
            total: response.data.total,
            team: response.data.team // if this exists
        };
    } catch (error) {
        console.error("Error fetching tasks:", error);
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

        // For demo purposes, return a mock task
        // return {
        //     id,
        //     title: "Income Tax Audit for Tata Consultancy",
        //     description: "Conduct comprehensive income tax audit as per Section 44AB for FY 2022-23, including verification of books of accounts, tax calculations, and preparation of Form 3CD.",
        //     status: "In Progress",
        //     project: { id: "2", name: "Tax Audit 2023" },
        //     priority: "High",
        //     assignedTo: { id: "2", name: "Priya Patel", avatar: null },
        //     dueDate: "2023-08-05",
        //     createdAt: "2023-06-15",
        //     estimatedHours: 16,
        //     actualHours: 10,
        //     tags: ["Income Tax", "Audit", "44AB"],
        //     comments: [
        //         {
        //             id: "1",
        //             text: "Initial assessment of books of accounts completed. Some discrepancies in depreciation calculations noted.",
        //             user: { id: "2", name: "Priya Patel", avatar: null },
        //             timestamp: "2023-06-25T11:30:00Z"
        //         },
        //         {
        //             id: "2",
        //             text: "Please also review the provisions made for gratuity and verify compliance with AS-15.",
        //             user: { id: "7", name: "Sanjay Kapoor", avatar: null },
        //             timestamp: "2023-06-27T14:15:00Z"
        //         }
        //     ],
        //     attachments: [
        //         { id: "1", name: "tcs_trial_balance_fy2223.xlsx", size: "3.4MB", uploadedAt: "2023-06-20T10:45:00Z" },
        //         { id: "2", name: "tax_audit_checklist.pdf", size: "1.2MB", uploadedAt: "2023-06-18T09:20:00Z" },
        //         { id: "3", name: "tcs_fixed_assets_register.xlsx", size: "4.8MB", uploadedAt: "2023-07-02T11:15:00Z" }
        //     ],
        //     subtasks: [
        //         { id: "101", title: "Verify books of accounts", status: "completed" },
        //         { id: "102", title: "Review tax calculations", status: "in-progress" },
        //         { id: "103", title: "Prepare Form 3CD", status: "pending" },
        //         { id: "104", title: "Client meeting for clarifications", status: "completed" },
        //         { id: "105", title: "Final report preparation", status: "pending" }
        //     ],
        //     timeTracking: [
        //         { date: "2023-06-20", hours: 3, description: "Initial assessment of financial statements" },
        //         { date: "2023-06-22", hours: 2.5, description: "Analysis of depreciation schedule" },
        //         { date: "2023-06-25", hours: 2, description: "Review of transactions above Rs. 10,000" },
        //         { date: "2023-07-01", hours: 2.5, description: "Client meeting" }
        //     ]
        // };
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
        return response.data;

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
export const createTask = async (taskData) => {
    try {
        // In a real app, we would post to the backend
        const response = await api.post('/tasks', taskData);
        return response.data;

        // For demo purposes, return the task data with an ID
        // return {
        //     id: String(Math.floor(Math.random() * 1000) + 10),
        //     ...taskData,
        //     createdAt: new Date().toISOString()
        // };
    } catch (error) {
        console.error("Error creating task:", error);
        throw error;
    }
};

/**
 * Update an existing task
 * @param {string} id - Task ID
 * @param {Object} taskData - Updated task data
 * @returns {Promise} Promise object containing the updated task
 */
export const updateTask = async (id, taskData) => {
    try {
        // In a real app, we would put to the backend
        const response = await api.put(`/tasks/${id}`, taskData);
        return response.data;

        // For demo purposes, return the updated task data
        // return {
        //     id,
        //     ...taskData,
        //     updatedAt: new Date().toISOString()
        // };
    } catch (error) {
        console.error(`Error updating task ${id}:`, error);
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
            console.error("Tasks array is undefined or not an array:", allTasks.tasks);
            throw new Error("Failed to load tasks for invoicing");
        }

        const completedTasks = allTasks.tasks.filter(task =>
            task.status === 'completed' &&
            (!task.invoiceStatus || task.invoiceStatus === 'Not Invoiced')
        );

        return {
            tasks: completedTasks,
            team: allTasks.team
        };
    } catch (error) {
        console.error('Error fetching completed tasks for invoicing:', error);
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
      status: 'Invoiced',
      invoiceStatus: 'Invoiced',
      invoiceData: {
        ...invoiceData,
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error(`Error marking project ${id} as invoiced:`, error);
    throw error;
  }
};