import React, { Fragment, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, Transition } from '@headlessui/react';
import { Bell, Check, Trash2, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useNotificationStore from "../hooks/useNotificationsStore"
import { Link, useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
    error,
    fetchNotifications,
    clearNotification
  } = useNotificationStore();

  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null); // Add ref for dropdown
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications when the component mounts
  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  // Format the notification date
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };
 const clearAllNotification = () => {
    clearNotification();
  };
  const DropdownContent = () => (
    <Transition
      show={isOpen}
      as={Fragment}
      enter="transition ease-out duration-200"
      enterFrom="transform opacity-0 scale-95 translate-y-2"
      enterTo="transform opacity-100 scale-100 translate-y-0"
      leave="transition ease-in duration-150"
      leaveFrom="transform opacity-100 scale-100 translate-y-0"
      leaveTo="transform opacity-0 scale-95 translate-y-2"
    >
      <div
        ref={dropdownRef} // Add ref here
        className="fixed w-96 rounded-xl shadow-xl bg-white ring-1 ring-slate-200/50 focus:outline-none overflow-hidden"
        style={{
          top: `${dropdownPosition.top}px`,
          right: `${dropdownPosition.right}px`,
          zIndex: 99999,
        }}
      >
        <div className="py-1">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Bell className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200"
                >
                  Mark all read
                </button>
                
              )}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="px-6 py-8 text-center">
              <div className="inline-flex items-center gap-2 text-slate-500">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-[#1c6ead] rounded-full animate-spin"></div>
                <span className="text-sm">Loading notifications...</span>
              </div>
            </div>
          ) : error ? (
            <div className="px-6 py-8 text-center">
              <div className="inline-flex items-center gap-2 text-red-500">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-sm">!</span>
                </div>
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">No notifications</p>
                  <p className="text-xs text-slate-500 mt-1">You're all caught up!</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.slice(0, 5).map((notification, index) => (
                <div
                  key={notification._id}
                  className={`
                    relative px-6 py-4 transition-all duration-200 cursor-pointer
                    ${!notification.read ? 'bg-gradient-to-r from-blue-50/50 to-transparent border-l-2 border-blue-400' : ''}
                    ${index !== notifications.slice(0, 5).length - 1 ? 'border-b border-slate-100' : ''}
                    hover:bg-slate-50 group
                  `}
                  // onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-4">
                    {/* Notification Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      !notification.read 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Bell className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="block group-hover:text-blue-600 transition-colors duration-200">
                            <p className={`text-sm font-medium leading-tight ${
                              !notification.read ? 'text-slate-900' : 'text-slate-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(notification.createdAt)}</span>
                            </div>
                            {notification.link && (
                              <ExternalLink className="h-3 w-3 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification._id);
                                    }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-all duration-200"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification._id);
                                  }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
                            title="Delete notification"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute right-4 top-4 w-2 h-2 bg-[#1c6ead] rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
              <Link
                  to="/notifications"
                  className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-all duration-200 group"
                >
                  <span>View all notifications</span>
                  <ExternalLink className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <div className="text-center ">
                <button
                  onClick={clearAllNotification}
                  className="hover:bg-slate-200 w-full px-12 py-2 mt-1 rounded-2xl text-blue-700 font-semibold cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Transition>
  );

  // Close dropdown when clicking outside - FIXED VERSION
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        // Check if the click is inside the dropdown using the ref
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-all duration-200 group"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold shadow-lg animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Menu.Button>
        </div>

        {/* Render dropdown in portal */}
        {typeof window !== 'undefined' && createPortal(<DropdownContent />, document.body)}
      </Menu>
    </>
  );
};

export default NotificationDropdown;