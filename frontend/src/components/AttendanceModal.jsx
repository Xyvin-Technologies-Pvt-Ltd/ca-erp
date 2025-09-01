import { useState, useEffect } from "react";
import {
  X,
  CheckIcon,
  ClockIcon,
  AirplayIcon as PaperAirplaneIcon,
  ArrowRightCircleIcon as ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  MoonIcon,
  TriangleIcon as ExclamationTriangleIcon,
} from "lucide-react";
import { createBulkAttendance, getAttendance } from "../api/attendance";
import { userApi } from "../api/userApi";
import moment from "moment-timezone";

moment.tz.setDefault("UTC");

const AttendanceModal = ({ isOpen, onClose, onSuccess, attendance }) => {
  const [formData, setFormData] = useState({
    date: (() => {
      const now = moment.tz("UTC");
      return now.format("YYYY-MM-DD");
    })(),
    time: moment.tz("UTC").format("HH:mm"),
    type: "checkIn",
    status: "Present",
    shift: "Morning",
    notes: "",
    selectedEmployees: [],
  });
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false); // New state for popup

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const currentDate = `${year}-${month}-${day}`;
  console.log("Current Date: form modal", currentDate);

  const statusIcons = {
    Present: <CheckIcon className="h-4 w-4 text-green-800" />,
    Late: <ClockIcon className="h-4 w-4 text-amber-800" />,
    "Early-Leave": (
      <ArrowRightOnRectangleIcon className="h-4 w-4 text-orange-800" />
    ),
    "Half-Day": <CalendarDaysIcon className="h-4 w-4 text-blue-800" />,
    "On-Leave": <PaperAirplaneIcon className="h-4 w-4 text-purple-800" />,
    Absent: <X className="h-4 w-4 text-red-800" />,
    Holiday: <CalendarDaysIcon className="h-4 w-4 text-pink-800" />,
    "Day-Off": <MoonIcon className="h-4 w-4 text-gray-800" />,
  };

  // Statuses that don't require check-in/check-out
  const nonWorkingStatuses = ["On-Leave", "Absent", "Holiday", "Day-Off"];

  // Statuses that require check-in/check-out
  const workingStatuses = ["Present", "Late", "Early-Leave", "Half-Day"];

  const getDefaultNotes = (status) => {
    switch (status) {
      case "Late":
        return "Employee arrived late";
      case "Early-Leave":
        return "Employee left early";
      case "Half-Day":
        return "Half day attendance";
      case "On-Leave":
        return "Employee on leave";
      case "Absent":
        return "Employee absent";
      case "Holiday":
        return "Holiday";
      case "Day-Off":
        return "Scheduled day off";
      default:
        return "";
    }
  };

  // Helper function to check if two dates are the same day
  const isSameDate = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await userApi.getAllUsers({ limit: 1000 });
        const employees = res.data || [];
        setActiveEmployees(employees);
        setFilteredEmployees(employees);
      } catch (error) {
        console.error("Failed to load employees:", error);
      }
    };
    loadEmployees();
  }, []);

  // Fetch existing attendance for the selected date
  useEffect(() => {
    const fetchExistingAttendance = async () => {
      if (!formData.date) return;

      setLoadingExisting(true);
      try {
        const response = await getAttendance({
          startDate: formData.date,
        });

        const allAttendance = response.data?.attendance || [];

        const filteredAttendance = allAttendance.filter((attendance) => {
          return isSameDate(attendance.date, formData.date);
        });

        setExistingAttendance(filteredAttendance);
      } catch (error) {
        console.error("Failed to fetch existing attendance:", error);
        setExistingAttendance([]);
      } finally {
        setLoadingExisting(false);
      }
    };

    fetchExistingAttendance();
  }, [formData.date]);

  // Get existing attendance record for employee
  const getExistingAttendanceRecord = (employeeId) => {
    return existingAttendance.find(
      (attendance) =>
        attendance.employee?._id === employeeId ||
        attendance.employee?.id === employeeId ||
        attendance.employee === employeeId
    );
  };

  // Check if employee can be selected based on current form type and status
  const canSelectEmployee = (employeeId) => {
    const existingRecord = getExistingAttendanceRecord(employeeId);

    // If no existing record, can select for any type/status
    if (!existingRecord) {
      return true;
    }

    const currentType = formData.type;
    const currentStatus = formData.status;

    // For non-working statuses, employee shouldn't be selected if they already have any record
    if (nonWorkingStatuses.includes(currentStatus)) {
      return false;
    }

    // For working statuses
    if (workingStatuses.includes(currentStatus)) {
      // If trying to do checkIn
      if (currentType === "checkIn") {
        // Can't select if already has checkIn or if status is non-working
        return (
          existingRecord.checkIn.times.length === 0 &&
          !nonWorkingStatuses.includes(existingRecord.status)
        );
      }

      // If trying to do checkOut
      if (currentType === "checkOut") {
        // Can only select if has checkIn but no checkOut, and status is working
        return (
          existingRecord.checkIn.times.length > 0 &&
          existingRecord.checkOut.times.length === 0 &&
          workingStatuses.includes(existingRecord.status)
        );
      }
    }

    return false;
  };

  // Get the reason why employee can't be selected
  const getEmployeeSelectionStatus = (employeeId) => {
    const existingRecord = getExistingAttendanceRecord(employeeId);
    console.log(existingRecord);
    if (formData.type === "checkOut") {
      if (existingRecord === undefined) {
        return { canSelect: false, reason: "No check-in record found" };
      }
    }
    if (!existingRecord) {
      return { canSelect: true, reason: null };
    }

    const currentType = formData.type;
    const currentStatus = formData.status;

    // For non-working statuses
    if (nonWorkingStatuses.includes(currentStatus)) {
      return {
        canSelect: false,
        reason: `Already marked (${existingRecord.status})`,
      };
    }

    // For working statuses
    if (workingStatuses.includes(currentStatus)) {
      if (currentType === "checkIn") {
        if (existingRecord.checkIn.times.length > 0) {
          return {
            canSelect: false,
            reason: `Check-in already marked (${existingRecord.status})`,
          };
        }
        if (nonWorkingStatuses.includes(existingRecord.status)) {
          return {
            canSelect: false,
            reason: `Marked as ${existingRecord.status}`,
          };
        }
      }
      if (currentType === "checkOut") {
        if (
          existingRecord === undefined ||
          existingRecord.checkIn.times.length === 0
        ) {
          return {
            canSelect: false,
            reason: "No check-in record found",
          };
        }
        if (existingRecord.checkOut.times.length > 0) {
          return {
            canSelect: false,
            reason: "Check-out already marked",
          };
        }
        if (nonWorkingStatuses.includes(existingRecord.status)) {
          return {
            canSelect: false,
            reason: `Marked as ${existingRecord.status}`,
          };
        }
      }
    }

    return { canSelect: true, reason: null };
  };

  // Remove employees who can't be selected when type or status changes
  useEffect(() => {
    if (existingAttendance.length > 0) {
      setFormData((prev) => ({
        ...prev,
        selectedEmployees: prev.selectedEmployees.filter((employeeId) =>
          canSelectEmployee(employeeId)
        ),
      }));
    }
  }, [formData.type, formData.status, existingAttendance]);

  useEffect(() => {
    if (attendance) {
      setFormData({
        date: attendance.date
          ? new Date(attendance.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        time: attendance[attendance.type]?.time
          ? new Date(attendance[attendance.type].time)
              .toTimeString()
              .split(" ")[0]
              .slice(0, 5)
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
      ...(name === "status" && {
        notes: value ? getDefaultNotes(value) : prev.notes,
      }),
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEmployeeSelection = (employeeId, checked) => {
    // Check if employee can be selected
    if (!canSelectEmployee(employeeId)) {
      return;
    }
    console.log(formData);
    const newSelected = checked
      ? [...formData.selectedEmployees, employeeId]
      : formData.selectedEmployees.filter((id) => id !== employeeId);
    setFormData((prev) => ({ ...prev, selectedEmployees: newSelected }));
    setErrors((prev) => ({ ...prev, selectedEmployees: "" }));
  };

  const handleSelectAll = (checked) => {
    // Only select employees who can be selected
    const availableEmployees = activeEmployees
      .filter((emp) => canSelectEmployee(emp._id))
      .map((emp) => emp._id);

    setFormData((prev) => ({
      ...prev,
      selectedEmployees: checked ? availableEmployees : [],
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
    if (formData.selectedEmployees.length === 0)
      newErrors.selectedEmployees = "Select at least one employee";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const attendanceData = formData.selectedEmployees.map((employeeId) => {
        // Create date and time using moment in UTC timezone
        const [year, month, day] = formData.date.split("-").map(Number);
        const [hours, minutes] = formData.time.split(":").map(Number);

        // Create attendance date-time in UTC
        const attendanceDateTime = moment.tz(
          [year, month - 1, day, hours, minutes],
          "UTC"
        );

        // Create date-only object (start of day in UTC)
        const dateOnly = moment
          .tz([year, month - 1, day], "UTC")
          .startOf("day");

        return {
          employee: employeeId,
          date: dateOnly.toISOString(), // Send as ISO string in UTC
          [formData.type]: { time: attendanceDateTime.toISOString() }, // Send as ISO string in UTC
          status: formData.status,
          shift: formData.shift,
          notes: formData.notes || getDefaultNotes(formData.status),
        };
      });

      await createBulkAttendance(attendanceData);
      onSuccess();
    } catch (error) {
      console.error("Failed to record attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(true); // Show popup
  };

  const confirmDiscard = () => {
    setShowConfirmModal(false);
    onClose();
  };

  const cancelDiscard = () => {
    setShowConfirmModal(false);
  };

  if (!isOpen) return null;

  const availableEmployeesCount = activeEmployees.filter((emp) =>
    canSelectEmployee(emp._id)
  ).length;
  const existingAttendanceCount = existingAttendance.length;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
          <h2 className="text-2xl font-semibold text-gray-800">
            Record Bulk Attendance
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {formData.date && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">
                Selected Date:{" "}
                <strong>{new Date(formData.date).toLocaleDateString()}</strong>
              </span>
              <span className="text-blue-600">
                {loadingExisting
                  ? "Checking..."
                  : ` ${availableEmployeesCount} records available for ${formData.type}`}
              </span>
            </div>
          </div>
        )}

        {/* {formData.type && formData.status && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <span className="font-medium">Selection Rule:</span>
              {nonWorkingStatuses.includes(formData.status) ? (
                <span>Only employees without any attendance record can be selected for {formData.status}</span>
              ) : (
                <span>
                  {formData.type === "checkIn" 
                    ? "Only employees without check-in can be selected" 
                    : "Only employees with check-in but no check-out can be selected"
                  }
                </span>
              )}
            </div>
          </div>
        )} */}

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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-[#1c6ead]"
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time}</p>
              )}
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
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-[#1c6ead]"
              >
                <option value="checkIn">Check In</option>
                <option value="checkOut">Check Out</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
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
                {Object.keys(statusIcons).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
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
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
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
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Employees <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Search employees..."
                onChange={handleEmployeeSearch}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-[#1c6ead]"
              />
              <div className="mt-2 max-h-60 overflow-y-auto rounded-md border border-gray-300 p-2">
                {!loadingExisting && availableEmployeesCount > 0 && (
                  <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-200">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={
                        formData.selectedEmployees.length ===
                          availableEmployeesCount && availableEmployeesCount > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-[#1c6ead]"
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium text-gray-700"
                    >
                      Select All Available ({availableEmployeesCount})
                    </label>
                  </div>
                )}

                {loadingExisting ? (
                  <div className="text-center py-4 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm">
                      Checking existing attendance...
                    </p>
                  </div>
                ) : (
                  filteredEmployees.map((employee) => {
                    const selectionStatus = getEmployeeSelectionStatus(
                      employee._id
                    );
                    const canSelect = selectionStatus.canSelect;
                    const reason = selectionStatus.reason;
                    console.log(selectionStatus);
                    return (
                      <div
                        key={employee._id}
                        className={`flex items-center space-x-2 py-2 px-2 rounded ${
                          !canSelect ? "bg-gray-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={`employee-${employee._id}`}
                          checked={formData.selectedEmployees.includes(
                            employee._id
                          )}
                          onChange={(e) =>
                            handleEmployeeSelection(
                              employee._id,
                              e.target.checked
                            )
                          }
                          disabled={!canSelect}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-[#1c6ead] disabled:opacity-50"
                        />
                        <label
                          htmlFor={`employee-${employee._id}`}
                          className={`text-sm flex-1 ${
                            !canSelect ? "text-gray-400" : "text-gray-700"
                          }`}
                        >
                          {employee.name} ({employee.employeeId || "No ID"})
                        </label>
                        {!canSelect && reason && (
                          <div className="flex items-center space-x-1">
                            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                            <span className="text-xs text-amber-600 font-medium">
                              {reason}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              {errors.selectedEmployees && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.selectedEmployees}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.selectedEmployees.length === 0}
              className="px-4 py-2 rounded-md bg-[#1c6ead] text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Saving..."
                : `Record ${
                    formData.type === "checkIn" ? "Check-In" : "Check-Out"
                  } (${formData.selectedEmployees.length})`}
            </button>
          </div>
        </form>

        {/* Confirmation Popup */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Discard Changes?
                </h3>
                <button
                  onClick={cancelDiscard}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to discard changes? Any unsaved changes
                will be lost.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDiscard}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDiscard}
                  className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceModal;
