import { create } from 'zustand';
import { notificationsApi } from '../api/notificationsApi';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  clearNotification: async () => {
    try {
      await notificationsApi.deleteAllNotification();
      set((state) => ({
        notifications: [],
        unreadCount: 0,
      }));
    } catch (error) {}
  },
  fetchNotifications: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      const response = await notificationsApi.getAllNotifications(params);
      set({
        notifications: response.data || [],
        unreadCount: response.data?.filter(n => !n.read).length || 0,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.message || 'Error fetching notifications',
        isLoading: false,
      });
    }
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    }));
  },

  markAsRead: async (id) => {
    try {
      const response = await notificationsApi.markAsRead(id);
      set(state => ({
        notifications: state.notifications.map(n =>
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: state.unreadCount - (state.notifications.find(n => n._id === id)?.read ? 0 : 1),
      }));
    } catch (error) {
      set({ error: error.message || 'Error marking notification as read' });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAllAsRead();
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      set({ error: error.message || 'Error marking all notifications as read' });
    }
  },

  deleteNotification: async (id) => {
    try {
      await notificationsApi.deleteNotification(id);
      set(state => ({
        notifications: state.notifications.filter(n => n._id !== id),
        unreadCount: state.unreadCount - (state.notifications.find(n => n._id === id)?.read ? 0 : 1),
      }));
    } catch (error) {
      set({ error: error.message || 'Error deleting notification' });
    }
  },
}));

export default useNotificationStore;