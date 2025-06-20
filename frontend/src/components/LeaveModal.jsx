import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { createLeave, updateLeave, reviewLeave } from "../api/Leave";
import { toast } from "react-hot-toast";

const validationSchema = Yup.object({
  leaveType: Yup.string().required("Leave type is required"),
  startDate: Yup.date().required("Start date is required"),
  endDate: Yup.date().required("End date is required"),
  reason: Yup.string().required("Reason is required"),
  status: Yup.string().required("Status is required"),
});

const LeaveModal = ({ leave, onClose, onSuccess }) => {
  const formik = useFormik({
    initialValues: {
      leaveType: leave?.leaveType || "",
      startDate: leave?.startDate ? new Date(leave.startDate).toISOString().split("T")[0] : "",
      endDate: leave?.endDate ? new Date(leave.endDate).toISOString().split("T")[0] : "",
      reason: leave?.reason || "",
      status: leave?.status || "Pending",
      reviewNotes: leave?.reviewNotes || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          duration:
            Math.ceil((new Date(values.endDate) - new Date(values.startDate)) / (1000 * 60 * 60 * 24)) + 1,
        };
        if (leave) {
          // If status is being changed to Approved or Rejected, use reviewLeave
          if (
            values.status !== leave.status &&
            (values.status === "Approved" || values.status === "Rejected")
          ) {
            await reviewLeave(leave._id, {
              status: values.status,
              reviewNotes: values.reviewNotes,
            });
            toast.success(`Leave request ${values.status.toLowerCase()} successfully`);
          } else {
            await updateLeave(leave._id, payload);
            toast.success("Leave request updated successfully");
          }
        } else {
          await createLeave(payload);
          toast.success("Leave request submitted successfully");
        }
        onSuccess();
      } catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    },
  });

  useEffect(() => {
    if (formik.values.startDate && formik.values.endDate) {
      const start = new Date(formik.values.startDate);
      const end = new Date(formik.values.endDate);
      const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      formik.setFieldValue("duration", durationInDays);
    }
    // eslint-disable-next-line
  }, [formik.values.startDate, formik.values.endDate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">
          {leave ? "Edit Leave Request" : "Submit Leave Request"}
        </h2>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Leave Type</label>
            <select
              name="leaveType"
              className="w-full border rounded px-3 py-2"
              {...formik.getFieldProps("leaveType")}
            >
              <option value="">Select Type</option>
              <option value="Annual">Annual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Personal">Personal Leave</option>
              <option value="Maternity">Maternity Leave</option>
              <option value="Paternity">Paternity Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
              <option value="Other">Other Leave</option>
            </select>
            {formik.touched.leaveType && formik.errors.leaveType && (
              <div className="text-red-500 text-xs mt-1">{formik.errors.leaveType}</div>
            )}
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                className="w-full border rounded px-3 py-2"
                {...formik.getFieldProps("startDate")}
              />
              {formik.touched.startDate && formik.errors.startDate && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.startDate}</div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                className="w-full border rounded px-3 py-2"
                {...formik.getFieldProps("endDate")}
              />
              {formik.touched.endDate && formik.errors.endDate && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.endDate}</div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea
              name="reason"
              rows={3}
              className="w-full border rounded px-3 py-2"
              {...formik.getFieldProps("reason")}
            />
            {formik.touched.reason && formik.errors.reason && (
              <div className="text-red-500 text-xs mt-1">{formik.errors.reason}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              className="w-full border rounded px-3 py-2"
              {...formik.getFieldProps("status")}
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            {formik.touched.status && formik.errors.status && (
              <div className="text-red-500 text-xs mt-1">{formik.errors.status}</div>
            )}
          </div>
          {(formik.values.status === "Approved" || formik.values.status === "Rejected") && (
            <div>
              <label className="block text-sm font-medium mb-1">Review Notes</label>
              <textarea
                name="reviewNotes"
                rows={2}
                className="w-full border rounded px-3 py-2"
                {...formik.getFieldProps("reviewNotes")}
                placeholder={`Enter your ${formik.values.status.toLowerCase()} notes...`}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? "Saving..." : leave ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveModal; 