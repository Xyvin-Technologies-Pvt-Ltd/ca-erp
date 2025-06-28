import { useEffect, useState } from "react";
import { getMyAttendance } from "../../api/attendance";
import { toast } from "react-hot-toast";

const statusColors = {
  Present: "bg-green-100 text-green-800",
  Absent: "bg-red-100 text-red-800",
  Late: "bg-yellow-100 text-yellow-800",
  'Half-Day': "bg-blue-100 text-blue-800",
  'Early-Leave': "bg-orange-100 text-orange-800",
  'On-Leave': "bg-purple-100 text-purple-800",
  Holiday: "bg-pink-100 text-pink-800",
  'Day-Off': "bg-gray-100 text-gray-800"
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
  const [selectedDate, setSelectedDate] = useState(null);

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

  // Map attendance by date for quick lookup
  const attendanceByDate = {};
  attendance.forEach(a => {
    const dateStr = a.date ? new Date(a.date).toISOString().split("T")[0] : null;
    if (dateStr) attendanceByDate[dateStr] = a;
  });

  const [year, month] = selectedMonth.split("-");
  const days = getDaysInMonth(Number(year), Number(month) - 1);
  const firstDayOfWeek = days[0].getDay();

  // Only show table rows for days with attendance
  const attendanceDays = days.filter(day => attendanceByDate[day.toISOString().split("T")[0]]);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500 text-sm">Present</div>
          <div className="text-2xl font-bold">{stats.present || 0}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500 text-sm">Absent</div>
          <div className="text-2xl font-bold">{stats.absent || 0}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500 text-sm">Late</div>
          <div className="text-2xl font-bold">{stats.late || 0}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500 text-sm">On-Leave</div>
          <div className="text-2xl font-bold">{stats.onLeave || 0}</div>
        </div>
      </div>
      {/* Calendar View */}
      <div className="mb-8">
        <div className="grid grid-cols-7 gap-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center font-semibold text-gray-500">{d}</div>
          ))}
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={"empty-"+i}></div>)}
          {days.map(day => {
            const dateStr = day.toISOString().split("T")[0];
            const att = attendanceByDate[dateStr];
            return (
              <button
                key={dateStr}
                className={`rounded p-2 w-full h-16 flex flex-col items-center justify-center border ${selectedDate === dateStr ? 'border-blue-600' : 'border-gray-200'} ${att ? statusColors[att.status] : 'bg-gray-50 text-gray-400'}`}
                onClick={() => att && setSelectedDate(dateStr)}
                disabled={!att}
              >
                <span className="font-bold">{day.getDate()}</span>
                <span className="text-xs">{att ? att.status : '-'}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Table for selected date (only if record exists) */}
      {selectedDate && attendanceByDate[selectedDate] && (
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Attendance Details for {selectedDate}</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Work Hours</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const att = attendanceByDate[selectedDate];
                return (
                  <tr>
                    <td className="px-4 py-2">{selectedDate}</td>
                    <td className="px-4 py-2">{att.checkIn?.time ? new Date(att.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="px-4 py-2">{att.checkOut?.time ? new Date(att.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="px-4 py-2">{att.workHours != null ? att.workHours : '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[att.status] || "bg-gray-100 text-gray-800"}`}>{att.status}</span>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}
      {/* Table for all days with attendance in month */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Work Hours</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceDays.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4">No attendance records this month</td></tr>
            ) : attendanceDays.map(day => {
              const dateStr = day.toISOString().split("T")[0];
              const att = attendanceByDate[dateStr];
              return (
                <tr key={dateStr}>
                  <td className="px-4 py-2">{dateStr}</td>
                  <td className="px-4 py-2">{att?.checkIn?.time ? new Date(att.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td className="px-4 py-2">{att?.checkOut?.time ? new Date(att.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td className="px-4 py-2">{att?.workHours != null ? att.workHours : '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[att?.status] || "bg-gray-100 text-gray-800"}`}>{att?.status || '-'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeAttendance;
