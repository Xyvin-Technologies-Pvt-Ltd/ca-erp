import { useEffect, useState } from "react";
import { getAttendance, getAttendanceStats, deleteAttendance } from "../../api/attendance";
import AttendanceModal from "../../components/AttendanceModal";
import AttendanceEditModal from "../../components/AttendanceEditModal";
import { toast } from "react-hot-toast";
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const tableStatusColors = {
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
      console.log(statsRes, "hjhjjh");
      setStats(statsRes.data || {});
    } catch (e) {
      toast.error("Failed to fetch attendance data");
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

  const sortedAttendance = [...attendance].sort((a, b) => new Date(a.date) - new Date(b.date));

  console.log(attendance, "attendance");

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <div className="flex gap-2 items-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            onClick={() => setModalOpen(true)}
          >
            Add Bulk Attendance
          </button>
        </div>
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
      {/* Attendance Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Check In</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Check Out</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-base text-gray-600">Loading...</td></tr>
            ) : sortedAttendance.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-base text-gray-600">No records found</td></tr>
            ) : (
              sortedAttendance.map((a) => (
                <tr key={a._id}>
                  <td className="px-6 py-4 text-base text-gray-900">{a.employee?.name || a.employee?.firstName || "-"}</td>
                  <td className="px-6 py-4 text-base text-gray-900">{a.employee?.department?.name || a.employee?.department || "-"}</td>
                  <td className="px-6 py-4 text-base text-gray-900">{a.date ? new Date(a.date).toLocaleDateString('en-GB') : "-"}</td>
                  <td className="px-6 py-4 text-base text-gray-900">
                    {a.checkIn?.time ? new Date(a.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                  </td>
                  <td className="px-6 py-4 text-base text-gray-900">
                    {a.checkOut?.time ? new Date(a.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${tableStatusColors[a.status]?.bg || 'bg-gray-50'} ${tableStatusColors[a.status]?.text || 'text-gray-600'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setEditModal({ open: true, record: a })}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <AttendanceModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); fetchData(); }} />
      )}
      {editModal.open && (
        <AttendanceEditModal attendance={editModal.record} onClose={() => setEditModal({ open: false, record: null })} onSuccess={() => { setEditModal({ open: false, record: null }); fetchData(); }} />
      )}
    </div>
  );
};

export default Attendance;