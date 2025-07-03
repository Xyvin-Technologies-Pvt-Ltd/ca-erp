import { useState, useEffect } from "react";
import { ROLES } from "../../config/constants";
import UserForm from "./UserForm";
import { userApi } from "../../api/userApi";
import { toast } from "react-toastify";
import { PencilIcon, TrashIcon, UserIcon, EnvelopeIcon, ShieldCheckIcon, BuildingOfficeIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await userApi.getAllUsers({
        page,
        limit: pagination.limit
      });
      setUsers(response.data);
      console.log(response.data);
      
      setPagination({
        ...pagination,
        page,
        total: response.total,
      });
      setError(null);
    } catch (error) {
      console.error("Failed to load users:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to load users";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(pagination.page);
  }, []);

  const handlePageChange = (newPage) => {
    loadUsers(newPage);
  };

  const handleAddUser = async (userData) => {
    try {
      await userApi.createUser(userData);
      toast.success("User added successfully!");
      await loadUsers();
      setShowAddModal(false);
    } 
    catch (error) {
      console.error("Create user failed:", error.response?.data); 
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to add user";
      toast.error(errorMessage);
    }
  };

  const handleEditUser = async (userData) => {
    try {
      await userApi.updateUser(userData._id, userData);
      toast.success("User updated successfully!");
      await loadUsers();
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to update user:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to update user";
      toast.error(errorMessage);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await userApi.deleteUser(currentUser._id);
      toast.success("User deleted successfully!");
      await loadUsers();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete user:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to delete user";
      toast.error(errorMessage);
    }
  };

  const openEditModal = (user) => {
    setCurrentUser(user);
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return "bg-red-100 text-red-800";
      case ROLES.MANAGER:
        return "bg-blue-100 text-blue-800";
      case ROLES.FINANCE:
        return "bg-green-100 text-green-800";
      case ROLES.STAFF:
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center items-center h-64"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-t-2 border-b-2 border-indigo-500 rounded-full"
        ></motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-red-50 p-6 rounded-lg shadow-md border border-red-200"
      >
        <div className="flex items-center space-x-2 text-red-700">
          <XCircleIcon className="h-5 w-5" />
          <p>{error}</p>
        </div>
        <motion.button
          onClick={loadUsers}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5m11-1V4m0 0h-5m5 0l-7 7m-2 5v5h5" />
          </svg>
          <span>Try Again</span>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-b from-gray-50 to-gray-100"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-3 mb-4 sm:mb-0"
        >
          <UserIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employees</h1>
        </motion.div>
        <motion.button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-3 bg-indigo-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add User</span>
          </div>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {users.length === 0 ? (
          <motion.div
            key="no-users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow p-8 sm:p-10 text-center border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              No users found
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mb-6">
              Get started by adding your first user.
            </p>
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add User</span>
              </div>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="user-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-indigo-600" />
                        <span>Name</span>
                      </div>
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <EnvelopeIcon className="h-4 w-4 text-indigo-600" />
                        <span>Email</span>
                      </div>
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <ShieldCheckIcon className="h-4 w-4 text-indigo-600" />
                        <span>Role</span>
                      </div>
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <BuildingOfficeIcon className="h-4 w-4 text-indigo-600" />
                        <span>Department</span>
                      </div>
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="h-4 w-4 text-indigo-600" />
                        <span>Status</span>
                      </div>
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center justify-end space-x-2">
                        <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <span>Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.avatar ? (
                                <img
                                  className="h-10 w-10 rounded-full transition-transform duration-200 hover:scale-110"
                                  src={`${import.meta.env.VITE_BASE_URL}${user.avatar}`}
                                  onError={(e) => {
                                    e.target.outerHTML = `
                                      <svg className="h-10 w-10 rounded-full" fill="none" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="20" cy="20" r="20" fill="#9CA3AF"/>
                                        <path d="M20 12a4 4 0 100 8 4 4 0 000-8zm0 10c-4.42 0-8 3.58-8 8v2h16v-2c0-4.42-3.58-8-8-8z" fill="white"/>
                                      </svg>`
                                  }}
                                  alt={`${user.name}'s avatar`}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                                  <span className="text-white font-medium text-sm">
                                    {user.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <motion.span
                            className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-xs sm:text-sm font-medium ${getRoleBadgeColor(user.role)}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </motion.span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.department}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <motion.span
                            className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-xs sm:text-sm font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {user.status === "active" ? (
                              <CheckCircleIcon className="h-5 w-5 mr-1 text-green-600" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 mr-1 text-red-600" />
                            )}
                            {user.status}
                          </motion.span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2 sm:space-x-3">
                            <motion.button
                              onClick={() => openEditModal(user)}
                              className="text-blue-600 hover:text-blue-900 cursor-pointer"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                              onClick={() => openDeleteModal(user)}
                              className="text-red-600 hover:text-red-900 cursor-pointer"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  pagination.page === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-900 border border-gray-300"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === totalPages}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  pagination.page === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-900 border border-gray-300"
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                      pagination.page === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300 cursor-pointer"
                    }`}
                  >
                    <span className="sr-only">First</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  
                  {pages.map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                        <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                      pagination.page === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-500 hover:bg-gray-50 border-gray-300 cursor-pointer"
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-10 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add User</span>
                </h3>
              </div>
              <UserForm
                onSubmit={handleAddUser}
                onCancel={() => setShowAddModal(false)}
              />
            </motion.div>
          </motion.div>
        )}

        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-10 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <PencilIcon className="h-5 w-5 text-indigo-600" />
                  <span>Edit User</span>
                </h3>
              </div>
              <UserForm
                user={currentUser}
                onSubmit={handleEditUser}
                onCancel={() => setShowEditModal(false)}
              />
            </motion.div>
          </motion.div>
        )}

        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-10 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <TrashIcon className="h-5 w-5 text-red-600" />
                  <span>Confirm Delete</span>
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Are you sure you want to delete {currentUser.name}? This action cannot be undone.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <motion.button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-2">
                    <XCircleIcon className="h-5 w-5" />
                    <span>Cancel</span>
                  </div>
                </motion.button>
                <motion.button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-2">
                    <TrashIcon className="h-5 w-5" />
                    <span>Delete</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserManagement;