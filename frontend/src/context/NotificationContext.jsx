import React, { createContext, useContext, useEffect, useState } from 'react';
import useAuthStore from '../hooks/useAuthStore';
import { API_BASE_URL } from '../config/constants';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      // Create WebSocket connection
      const wsUrl = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/$/, '');
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to WebSocket server');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            setNotifications(prev => [data, ...prev]);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('Disconnected from WebSocket server');
      };

      setSocket(ws);

      // Cleanup on unmount
      return () => {
        if (ws) {
          ws.close();
        }
      };
    }
  }, [user]);

  const value = {
    notifications,
    setNotifications,
    socket
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};