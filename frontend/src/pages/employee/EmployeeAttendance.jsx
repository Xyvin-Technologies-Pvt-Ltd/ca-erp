import { useEffect, useState } from "react";
import { getMyAttendance } from "../../api/attendance";
import { toast } from "react-hot-toast";

const statusColors = {
  Present: { bg: "bg-green-50", text: "text-green-600" },
  Absent: { bg: "bg-red-50", text: "text-red-600" },
  Late: { bg: "bg-yellow-50", text: "text-yellow-600" },
  'Half-Day': { bg: "bg-blue-50", text: "text-blue-600" },
  'Early-Leave': { bg: "bg-orange-50", text: "text-orange-600" },
  'On-Leave': { bg: "bg-purple-50", text: "text-purple-600" },
  Holiday: { bg: "bg-pink-50", text: "text-pink-600" },
  'Day-Off': { bg: "bg-gray-50", text: "text-gray-600" }
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
      toast.error("Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary counts for all statuses
  const statusList = [
    { key: 'Present', label: 'Present' },
    { key: 'On-Leave', label: 'On-Leave' },
    { key: 'Late', label: 'Late' },
    { key: 'Half-Day', label: 'Half-Day' },
    { key: 'Early-Leave', label: 'Early-Leave' },
    { key: 'Absent', label: 'Absent' },
    { key: 'Holiday', label: 'Holiday' },
    { key: 'Day-Off', label: 'Day-Off' },
  ];
  const statusCounts = {};
  attendance.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });

  // Map attendance by date for quick lookup
  const attendanceByDate = {};
  attendance.forEach(a => {
    const dateStr = a.date ? new Date(a.date).toISOString().split("T")[0] : null;
    if (dateStr) attendanceByDate[dateStr] = a;
  });

  const [year, month] = selectedMonth.split("-");
  const days = getDaysInMonth(Number(year), Number(month) - 1);
  const firstDayOfWeek = days[0].getDay();

  // Show all days with attendance (any status)
  const attendanceDays = days.filter(day => attendanceByDate[day.toISOString().split("T")[0]]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {statusList.map(s => (
          <div
            key={s.key}
            className="bg-white rounded-xl shadow-sm p-4 flex flex-col items-center"
          >
            <div className="text-gray-600 text-sm font-medium">{s.label}</div>
            <div className="text-2xl font-bold text-gray-900">{statusCounts[s.key] || 0}</div>
          </div>
        ))}
      </div>
      {/* Calendar View */}
      <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center font-semibold text-gray-600 text-sm">{d}</div>
          ))}
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={"empty-" + i} className="h-14"></div>
          ))}
          {days.map(day => {
            const dateStr = day.toISOString().split("T")[0];
            const att = attendanceByDate[dateStr];
            return (
              <div
                key={dateStr}
                className={`rounded-lg p-2 h-14 flex flex-col items-center justify-center ${
                  att ? `${statusColors[att.status]?.bg || 'bg-gray-50'} ${statusColors[att.status]?.text || 'text-gray-600'}` : 'bg-white text-gray-400'
                }`}
              >
                <span className="font-bold text-sm">{day.getDate()}</span>
                <span className="text-xs">{att ? att.status : '-'}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Table for all days with attendance in month */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Check In</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Check Out</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Work Hours</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceDays.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4 text-gray-600 text-base">No attendance records this month</td></tr>
            ) : (
              attendanceDays.map(day => {
                const dateStr = day.toISOString().split("T")[0];
                const att = attendanceByDate[dateStr];
                return (
                  <tr key={dateStr}>
                    <td className="px-6 py-4 text-base text-gray-900">{dateStr.split('-').reverse().join('/')}</td>
                    <td className="px-6 py-4 text-base text-gray-900">
                      {att?.checkIn?.time ? new Date(att.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-900">
                      {att?.checkOut?.time ? new Date(att.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-900">
                      {att?.workHours != null ? att.workHours : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${statusColors[att?.status]?.bg || 'bg-gray-50'} ${statusColors[att?.status]?.text || 'text-gray-600'}`}>
                        {att?.status || '-'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
      </div>
    </div>
  );
};

export default EmployeeAttendance;