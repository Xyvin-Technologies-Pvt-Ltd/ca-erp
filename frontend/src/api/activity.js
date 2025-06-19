import api from "./axios";

/**
 * Fetch recent activity for the dashboard
 * @returns {Promise} Promise object containing recent activity data
 */
export const fetchRecentActivity = async () => {
    try {
        const response = await api.get('/activities/recent');
        return {
            data: response.data,
            hasMore: true
        };
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        throw error;
    }
}; 

/**
 * Create a new activity entry
 * @param {Object} activity Activity data to create
 * @returns {Promise} Promise object containing created activity data
 */
export const createActivity = async (activity) => {
    try {
        const response = await api.post('/api/activity', activity);
        return response.data;
    } catch (error) {
        console.error("Error creating activity:", error);
        throw error;
    }
};

/**
 * Get activity history for a specific entity (project, task, client)
 * @param {string} entityType Type of entity (project, task, client)
 * @param {string} entityId Entity ID
 * @returns {Promise} Promise object containing activity history
 */
export const getActivityHistory = async (entityType, entityId) => {
    try {
        const response = await api.get(`/activities/${entityType}/${entityId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching activity history:", error);
        throw error;
    }
};