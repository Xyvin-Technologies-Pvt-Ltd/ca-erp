import api from "./axios";

export const notificationsApi = {
  // Get all notifications for the current user
  getAllNotifications: async (params) => {
    try {
      const response = await api.get("/notifications", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch notifications"
      );
    }
  },
  //alert task due for employees
  // alertTaskDueDate: async () => {
  //   try {
  //     const response = await api.get("/notifications/reminder-task-due");
  //     return response.data;
  //   } catch (error) {
  //     throw new Error(
  //       error.response?.data?.message || "Failed to fetch due notifications"
  //     );
  //   }
  // },
  //delete all notifications
  deleteAllNotification: async () => {
    try {
      const response = await api.delete("/notifications/delete");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete notifications"
      );
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to mark notification as read"
      );
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.put("/notifications/read-all");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to mark all notifications as read"
      );
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete notification"
      );
    }
  },

  // Remove or implement these if backend supports them
  getNotificationSettings: async () => {
    try {
      const response = await api.get("/notifications/settings");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch notification settings"
      );
    }
  },

  updateNotificationSettings: async (settings) => {
    try {
      const response = await api.put("/notifications/settings", settings);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to update notification settings"
      );
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch unread count"
      );
    }
  },
};
