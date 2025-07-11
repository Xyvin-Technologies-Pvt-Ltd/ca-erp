import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon, CodeBracketIcon, MapPinIcon, CheckCircleIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { getDepartments, deleteDepartment } from '../../api/department.api';
import DepartmentModal from '../../components/DepartmentModal';

const statusColors = {
  true: "bg-green-100 text-green-800",
  false: "bg-red-100 text-red-800",
};

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchDepartments = async (pageNum = page) => {
        try {
            setLoading(true);
            const response = await getDepartments({ page: pageNum, limit });
            setDepartments(Array.isArray(response.data) ? response.data : []);
            setTotal(response.total || 0);
            setTotalPages(Math.ceil(response.total / limit) || 1); // Calculate totalPages
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to fetch departments');
            setDepartments([]);
            setTotal(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments(page);
    }, [page]);

    const handleEdit = (department) => {
        setSelectedDepartment(department);
        setShowModal(true);
    };

    const handleDelete = (department) => {
        setSelectedDepartment(department);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!selectedDepartment) return;

        try {
            await deleteDepartment(selectedDepartment._id);
            toast.success('Department deleted successfully');
            if (departments.length === 1 && page > 1) {
                setPage(page - 1); // Go to previous page if current page becomes empty
            } else {
                fetchDepartments(page);
            }
        } catch (error) {
            console.error('Error deleting department:', error);
            toast.error(error.response?.data?.message || 'Failed to delete department');
        } finally {
            setShowDeleteConfirm(false);
            setSelectedDepartment(null);
        }
    };

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
                    className="h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full"
                ></motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-[85vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-b from-gray-50 to-gray-100"
        >
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center space-x-3 mb-4 sm:mb-0"
                >
                    <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Departments</h1>
                </motion.div>
                <motion.button
                    onClick={() => setShowModal(true)}
                    className="group px-6 py-3 bg-blue-500 text-white rounded-xl hover:from-blue-550 hover:blue-550 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Department</span>
                </motion.button>
            </div>

            <AnimatePresence mode="wait">
                {departments.length === 0 ? (
                    <motion.div
                        key="no-departments"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-lg shadow p-8 sm:p-10 text-center border border-gray-200 hover:shadow-lg transition-all duration-300"
                    >
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                            No departments found
                        </h2>
                        <p className="text-sm sm:text-base text-gray-500 mb-6">
                            Get started by adding your first department.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="department-list"
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
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Department Name</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Location</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <AnimatePresence>
                                        {departments.map((department, index) => (
                                            <motion.tr
                                                key={department._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                className="hover:bg-gray-50 transition-colors duration-200"
                                            >
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="flex items-center space-x-2">
                                                        {department.code}
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="flex items-center space-x-2">
                                                        <BuildingOfficeIcon className="h-5 w-5 text-blue-500 mr-1" />
                                                        {department.name}
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                                    <div className="flex items-center space-x-2">
                                                        <MapPinIcon className="h-5 w-5 text-blue-500 mr-1" />
                                                        {department.location}
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <motion.span
                                                        className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-xs sm:text-sm font-medium ${statusColors[department.isActive]}`}
                                                        whileHover={{ scale: 1.05 }}
                                                    >
                                                        {department.isActive ? (
                                                            <CheckCircleIcon className="h-5 w-5 mr-1 text-green-600" />
                                                        ) : (
                                                            <XCircleIcon className="h-5 w-5 mr-1 text-red-600" />
                                                        )}
                                                        {department.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                    </motion.span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2 sm:space-x-3">
                                                        <motion.button
                                                            onClick={() => handleEdit(department)}
                                                            className="text-blue-600 hover:text-blue-900 cursor-pointer"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            <PencilIcon className="h-5 w-5" />
                                                        </motion.button>
                                                        <motion.button
                                                            onClick={() => handleDelete(department)}
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
                        {totalPages > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <button
                                            onClick={() => {
                                                console.log('Previous page:', page - 1);
                                                setPage(page - 1);
                                            }}
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
                                            onClick={() => {
                                                console.log('Next page:', page + 1);
                                                setPage(page + 1);
                                            }}
                                            disabled={page === totalPages}
                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                                                page === totalPages
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300 shadow-sm hover:shadow-md'
                                            }`}
                                        >
                                            Next
                                            <ChevronRightIcon className="w-4 h-4 ml-1" />
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                                                <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
                                                <span className="font-medium">{total}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
                                                <button
                                                    onClick={() => {
                                                        console.log('Previous page:', page - 1);
                                                        setPage(page - 1);
                                                    }}
                                                    disabled={page === 1}
                                                    className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium transition-all duration-200 ${
                                                        page === 1
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                                                            : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <ChevronLeftIcon className="w-4 h-4" />
                                                </button>
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => {
                                                            console.log('Page:', p);
                                                            setPage(p);
                                                        }}
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
                                                    onClick={() => {
                                                        console.log('Next page:', page + 1);
                                                        setPage(page + 1);
                                                    }}
                                                    disabled={page === totalPages}
                                                    className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium transition-all duration-200 ${
                                                        page === totalPages
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                                                            : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-300 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <ChevronRightIcon className="w-4 h-4" />
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <DepartmentModal
                            isOpen={showModal}
                            onClose={() => {
                                setShowModal(false);
                                setSelectedDepartment(null);
                            }}
                            onSuccess={() => {
                                setShowModal(false);
                                setSelectedDepartment(null);
                                fetchDepartments();
                            }}
                            department={selectedDepartment}
                        />
                    </motion.div>
                )}
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center"
                    >
                        <div className="bg-white rounded-lg p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow border border-gray-200 hover:shadow-lg transition-all duration-300">
                            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-4">Delete Department</h3>
                            <p className="text-sm sm:text-base text-gray-500 mb-4">
                                Are you sure you want to delete this department? This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <motion.button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    onClick={confirmDelete}
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

export default Departments;