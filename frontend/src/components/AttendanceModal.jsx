import { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { createBulkAttendance } from "../api/attendance";
import { userApi } from "../api/userApi";

const AttendanceModal = ({ isOpen, onClose, onSuccess, attendance }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].slice(0, 5),
    type: "checkIn",
    status: "Present",
    shift: "Morning",
    notes: "",
    selectedEmployees: [],
  });
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const statusIcons = {
    Present: <CheckIcon className="h-4 w-4 text-green-800" />,
    Late: <ClockIcon className="h-4 w-4 text-amber-800" />,
    "Early-Leave": <ArrowRightOnRectangleIcon className="h-4 w-4 text-orange-800" />,
    "Half-Day": <CalendarDaysIcon className="h-4 w-4 text-blue-800" />,
    "On-Leave": <PaperAirplaneIcon className="h-4 w-4 text-purple-800" />,
    Absent: <XMarkIcon className="h-4 w-4 text-red-800" />,
    Holiday: <CalendarDaysIcon className="h-4 w-4 text-pink-800" />,
    "Day-Off": <MoonIcon className="h-4 w-4 text-gray-800" />,
  };

  const getDefaultNotes = (status) => {
    switch (status) {
      case "Late": return "Employee arrived late";
      case "Early-Leave": return "Employee left early";
      case "Half-Day": return "Half day attendance";
      case "On-Leave": return "Employee on leave";
      case "Absent": return "Employee absent";
      case "Holiday": return "Holiday";
      case "Day-Off": return "Scheduled day off";
      default: return "";
    }
  };

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await userApi.getAllUsers({ limit: 1000 });
        const employees = res.data || [];
        setActiveEmployees(employees);
        setFilteredEmployees(employees);
      } catch (error) {
        toast.error("Failed to load employees");
      }
    };
    loadEmployees();
  }, []);

  useEffect(() => {
    if (attendance) {
      setFormData({
        date: attendance.date ? new Date(attendance.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        time: attendance[attendance.type]?.time
          ? new Date(attendance[attendance.type].time).toTimeString().split(" ")[0].slice(0, 5)
          : new Date().toTimeString().split(" ")[0].slice(0, 5),
        type: attendance.type || "checkIn",
        status: attendance.status || "Present",
        shift: attendance.shift || "Morning",
        notes: attendance.notes || "",
        selectedEmployees: attendance.employee ? [attendance.employee.id] : [],
      });
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().split(" ")[0].slice(0, 5),
        type: "checkIn",
        status: "Present",
        shift: "Morning",
        notes: "",
        selectedEmployees: [],
      });
    }
    setErrors({});
  }, [attendance, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "status" && { notes: value ? getDefaultNotes(value) : prev.notes }),
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEmployeeSelection = (employeeId, checked) => {
    const newSelected = checked
      ? [...formData.selectedEmployees, employeeId]
      : formData.selectedEmployees.filter((id) => id !== employeeId);
    setFormData((prev) => ({ ...prev, selectedEmployees: newSelected }));
    setErrors((prev) => ({ ...prev, selectedEmployees: "" }));
  };

  const handleSelectAll = (checked) => {
    setFormData((prev) => ({
      ...prev,
      selectedEmployees: checked ? activeEmployees.map((emp) => emp._id) : [],
    }));
    setErrors((prev) => ({ ...prev, selectedEmployees: "" }));
  };

  const handleEmployeeSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setFilteredEmployees(
      searchTerm
        ? activeEmployees.filter(
            (emp) =>
              emp.name?.toLowerCase().includes(searchTerm) ||
              emp.employeeId?.toLowerCase().includes(searchTerm)
          )
        : activeEmployees
    );
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.type) newErrors.type = "Type is required";
    if (!formData.status) newErrors.status = "Status is required";
    if (!formData.shift) newErrors.shift = "Shift is required";
    if (formData.selectedEmployees.length === 0) newErrors.selectedEmployees = "Select at least one employee";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const attendanceData = formData.selectedEmployees.map((employeeId) => ({
        employee: employeeId,
        date: formData.date,
        [formData.type]: { time: new Date(`${formData.date}T${formData.time}`) },
        status: formData.status,
        shift: formData.shift,
        notes: formData.notes || getDefaultNotes(formData.status),
      }));
      await createBulkAttendance(attendanceData);
      toast.success("Attendance recorded successfully");
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to record attendance");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
          <h2 className="text-2xl font-semibold text-gray-800">Record Bulk Attendance</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="max-h-[70vh] overflow-y-auto px-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
                />
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
                />
                {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
                >
                  <option value="checkIn">Check In</option>
                  <option value="checkOut">Check Out</option>
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
                >
                  {Object.keys(statusIcons).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shift <span className="text-red-500">*</span>
                </label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                  <option value="Night">Night</option>
                </select>
                {errors.shift && <p className="mt-1 text-sm text-red-600">{errors.shift}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter notes..."
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
                />
                {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Employees <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Search employees..."
                  onChange={handleEmployeeSearch}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
                />
                <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-300 p-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={formData.selectedEmployees.length === activeEmployees.length && activeEmployees.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                      Select All
                    </label>
                  </div>
                  {filteredEmployees.map((employee) => (
                    <div key={employee._id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id={`employee-${employee._id}`}
                        checked={formData.selectedEmployees.includes(employee._id)}
                        onChange={(e) => handleEmployeeSelection(employee._id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`employee-${employee._id}`}
                        className="text-sm text-gray-700"
                      >
                        {employee.name} ({employee.employeeId || "No ID"})
                      </label>
                    </div>
                  ))}
                </div>
                {errors.selectedEmployees && (
                  <p className="mt-1 text-sm text-red-600">{errors.selectedEmployees}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Record Attendance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceModal;