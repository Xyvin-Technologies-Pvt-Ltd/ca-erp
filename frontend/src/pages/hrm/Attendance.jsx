import { useEffect, useState } from "react";
import { getAttendance, getAttendanceStats, deleteAttendance } from "../../api/attendance";
import AttendanceModal from "../../components/AttendanceModal";
import AttendanceEditModal from "../../components/AttendanceEditModal";
import { toast } from "react-hot-toast";
import { PencilSquareIcon } from '@heroicons/react/24/outline';

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
      setStats(statsRes.data?.stats || {});
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

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <div className="flex gap-2 items-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => setModalOpen(true)}
          >
            Add Bulk Attendance
          </button>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500 text-sm">Total Employees</div>
          <div className="text-2xl font-bold">{stats.totalEmployees || 0}</div>
        </div>
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
      {/* Attendance Table */}
      <div className="overflow-x-auto bg-white rounded shadow max-h-[60vh]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
            ) : attendance.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8">No records found</td></tr>
            ) : (
              attendance.map((a) => (
                <tr key={a._id}>
                  <td className="px-4 py-2">{a.employee?.name || a.employee?.firstName || "-"}</td>
                  <td className="px-4 py-2">{a.employee?.department?.name || a.employee?.department || "-"}</td>
                  <td className="px-4 py-2">{a.employee?.position?.title || a.employee?.position || "-"}</td>
                  <td className="px-4 py-2">{a.date ? new Date(a.date).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-2">{a.checkIn?.time ? new Date(a.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</td>
                  <td className="px-4 py-2">{a.checkOut?.time ? new Date(a.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[a.status] || "bg-gray-100 text-gray-800"}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button className="text-blue-600 hover:underline flex items-center" onClick={() => setEditModal({ open: true, record: a })} title="Edit"><PencilSquareIcon className="h-5 w-5"/></button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(a._id)}>Delete</button>
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
