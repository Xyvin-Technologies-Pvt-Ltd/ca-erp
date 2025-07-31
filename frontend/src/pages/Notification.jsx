import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import useNotificationStore from "../hooks/useNotificationsStore";
import { NOTIFICATION_TYPES } from "../config/constants";
import {
  Bell,
  Trash2,
  Check,
  CheckCheck,
  Filter,
  RefreshCw,
  AlertCircle,
  FileText,
  ClipboardList,
  Edit3,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Megaphone,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

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
    clearNotification,
  } = useNotificationStore();

  const [filter, setFilter] = useState("all");
  const [tempError, setTempError] = useState(null);

  useEffect(() => {
    fetchNotifications();

    const connectWebSocket = () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.error("No authentication token found");
        return null;
      }

      const wsUrl = `${
        import.meta.env.VITE_WS_URL
      }/websocket?token=${token}`.replace(/^http/, "ws");
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket Connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "notification") {
            useNotificationStore.getState().addNotification(data.data);
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = (event) => {
        console.log(
          "WebSocket disconnected. Attempting to reconnect...",
          event.code,
          event.reason
        );
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
  const clearAllNotification = () => {
    clearNotification();
  };
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read;
    if (filter === "read") return notification.read;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-ping mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type) => {
    const iconProps = "w-5 h-5";

    switch (type) {
      case NOTIFICATION_TYPES.TASK_ASSIGNED:
        return <ClipboardList className={`${iconProps} text-blue-600`} />;
      case NOTIFICATION_TYPES.TASK_UPDATED:
        return <Edit3 className={`${iconProps} text-orange-600`} />;
      case NOTIFICATION_TYPES.TASK_COMPLETED:
        return <CheckCircle className={`${iconProps} text-emerald-600`} />;
      case NOTIFICATION_TYPES.DOCUMENT_REQUIRED:
        return <FileText className={`${iconProps} text-purple-600`} />;
      case NOTIFICATION_TYPES.COMPLIANCE_DUE:
        return <AlertTriangle className={`${iconProps} text-amber-600`} />;
      case NOTIFICATION_TYPES.INVOICE_REQUIRED:
        return <DollarSign className={`${iconProps} text-green-600`} />;
      default:
        return <Megaphone className={`${iconProps} text-gray-600`} />;
    }
  };

  const getNotificationBorderColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.TASK_ASSIGNED:
        return "border-l-[#1c6ead]";
      case NOTIFICATION_TYPES.TASK_UPDATED:
        return "border-l-orange-500";
      case NOTIFICATION_TYPES.TASK_COMPLETED:
        return "border-l-emerald-500";
      case NOTIFICATION_TYPES.DOCUMENT_REQUIRED:
        return "border-l-purple-500";
      case NOTIFICATION_TYPES.COMPLIANCE_DUE:
        return "border-l-amber-500";
      case NOTIFICATION_TYPES.INVOICE_REQUIRED:
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setTempError(null);
    } catch (error) {
      setTempError(error.message || "Failed to delete notification");
      setTimeout(() => setTempError(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Notifications
              </h1>
              <p className="text-gray-600 text-lg">
                Stay updated with your latest activities
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {unreadCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Read</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {notifications.length - unreadCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Error Messages */}
        {tempError && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-900">Error</p>
                  <p className="text-red-700">{tempError}</p>
                </div>
              </div>
              <button
                onClick={() => setTempError(null)}
                className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-600 mb-6">
                Error loading notifications: {error}
              </p>
              <button
                onClick={fetchNotifications}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        )}

        {!error && (
          <>
            {/* Enhanced Controls */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Filter className="w-4 h-4 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Filter & Actions
                    </h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <select
                        className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent transition-all duration-200 hover:border-gray-300"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">All Notifications</option>
                        <option value="unread">Unread Only</option>
                        <option value="read">Read Only</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <>
                        <button
                          onClick={markAllAsRead}
                          className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <CheckCheck className="w-4 h-4" />
                          Mark All Read
                        </button>
                        <button
                          onClick={clearAllNotification}
                          className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Clear All
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No notifications found
                  </h3>
                  <p className="text-gray-500">
                    {filter === "unread"
                      ? "You're all caught up! No unread notifications."
                      : filter === "read"
                      ? "No read notifications to display."
                      : "You don't have any notifications yet."}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`bg-white rounded-2xl shadow-lg border-l-4 ${getNotificationBorderColor(
                      notification.type
                    )} overflow-hidden transition-all duration-200 hover:shadow-xl ${
                      notification.read
                        ? "border-gray-100"
                        : "border-blue-200 bg-gradient-to-r from-blue-50/30 to-white"
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Enhanced Icon */}
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              notification.read ? "bg-gray-100" : "bg-blue-100"
                            }`}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3
                                className={`font-semibold text-lg ${
                                  notification.read
                                    ? "text-gray-700"
                                    : "text-gray-900"
                                }`}
                              >
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-[#1c6ead] rounded-full flex-shrink-0"></div>
                              )}
                            </div>

                            <p
                              className={`text-base leading-relaxed mb-3 ${
                                notification.read
                                  ? "text-gray-500"
                                  : "text-gray-600"
                              }`}
                            >
                              {notification.message}
                            </p>

                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="inline-flex items-center gap-2 px-3 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(notification._id)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Notification;
