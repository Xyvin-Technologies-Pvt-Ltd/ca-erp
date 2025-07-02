import { useEffect, useState } from "react";
import { getMyAttendance } from "../../api/attendance";
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
} from "@heroicons/react/24/outline";

const statusColors = {
  Present: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircleIcon },
  Absent: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", icon: XCircleIcon },
  Late: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: ClockIcon },
  "Half-Day": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: SunIcon },
  "Early-Leave": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", icon: MoonIcon },
  "On-Leave": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", icon: UserIcon },
  Holiday: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200", icon: CalendarDaysIcon },
  "Day-Off": { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", icon: InformationCircleIcon },
};

function getMonthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

function getDaysInMonth(year, month) {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const EmployeeAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split("-");
      const range = getMonthRange(new Date(year, month - 1));
      const res = await getMyAttendance({ ...range });
      setAttendance(res.data?.attendance || []);
      setStats(res.data?.overallStats || {});
    } catch (e) {
      toast.error("Failed to fetch attendance", {
        style: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },
      });
    } finally {
      setLoading(false);
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

  const attendanceByDate = {};
  attendance.forEach((a) => {
    const dateStr = a.date ? new Date(a.date).toISOString().split("T")[0] : null;
    if (dateStr) attendanceByDate[dateStr] = a;
  });

  const [year, month] = selectedMonth.split("-");
  const days = getDaysInMonth(Number(year), Number(month) - 1);
  const firstDayOfWeek = days[0].getDay();

  const attendanceDays = days.filter((day) => attendanceByDate[day.toISOString().split("T")[0]]);

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4"
      >
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
        </div>
        <div className="relative">
          <motion.input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8"
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
                className={`group bg-white rounded-xl shadow-sm p-4 flex items-center space-x-3 border ${statusColors[s.key].border} hover:shadow-md hover:-translate-y-1 transition-all duration-300`}
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

      {/* Calendar View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CalendarDaysIcon className="h-6 w-6 text-indigo-600 mr-2" />
          Monthly Calendar
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center font-semibold text-gray-600 text-sm py-2">
              {d}
            </div>
          ))}
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={"empty-" + i} className="h-16"></div>
          ))}
          <AnimatePresence>
            {days.map((day, index) => {
              const dateStr = day.toISOString().split("T")[0];
              const att = attendanceByDate[dateStr];
              const Icon = att ? statusColors[att.status]?.icon : null;
              return (
                <motion.div
                  key={dateStr}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className={`rounded-lg p-2 h-16 flex flex-col items-center justify-center group border ${att ? `${statusColors[att.status]?.bg} ${statusColors[att.status]?.border}` : "bg-gray-50 border-gray-100"} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
                  whileHover={{ scale: 1.02 }}
                >
                  <span className="font-bold text-sm text-gray-900">{day.getDate()}</span>
                  <div className="flex items-center space-x-1">
                    {Icon && <Icon className={`h-4 w-4 ${statusColors[att?.status]?.text}`} />}
                    <motion.span
                      className={`text-xs ${att ? statusColors[att.status]?.text : "text-gray-400"}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {att ? att.status : "-"}
                    </motion.span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Attendance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300"
      >
        <h2 className="text-lg font-semibold text-gray-900 p-6 border-b border-gray-200 flex items-center">
          <ClockIcon className="h-6 w-6 text-indigo-600 mr-2" />
          Attendance Records
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Work Hours</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceDays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-600 text-base">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-center space-x-2"
                    >
                      <InformationCircleIcon className="h-6 w-6 text-gray-400" />
                      <span>No attendance records this month</span>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {attendanceDays.map((day, index) => {
                    const dateStr = day.toISOString().split("T")[0];
                    const att = attendanceByDate[dateStr];
                    const Icon = statusColors[att?.status]?.icon;
                    return (
                      <motion.tr
                        key={dateStr}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 text-base text-gray-900">{dateStr.split("-").reverse().join("/")}</td>
                        <td className="px-6 py-4 text-base text-gray-900">
                          {att?.checkIn?.time ? new Date(att.checkIn.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                        <td className="px-6 py-4 text-base text-gray-900">
                          {att?.checkOut?.time ? new Date(att.checkOut.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                        <td className="px-6 py-4 text-base text-gray-900">
                          {att?.workHours != null ? att.workHours : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <motion.span
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${statusColors[att?.status]?.bg || "bg-gray-50"} ${statusColors[att?.status]?.text || "text-gray-600"} max-w-max border ${statusColors[att?.status]?.border || "border-gray-100"}`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {Icon && <Icon className="h-4 w-4 mr-1" />}
                            {att?.status || "-"}
                          </motion.span>
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
    </div>
  );
};

export default EmployeeAttendance;