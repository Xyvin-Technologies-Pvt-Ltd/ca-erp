import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserCircleIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import LeaveModal from "../../components/LeaveModal";
import {
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
  reviewLeave,
} from "../../api/Leave";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const statusColors = {
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  Pending: "bg-yellow-100 text-yellow-800",
};

const getStatusIcon = (status) => {
  switch (status) {
    case "Approved":
      return <CheckCircleIcon className="h-5 w-5 text-green-600 mr-1" />;
    case "Rejected":
      return <XCircleIcon className="h-5 w-5 text-red-600 mr-1" />;
    case "Pending":
    default:
      return <ClockIcon className="h-5 w-5 text-yellow-600 mr-1" />;
  }
};

const Leave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, leave: null });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLeavesData = async (pageNum = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaves({ page: pageNum, limit });
      setLeaves(Array.isArray(data.data?.leaves) ? data.data.leaves : []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeavesData(page);
  }, [page]);

  const handleEdit = (leave) => {
    setSelectedLeave(leave);
    setShowModal(true);
  };

  const handleDeleteClick = (leave) => {
    setDeleteModal({ isOpen: true, leave });
  };

  const handleDelete = async () => {
    if (!deleteModal.leave?._id) return;
    try {
      await deleteLeave(deleteModal.leave._id);
      toast.success("Leave request deleted successfully");
      fetchLeavesData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete leave request");
    } finally {
      setDeleteModal({ isOpen: false, leave: null });
    }
  };

  const handleAdd = () => {
    setSelectedLeave(null);
    setShowModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-3 mb-4 sm:mb-0"
        >
          <CalendarIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Leave Requests</h1>
        </motion.div>
        {/* <motion.button
          onClick={handleAdd}
          className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl flex items-center"  
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
            <span>Add Leave Request</span>
        </motion.button> */}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow p-8 sm:p-10 text-center border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto mb-4"
            ></motion.div>
            <p className="text-sm sm:text-base text-gray-500 font-medium">Loading leave requests...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow p-8 sm:p-10 text-center border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Error Loading Leave Requests</h3>
            <p className="text-sm sm:text-base text-red-600">{error}</p>
          </motion.div>
        ) : leaves.length === 0 ? (
          <motion.div
            key="no-leaves"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow p-8 sm:p-10 text-center border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No leave requests found</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6">Get started by creating your first leave request</p>
            {/* <motion.button
              onClick={handleAdd}
               className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl flex items-center"  
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                <span>Add Leave Request</span>
            </motion.button> */}
          </motion.div>
        ) : (
          <motion.div
            key="leave-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">End Date</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Duration</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaves.map((leave, index) => (
                    <motion.tr
                      key={leave._id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <UserCircleIcon className="h-5 w-5 text-blue-500" />
                          <span className="truncate">{leave.employee ? leave.employee.name : "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <TagIcon className="h-5 w-5 text-blue-500" />
                          <span>{leave.leaveType?.charAt(0).toUpperCase() + leave.leaveType?.slice(1) || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-5 w-5 text-blue-500" />
                          <span>
                            {leave.startDate
                              ? new Date(leave.startDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "2-digit",
                                })
                              : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-5 w-5 text-blue-500" />
                          <span>
                            {leave.endDate
                              ? new Date(leave.endDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "2-digit",
                                })
                              : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-5 w-5 text-blue-500" />
                          <span>{leave.duration ? `${leave.duration} ${leave.duration === 1 ? "day" : "days"}` : "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <motion.span
                          className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-sm font-normal ${statusColors[leave.status] || statusColors.Pending}`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {getStatusIcon(leave.status)}
                          {leave.status || "Pending"}
                        </motion.span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2 sm:space-x-3">
                          <motion.button
                            onClick={() => handleEdit(leave)}
                            className="text-blue-600 hover:text-blue-900 cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            title={`Edit ${leave.leaveType} Leave Request`}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteClick(leave)}
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            title={`Delete ${leave.leaveType} Leave Request`}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Controls */}
       {totalPages > 0 && (
                                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                          <div>
                                              <p className="text-sm text-gray-700">
                                                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
                                                  <span className="font-medium">{Math.min(page * limit, total)}</span> of{" "}
                                                  <span className="font-medium">{total}</span> results
                                              </p>
                                          </div>
                                          <div>
                                              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                  <button
                                                      onClick={() => setPage(page - 1)}
                                                      disabled={page === 1}
                                                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                                                          page === 1
                                                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                              : 'bg-white text-indigo-600 hover:bg-indigo-50 border-gray-200'
                                                      }`}
                                                  >
                                                      <span className="sr-only">First</span>
                                                      <ChevronLeftIcon className="h-5 w-5" />
                                                  </button>
                                                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                                      <button
                                                          key={p}
                                                          onClick={() => setPage(p)}
                                                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                              p === page
                                                                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                                  : 'bg-white border-gray-200 text-gray-500 hover:bg-indigo-50'
                                                          }`}
                                                      >
                                                          {p}
                                                      </button>
                                                  ))}
                                                  <button
                                                      onClick={() => setPage(page + 1)}
                                                      disabled={page === totalPages}
                                                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                                                          page === totalPages
                                                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                              : 'bg-white text-indigo-600 hover:bg-indigo-50 border-gray-200'
                                                      }`}
                                                  >
                                                      <span className="sr-only">Next</span>
                                                      <ChevronRightIcon className="h-5 w-5" />
                                                  </button>
                                              </nav>
                                          </div>
                                      </div>
                                  </div>
                              )}
      {/* {totalPages > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300 shadow-sm hover:shadow-md'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  page === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300 shadow-sm hover:shadow-md'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, total)}</span> of <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium transition-all duration-200 ${
                      page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                        : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all duration-200 ${
                        p === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-blue-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium transition-all duration-200 ${
                      page === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                        : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    &gt;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )} */}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LeaveModal
              leave={selectedLeave}
              onClose={() => {
                setShowModal(false);
                setSelectedLeave(null);
              }}
              onSuccess={() => {
                setShowModal(false);
                setSelectedLeave(null);
                fetchLeavesData();
              }}
            />
          </motion.div>
        )}
        {deleteModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-lg p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow border border-gray-200 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-4">Delete Leave Request</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4">
                Are you sure you want to delete this leave request for{" "}
                {deleteModal.leave?.employee?.name || "Unknown"}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <motion.button
                  onClick={() => setDeleteModal({ isOpen: false, leave: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Leave;