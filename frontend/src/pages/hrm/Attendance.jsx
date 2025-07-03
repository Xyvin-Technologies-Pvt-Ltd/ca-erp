import { useEffect, useState } from "react";
import { getAttendance, getAttendanceStats, deleteAttendance } from "../../api/attendance";
import AttendanceModal from "../../components/AttendanceModal";
import AttendanceEditModal from "../../components/AttendanceEditModal";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  CalendarDaysIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const statusColors = {
  Present: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircleIcon,
    tableBg: "bg-green-50",
    tableText: "text-green-600",
  },
  Absent: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: XCircleIcon,
    tableBg: "bg-red-50",
    tableText: "text-red-600",
  },
  Late: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: ClockIcon,
    tableBg: "bg-yellow-50",
    tableText: "text-yellow-600",
  },
  "Half-Day": {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: SunIcon,
    tableBg: "bg-blue-50",
    tableText: "text-blue-600",
  },
  "Early-Leave": {
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-200",
    icon: MoonIcon,
    tableBg: "bg-orange-50",
    tableText: "text-orange-600",
  },
  "On-Leave": {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: UserIcon,
    tableBg: "bg-purple-50",
    tableText: "text-purple-600",
  },
  Holiday: {
    bg: "bg-pink-100",
    text: "text-pink-700",
    border: "border-pink-200",
    icon: CalendarDaysIcon,
    tableBg: "bg-pink-50",
    tableText: "text-pink-600",
  },
  "Day-Off": {
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
    icon: InformationCircleIcon,
    tableBg: "bg-gray-50",
    tableText: "text-gray-600",
  },
};

function getMonthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, record: null });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth, modalOpen, editModal.open]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split("-");
      const range = getMonthRange(new Date(year, month - 1));
      const attRes = await getAttendance({ ...range });
      setAttendance(attRes.data?.attendance || []);
      const statsRes = await getAttendanceStats({ ...range });
      setStats(statsRes.data || {});
    } catch (e) {
      toast.error("Failed to fetch attendance data", {
        style: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this attendance record?")) return;
    try {
      await deleteAttendance(id);
      toast.success("Deleted");
      fetchData();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const statusList = [
    { key: "Present", label: "Present" },
    { key: "On-Leave", label: "On Leave" },
    { key: "Late", label: "Late" },
    { key: "Half-Day", label: "Half Day" },
    { key: "Early-Leave", label: "Early Leave" },
    { key: "Absent", label: "Absent" },
    { key: "Holiday", label: "Holiday" },
    { key: "Day-Off", label: "Day Off" },
  ];

  const statusCounts = {};
  attendance.forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  const sortedAttendance = [...attendance].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4"
      >
        <div className="flex items-center space-x-3">
          <ClockIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance</h1>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <motion.input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <motion.button
            className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer font-semibold shadow-lg hover:shadow-xl flex items-center"
            onClick={() => setModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
             <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
            Add Bulk Attendance
          </motion.button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6"
      >
        <AnimatePresence>
          {statusList.map((s, index) => {
            const Icon = statusColors[s.key].icon;
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`group bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border ${statusColors[s.key].border} hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
                whileHover={{ scale: 1.02 }}
              >
                <div className={`p-2 rounded-full ${statusColors[s.key].bg} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`h-6 w-6 ${statusColors[s.key].text}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{s.label}</p>
                  <p className={`text-2xl font-bold ${statusColors[s.key].text} group-hover:text-indigo-600 transition-colors duration-200`}>
                    {statusCounts[s.key] || 0}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Attendance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300"
      >
        <h2 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200 flex items-center">
          <ClockIcon className="h-6 w-6 text-indigo-600 mr-2" />
          Attendance Records
        </h2>
        <div className="overflow-x-auto min-h-[150px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-base text-gray-600">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center space-x-2"
                    >
                      <InformationCircleIcon className="h-6 w-6 text-gray-400" />
                      <span>Loading...</span>
                    </motion.div>
                  </td>
                </tr>
              ) : sortedAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-base text-gray-600">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center space-x-2"
                    >
                      <InformationCircleIcon className="h-6 w-6 text-gray-400" />
                      <span>No records found</span>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {sortedAttendance.map((a, index) => {
                    const Icon = statusColors[a.status]?.icon;
                    return (
                      <motion.tr
                        key={a._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 text-base text-gray-900">
                          {a.employee?.name || a.employee?.firstName || "-"}
                        </td>
                        <td className="px-6 py-4 text-base text-gray-900">
                          {a.employee?.department?.name || a.employee?.department || "-"}
                        </td>
                        <td className="px-6 py-4 text-base text-gray-900">
                          {a.date ? new Date(a.date).toLocaleDateString("en-GB") : "-"}
                        </td>
                        <td className="px-6 py-4 text-base text-gray-900">
                          {a.checkIn?.time
                            ? new Date(a.checkIn.time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-base text-gray-900">
                          {a.checkOut?.time
                            ? new Date(a.checkOut.time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <motion.span
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${statusColors[a.status]?.tableBg || "bg-gray-50"} ${statusColors[a.status]?.tableText || "text-gray-600"} max-w-max border ${statusColors[a.status]?.border || "border-gray-100"}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {Icon && <Icon className="h-4 w-4 mr-1" />}
                            {a.status || "-"}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <motion.button
                              onClick={() => setEditModal({ open: true, record: a })}
                              className="text-blue-600 hover:text-blue-900 transition-colors duration-200 cursor-pointer"
                              title="Edit"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(a._id)}
                              className="text-red-600 hover:text-red-900 transition-colors duration-200 cursor-pointer"
                              title="Delete"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Loading Overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 border-t-2 border-b-2 border-indigo-500 rounded-full"
          ></motion.div>
        </motion.div>
      )}

      {/* Modals */}
      {modalOpen && (
        <AttendanceModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            fetchData();
          }}
        />
      )}
      {editModal.open && (
        <AttendanceEditModal
          attendance={editModal.record}
          onClose={() => setEditModal({ open: false, record: null })}
          onSuccess={() => {
            setEditModal({ open: false, record: null });
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default Attendance;