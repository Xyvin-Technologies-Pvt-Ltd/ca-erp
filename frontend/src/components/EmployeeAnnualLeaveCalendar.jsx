import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import moment from 'moment';
import { getAttendance } from '../api/attendance';
import { toast } from 'react-toastify';

const EmployeeAnnualLeaveCalendar = ({ employeeId, employeeName, year, onClose }) => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(year);

    useEffect(() => {
        fetchAttendance();
    }, [employeeId, currentYear]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const startDate = moment(`${currentYear}-01-01`).format('YYYY-MM-DD');
            const endDate = moment(`${currentYear}-12-31`).format('YYYY-MM-DD');

            const response = await getAttendance({
                employeeId,
                startDate,
                endDate,
                limit: 1000 // Ensure we get all records
            });

            // Filter for Absent or On-Leave
            const leaves = (response.data?.attendance || []).filter(r =>
                ['Absent', 'On-Leave'].includes(r.status) && !r.isDeleted
            );

            setAttendanceData(leaves);
        } catch (error) {
            console.error("Failed to fetch attendance:", error);
            toast.error("Failed to load attendance details");
        } finally {
            setLoading(false);
        }
    };

    const months = moment.months();

    const getDayStatus = (dateStr) => {
        // dateStr is YYYY-MM-DD
        const record = attendanceData.find(r => moment(r.date).format('YYYY-MM-DD') === dateStr);
        return record ? record.status : null;
    };

    const renderMonth = (monthIndex) => {
        const monthStart = moment(`${currentYear}-${monthIndex + 1}-01`, "YYYY-MM-DD");
        const daysInMonth = monthStart.daysInMonth();
        const startDayOfWeek = monthStart.day(); // 0 (Sun) to 6 (Sat)

        const days = [];

        // Empty cells for start padding
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }

        // Days with data
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = monthStart.clone().date(d).format('YYYY-MM-DD');
            const status = getDayStatus(dateStr);

            let bgClass = "bg-transparent text-gray-700 hover:bg-gray-100";
            if (status === 'Absent') bgClass = "bg-red-100 text-red-700 font-bold border border-red-200";
            if (status === 'On-Leave') bgClass = "bg-yellow-100 text-yellow-700 font-bold border border-yellow-200";

            days.push(
                <div
                    key={dateStr}
                    className={`h-8 w-8 flex items-center justify-center text-xs rounded-full cursor-default transition-colors ${bgClass}`}
                    title={`${dateStr}: ${status || 'Present/N/A'}`}
                >
                    {d}
                </div>
            );
        }

        return (
            <div key={months[monthIndex]} className="bg-white border rounded-lg p-3 shadow-sm">
                <h4 className="text-center font-semibold text-gray-700 mb-2">{months[monthIndex]}</h4>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-[10px] text-gray-400 font-medium">{d}</div>
                    ))}
                    {days}
                </div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{employeeName} - Leave Calendar</h2>
                        <p className="text-sm text-gray-500">Showing absences and leaves for {currentYear}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="flex items-center"><span className="w-3 h-3 bg-red-100 border border-red-200 rounded-full mr-1"></span> Absent</span>
                            <span className="flex items-center"><span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded-full mr-1"></span> On-Leave</span>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <XMarkIcon className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {months.map((_, index) => renderMonth(index))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default EmployeeAnnualLeaveCalendar;
