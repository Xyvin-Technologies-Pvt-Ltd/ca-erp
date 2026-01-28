import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

import { updateAttendance } from "../api/attendance";

const AttendanceEditModal = ({ attendance, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: "",
    checkIn: "",
    checkOut: "",
    status: "Present",

    notes: "",
    shift: "Morning",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Helper function to format date without timezone issues
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Use local date components to avoid timezone conversion
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to format time without timezone issues
  const formatTimeForInput = (timeString) => {
    if (!timeString) return "";
    const date = new Date(timeString);

    const minus5h30 = new Date(date.getTime() - (5 * 60 + 30) * 60 * 1000);
    // Use local time components to avoid timezone conversion
    const hours = String(minus5h30.getHours()).padStart(2, "0");
    const minutes = String(minus5h30.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  useEffect(() => {
    if (attendance) {
      setFormData({
        date: formatDateForInput(attendance.date),
        checkIn: attendance.checkIn?.times[0]
          ? formatTimeForInput(attendance.checkIn.times[0])
          : "",
        checkOut: attendance.checkOut?.times[
          attendance.checkOut?.times.length - 1
        ]
          ? formatTimeForInput(
            attendance.checkOut.times[attendance.checkOut?.times.length - 1]
          )
          : "",
        status: attendance.status || "Present",

        notes: attendance.notes || "",
        shift: attendance.shift || "Morning",
      });
      setErrors({});
    }
  }, [attendance]);

  useEffect(() => {
    if (formData.checkIn && formData.checkOut && formData.date) {
      const parseTime = (time) => {
        const [hours, minutes] = time.split(":");
        const dateObj = new Date(formData.date);
        dateObj.setHours(parseInt(hours), parseInt(minutes), 0);
        return dateObj;
      };
      const checkIn = parseTime(formData.checkIn);
      const checkOut = parseTime(formData.checkOut);
      const workHours = Math.max(
        0,
        Math.round(((checkOut - checkIn) / (1000 * 60 * 60)) * 100) / 100
      );

      let status = "Absent";
      const startTime = new Date(checkIn).setHours(9, 0, 0, 0);

      if (checkIn > startTime) status = "Late";
      else if (workHours >= 8) status = "Present";
      else if (workHours >= 4) status = "Half-Day";
      else if (workHours > 0) status = "Early-Leave";

      setFormData((prev) => ({ ...prev, status }));
    }
  }, [formData.checkIn, formData.checkOut, formData.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.status) newErrors.status = "Status is required";
    if (!formData.shift) newErrors.shift = "Shift is required";
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
      const parseDateTime = (time) => {
        if (!time) return null;
        const [hours, minutes] = time.split(":");
        const dateObj = new Date(formData.date);
        dateObj.setHours(parseInt(hours), parseInt(minutes), 0);
        return dateObj;
      };

      const checkInDateTime = parseDateTime(formData.checkIn);
      const checkOutDateTime = parseDateTime(formData.checkOut);
      const workHours =
        checkInDateTime && checkOutDateTime
          ? Math.max(
            0,
            Math.round(
              ((checkOutDateTime - checkInDateTime) / (1000 * 60 * 60)) * 100
            ) / 100
          )
          : 0;

      await updateAttendance(attendance._id, {
        date: formData.date,
        checkIn: checkInDateTime
          ? { time: checkInDateTime, device: "Web" }
          : undefined,
        checkOut: checkOutDateTime
          ? { time: checkOutDateTime, device: "Web" }
          : undefined,
        status: formData.status,
        notes: formData.notes,
        shift: formData.shift,
        workHours,

      });

      toast.success("Attendance updated successfully");
      onSuccess();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update attendance"
      );
      toast.error(
        error.response?.data?.message || "Failed to update attendance"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!attendance) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-semibold text-gray-800">
            Edit Attendance
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {attendance.employee && (
          <div className="mb-6 rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">
              {attendance.employee.firstName} {attendance.employee.lastName}
            </p>
            <p className="text-sm text-gray-500">
              {attendance.employee.department?.name} •{" "}
              {attendance.employee.position?.title}
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-[#1c6ead]"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Check In Time
              </label>
              <input
                type="time"
                name="checkIn"
                value={formData.checkIn}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-[#1c6ead]"
              />
              {errors.checkIn && (
                <p className="mt-1 text-sm text-red-600">{errors.checkIn}</p>
              )}
              {errors.checkIn && (
                <p className="mt-1 text-sm text-red-600">{errors.checkIn}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Check Out Time
              </label>
              <input
                type="time"
                name="checkOut"
                value={formData.checkOut}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-[#1c6ead]"
              />
              {errors.checkOut && (
                <p className="mt-1 text-sm text-red-600">{errors.checkOut}</p>
              )}
              {errors.checkOut && (
                <p className="mt-1 text-sm text-red-600">{errors.checkOut}</p>
              )}
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-[#1c6ead]"
              >
                {["Present", "Absent", "Half-Day", "Late", "Early-Leave"].map(
                  (opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  )
                )}
                {["Present", "Absent", "Half-Day", "Late", "Early-Leave"].map(
                  (opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  )
                )}
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-[#1c6ead]"
              >
                {["Morning", "Evening", "Night"].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors.shift && (
                <p className="mt-1 text-sm text-red-600">{errors.shift}</p>
              )}
              {errors.shift && (
                <p className="mt-1 text-sm text-red-600">{errors.shift}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Enter notes..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-[#1c6ead]"
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
              )}
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
              )}
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
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceEditModal;