import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import useNotificationStore from '../hooks/useNotificationsStore';
import { NOTIFICATION_TYPES } from '../config/constants';
import { FaTrash, FaCheck, FaCheckDouble } from 'react-icons/fa'; 


const Notification = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    markAllAsRead,
  } = useNotificationStore();

  const [filter, setFilter] = useState('all');
  const [tempError, setTempError] = useState(null);

  useEffect(() => {
    fetchNotifications();

    const connectWebSocket = () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('No authentication token found');
        return null;
      }

      const wsUrl = `${import.meta.env.VITE_WS_URL}/websocket?token=${token}`.replace(/^http/, 'ws');
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket Connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            useNotificationStore.getState().addNotification(data.data);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected. Attempting to reconnect...', event.code, event.reason);
        setTimeout(connectWebSocket, 3000);
      };

      return ws;
    };

    const ws = connectWebSocket();
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.TASK_ASSIGNED:
        return '📋';
      case NOTIFICATION_TYPES.TASK_UPDATED:
        return '✏️';
      case NOTIFICATION_TYPES.TASK_COMPLETED:
        return '✅';
      case NOTIFICATION_TYPES.DOCUMENT_REQUIRED:
        return '📄';
      case NOTIFICATION_TYPES.COMPLIANCE_DUE:
        return '⚠️';
      case NOTIFICATION_TYPES.INVOICE_REQUIRED:
        return '💰';
      default:
        return '📢';
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setTempError(null);
    } catch (error) {
      setTempError(error.message || 'Failed to delete notification');
      setTimeout(() => setTempError(null), 3000);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      {tempError && (
        <div className='text-center text-red-500 py-2 mb-4 bg-red-100 rounded'>
          {tempError}
        </div>
      )}
      {error && (
        <div className='text-center text-red-500 py-8'>
          Error loading notifications: {error}
          <button
            onClick={fetchNotifications}
            className='mt-2 text-blue-600 hover:text-blue-800'
          >
            Retry
          </button>
        </div>
      )}
      {!error && (
        <>
          <div className='flex justify-between items-center mb-6'>
            <h1 className='text-2xl font-bold'>Notifications</h1>
            <div className='flex gap-4'>
              <select
                className='border rounded-md px-3 py-1'
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value='all'>All</option>
                <option value='unread'>Unread</option>
                <option value='read'>Read</option>
              </select>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className='flex items-center gap-2 text-blue-600 hover:text-blue-800'
                >
                  <FaCheckDouble className='text-blue-600' />
                  {/* Mark all as read */}
                </button>
              )}
            </div>
          </div>

          <div className='space-y-4'>
            {filteredNotifications.length === 0 ? (
              <div className='text-center text-gray-500 py-8'>
                No notifications found
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 rounded-lg shadow ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                >
                  <div className='flex justify-between items-start'>
                    <div className='flex gap-3'>
                      <span className='text-2xl'>
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div>
                        <h3 className='font-semibold'>{notification.title}</h3>
                        <p className='text-gray-600 mt-1'>{notification.message}</p>
                        <p className='text-sm text-gray-400 mt-2'>
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className='flex items-center gap-2 text-blue-600 hover:text-blue-800'
                        >
                          <FaCheck className='text-blue-600' />
                          {/* Mark as read */}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className='flex items-center gap-2 text-red-600 hover:text-red-800'
                      >
                        <FaTrash className='text-red-600' />
                        {/* Delete */}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Notification;