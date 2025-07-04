import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../ui';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from "../components/NotificationDropdown";
import { ROUTES } from '../config/constants';
import { Menu, Search, User, Settings, LogOut, Tag } from 'lucide-react';
import { fetchTasks } from "../api/tasks";
import { projectsApi } from "../api/projectsApi";
import { clientsApi } from "../api/clientsApi";

const AvatarWithFallback = ({ name, src, size }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center overflow-hidden shadow-lg border-2 border-white transition-all duration-300 hover:shadow-xl hover:scale-105">
      {src && !imageError ? (
        <Avatar
          name={name}
          src={src}
          size={size}
          onError={() => setImageError(true)}
        />
      ) : (
        <User className="w-5 h-5 text-white" />
      )}
    </div>
  );
};

const Header = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        setIsSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
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

  const handleLogout = async () => {
    await logout();
  };
  
  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchTerm('');
    setIsSearchFocused(false);
    navigate(result.route);
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'task':
        return <Tag className="w-3 h-3" />;
      case 'project':
        return <Tag className="w-3 h-3" />;
      case 'client':
        return <User className="w-3 h-3" />;
      default:
        return <Tag className="w-3 h-3" />;
    }
  };

  const getResultColor = (type) => {
    switch (type) {
      case 'task':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'project':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'client':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 sticky top-0 z-0">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              onClick={onOpenSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-between">
            {/* Search bar */}
            <div className="flex-1 flex items-center md:ml-6" ref={searchRef}>
              <div className="max-w-lg w-full relative">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className={`h-5 w-5 transition-colors duration-200 ${
                      isSearchFocused ? 'text-blue-500' : 'text-slate-400'
                    }`} />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className={`block w-full pl-12 pr-4 py-3 border rounded-xl leading-5 bg-white/50 backdrop-blur-sm placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white sm:text-sm transition-all duration-300 ${
                      isSearchFocused 
                        ? 'border-blue-300 shadow-lg shadow-blue-500/10' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    placeholder="Search tasks, projects, clients..."
                    type="search"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                  />
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute mt-2 w-full bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200/50 z-50 overflow-hidden">
                    <div className="max-h-80 overflow-auto">
                      {searchResults.map((result, index) => (
                        <div
                          key={`${result.type}-${result.id}`}
                          className={`cursor-pointer hover:bg-slate-50 px-4 py-3 transition-all duration-200 ${
                            index !== searchResults.length - 1 ? 'border-b border-slate-100' : ''
                          }`}
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getResultColor(result.type)}`}>
                              {getResultIcon(result.type)}
                              <span className="capitalize">{result.type}</span>
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-slate-900 font-medium truncate">{result.title}</span>
                              {result.subtitle && (
                                <span className="text-xs text-slate-500 truncate">{result.subtitle}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side icons */}
            <div className="ml-6 flex items-center gap-4">
              {/* Notifications dropdown */}
              <NotificationDropdown />

              {/* Profile dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  id="user-menu"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <AvatarWithFallback
                    name={user?.name || 'User'}
                    src={
                      user?.avatar
                        ? `${import.meta.env.VITE_BASE_URL}${user.avatar}`
                        : undefined
                    }
                    size="sm"
                  />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 leading-tight">
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Role'}
                    </p>
                  </div>
                </button>

                {showUserMenu && (
                  <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-white/95 backdrop-blur-md border border-slate-200/50 overflow-hidden z-40">
                    <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex items-center gap-3">
                        <AvatarWithFallback
                          name={user?.name || 'User'}
                          src={
                            user?.avatar
                              ? `${import.meta.env.VITE_BASE_URL}${user.avatar}`
                              : undefined
                          }
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {user?.name || 'User'}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        to={ROUTES.PROFILE}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
                        role="menuitem"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Your Profile</span>
                      </Link>
                      
                      {['admin', 'manager'].includes(user?.role) && (
                        <Link
                          to={ROUTES.SETTINGS}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
                          role="menuitem"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                            <Settings className="w-4 h-4" />
                          </div>
                          <span className="font-medium">Settings</span>
                        </Link>
                      )}
                      
                      <div className="border-t border-slate-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                          role="menuitem"
                        >
                          <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span className="font-medium">Sign out</span>
                        </button>
                      </div>
                    </div>
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