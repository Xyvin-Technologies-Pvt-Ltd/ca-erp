import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../ui';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from "../components/NotificationDropdown";
import { ROUTES } from '../config/constants';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { fetchTasks } from "../api/tasks";
import { projectsApi } from "../api/projectsApi";
import { clientsApi } from "../api/clientsApi";

const Header = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  const handleSearch = async (value) => {
    setSearchTerm(value);
    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      // Modified API calls with proper error handling
      const [tasksResponse, projectsResponse, clientsResponse] = await Promise.all([
        fetchTasks({ search: value }).catch(() => ({ tasks: [] })),
        projectsApi.getAllProjects().catch(() => ({ data: [] })),
        clientsApi.getAllClients().catch(() => ({ data: [] }))
      ]);

      const searchResults = [];

      // Modified task handling
      if (tasksResponse?.tasks) {
        const matchingTasks = tasksResponse.tasks
          .filter(task => 
            task.title?.toLowerCase().includes(value.toLowerCase())
          )
          .map(task => ({
            type: 'task',
            id: task._id,
            title: task.title,
            route: `${ROUTES.TASKS}/${task._id}`
          }));
        searchResults.push(...matchingTasks);
      }

      // Modified project handling
      if (projectsResponse?.data) {
        const matchingProjects = projectsResponse.data
          .filter(project => 
            project.name?.toLowerCase().includes(value.toLowerCase())
          )
          .map(project => ({
            type: 'project',
            id: project._id,
            title: project.name,
            route: `${ROUTES.PROJECTS}/${project._id}`
          }));
        searchResults.push(...matchingProjects);
      }

      // Modified client handling
      if (clientsResponse?.data) {
        const matchingClients = clientsResponse.data
          .filter(client => 
            (client.name?.toLowerCase().includes(value.toLowerCase()) ||
            client.email?.toLowerCase().includes(value.toLowerCase()))
          )
          .map(client => ({
            type: 'client',
            id: client._id,
            title: client.name,
            subtitle: client.email,
            route: `${ROUTES.CLIENTS}/${client._id}`
          }));
        searchResults.push(...matchingClients);
      }

      setSearchResults(searchResults);
      setShowResults(searchResults.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowResults(false);
    }
  };

  

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchTerm('');
    navigate(result.route);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={onOpenSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-between">
            {/* Search bar */}
            <div className="flex-1 flex items-center md:ml-6" ref={searchRef}>
              <div className="max-w-lg w-full relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search tasks, projects, clients..."
                    type="search"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
  <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg z-50">
    <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
      {searchResults.map((result) => (
        <li
          key={`${result.type}-${result.id}`}
          className="cursor-pointer hover:bg-gray-100 px-4 py-2"
          onClick={() => handleResultClick(result)}
        >
          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mr-2">
              {result.type === 'task' && (
                <span className="text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">Task</span>
              )}
              {result.type === 'project' && (
                <span className="text-green-800 bg-green-100 px-2 py-0.5 rounded-full">Project</span>
              )}
              {result.type === 'client' && (
                <span className="text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">Client</span>
              )}
            </span>
            <div className="flex flex-col">
              <span className="text-gray-900">{result.title}</span>
              {result.subtitle && (
                <span className="text-xs text-gray-500">{result.subtitle}</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}

              </div>
            </div>

            {/* Right side icons */}
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notifications dropdown */}
              <NotificationDropdown />

              {/* Profile dropdown */}
              <div className="ml-3 relative" ref={userMenuRef}>
                <div>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <Avatar
                      name={user?.name || 'User'}
                      src={
                        user?.avatar
                          ? `${import.meta.env.VITE_BASE_URL}${user.avatar}`
                          : undefined
                      }
                      size="sm"
                    />
                  </button>
                </div>

                {showUserMenu && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      to={ROUTES.PROFILE}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Your Profile
                    </Link>
                    {['admin', 'manager'].includes(user?.role) && (
                      <Link
                        to={ROUTES.SETTINGS}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Settings
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;