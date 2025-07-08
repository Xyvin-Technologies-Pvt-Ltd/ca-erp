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
    const [currentPage, setCurrentPage] = useState(1);
    const [paginations, setPaginations] = useState({ page: 1, total: 0, limit: 10 });
    const [totalPage, setTotalPage] = useState(0);
    const [pages, setPages] = useState([]);

    const fetchDepartments = async (page = currentPage, limit = paginations.limit) => {
        try {
            setLoading(true);
            const data = await getDepartments({ page, limit });
            setDepartments(Array.isArray(data.data) ? data.data : []);
            setPaginations({
                page: page,
                total: data.total || 0,
                limit: limit,
            });
            const totalPages = Math.ceil((data.total || 0) / limit);
            setTotalPage(totalPages);
            const pageNumbers = [];
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
            setPages(pageNumbers);
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast.error('Failed to fetch departments');
            setDepartments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments(currentPage, paginations.limit);
    }, [currentPage]);

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
            fetchDepartments();
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
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="flex items-center space-x-2">
                                                        <CodeBracketIcon className="h-5 w-5 text-blue-600 mr-1" />
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
                                                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {department.manager ? `${department.manager.firstName} ${department.manager.lastName}` : 'Not Assigned'}
                                                </td> */}
                                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                    <motion.span
                                                        className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-sm font-normal ${statusColors[department.isActive]}`}
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-sm text-gray-700">
                            Showing{' '}
                            <span className="font-medium">
                                {(currentPage - 1) * paginations.limit + 1}
                            </span>{' '}
                            to{' '}
                            <span className="font-medium">
                                {Math.min(currentPage * paginations.limit, paginations.total)}
                            </span>{' '}
                            of <span className="font-medium">{paginations.total}</span>{' '}
                            results
                        </p>
                    </div>
                    <div>
                        <nav
                            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                            aria-label="Pagination"
                        >
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                                    currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-blue-600 hover:bg-blue-50 border-gray-200'
                                }`}
                            >
                                <span className="sr-only">First</span>
                                <ChevronLeftIcon className="h-5 w-5" />
                            </button>
                            {pages.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                        page === currentPage
                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                            : 'bg-white border-gray-200 text-gray-500 hover:bg-blue-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPage}
                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                                    currentPage === totalPage
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-blue-600 hover:bg-blue-50 border-gray-200'
                                }`}
                            >
                                <span className="sr-only">Next</span>
                                <ChevronRightIcon className="h-5 w-5" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

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
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center"
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