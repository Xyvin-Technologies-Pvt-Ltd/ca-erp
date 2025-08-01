import React, { useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { createLeave, updateLeave, reviewLeave } from "../api/Leave";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { XMarkIcon, CalendarIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useState } from "react";
import moment from 'moment-timezone';



const validationSchema = Yup.object({
  leaveType: Yup.string().required("Leave type is required"),
  startDate: Yup.date().required("Start date is required"),
  endDate: Yup.date().required("End date is required"),
  reason: Yup.string().required("Reason is required"),
  status: Yup.string().required("Status is required"),
});

const LeaveModal = ({ leave, onClose, onSuccess }) => {
  const { user } = useAuth();
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false); 

  const formik = useFormik({
    initialValues: {
      leaveType: leave?.leaveType || "",
      startDate: leave?.startDate ? moment(leave.startDate).format('YYYY-MM-DD') : "",
      endDate: leave?.endDate ? moment(leave.endDate).format('YYYY-MM-DD') : "",
      reason: leave?.reason || "",
      status: leave?.status || "Pending",
      reviewNotes: leave?.reviewNotes || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          duration: Math.ceil(moment(values.endDate).diff(moment.tz(values.startDate), 'days')) + 1,
          employee: user?._id,
        };
        if (leave) {
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
      const start = moment(formik.values.startDate);
      const end = moment(formik.values.endDate);
      const durationInDays = Math.ceil(end.diff(start, 'days')) + 1;
      formik.setFieldValue("duration", durationInDays);
    }
    // eslint-disable-next-line
  }, [formik.values.startDate, formik.values.endDate]);

  const openDatePicker = (dateInputRef) => {
    if (dateInputRef.current) {
      dateInputRef.current.focus();
      dateInputRef.current.click();
      dateInputRef.current.showPicker?.();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };
const handleCancel = () => {
    setShowConfirmModal(true); 
  };

  const confirmDiscard = () => {
    setShowConfirmModal(false);
    onClose();
  };

  const cancelDiscard = () => {
    setShowConfirmModal(false);
  };

  const calculateDuration = () => {
    if (formik.values.startDate && formik.values.endDate) {
      const start = moment(formik.values.startDate);
      const end = moment(formik.values.endDate);
      const duration = Math.ceil(end.diff(start, 'days')) + 1;
      return duration > 0 ? duration : 0;
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"     onClick={handleCancel}>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden transform transition-all duration-300 scale-100 " onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-[#1c6ead] text-white p-3 rounded-lg shadow-sm">
                <DocumentTextIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {leave ? 'Edit Leave Request' : 'Submit Leave Request'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {leave ? 'Update your leave request details' : 'Fill in the details for your leave request'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
          <form onSubmit={formik.handleSubmit} className="p-6 space-y-8">
            {/* Leave Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Leave Details</h3>
                {calculateDuration() > 0 && (
                  <div className="flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-full">
                    <ClockIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      {calculateDuration()} day{calculateDuration() !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Leave Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="leaveType"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                    {...formik.getFieldProps("leaveType")}
                  >
                    <option value="">Select Leave Type</option>
                    <option value="Annual">Annual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Personal">Personal Leave</option>
                    <option value="Maternity">Maternity Leave</option>
                    <option value="Paternity">Paternity Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                    <option value="Other">Other Leave</option>
                  </select>
                  {formik.touched.leaveType && formik.errors.leaveType && (
                    <div className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="text-red-500 mr-1">⚠</span>
                      {formik.errors.leaveType}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                    {...formik.getFieldProps("status")}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  {formik.values.status && (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 border ${getStatusColor(formik.values.status)}`}>
                      {formik.values.status}
                    </div>
                  )}
                  {formik.touched.status && formik.errors.status && (
                    <div className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="text-red-500 mr-1">⚠</span>
                      {formik.errors.status}
                    </div>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={startDateRef}
                      onClick={() => openDatePicker(startDateRef)}
                      type="date"
                      name="startDate"
                      className="w-full px-4 py-3 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 cursor-pointer"
                      {...formik.getFieldProps("startDate")}
                    />
                  
                  </div>
                  {formik.touched.startDate && formik.errors.startDate && (
                    <div className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="text-red-500 mr-1">⚠</span>
                      {formik.errors.startDate}
                    </div>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={endDateRef}
                      type="date"
                      name="endDate"
                      onClick={() => openDatePicker(endDateRef)}
                      min={formik.values.startDate}
                      className="w-full px-4 py-3 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 cursor-pointer"
                      {...formik.getFieldProps("endDate")}
                    />
                    {/* <button
                      type="button"
                      onClick={() => openDatePicker(endDateRef)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#1c6ead] transition-colors duration-200"
                    >
                      <CalendarIcon className="h-5 w-5" />
                    </button> */}
                  </div>
                  {formik.touched.endDate && formik.errors.endDate && (
                    <div className="text-red-500 text-sm mt-1 flex items-center">
                      <span className="text-red-500 mr-1">⚠</span>
                      {formik.errors.endDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  rows={4}
                  maxLength={500}
                  placeholder="Please provide a detailed reason for your leave request..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 resize-none"
                  {...formik.getFieldProps("reason")}
                />
                <div className="flex justify-end items-center mt-2">
                  <p className={`text-sm ${formik.values.reason.length > 400 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {formik.values.reason.length}/500
                  </p>
                </div>
                {formik.touched.reason && formik.errors.reason && (
                  <div className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="text-red-500 mr-1">⚠</span>
                    {formik.errors.reason}
                  </div>
                )}
              </div>

              {/* Review Notes */}
              {(formik.values.status === "Approved" || formik.values.status === "Rejected") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes
                    <span className="text-gray-500 text-xs ml-1">(Optional)</span>
                  </label>
                  <textarea
                    name="reviewNotes"
                    rows={3}
                    maxLength={300}
                    placeholder={`Enter your ${formik.values.status.toLowerCase()} notes...`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 resize-none"
                    {...formik.getFieldProps("reviewNotes")}
                  />
                  <div className="flex justify-end items-center mt-2">
                    <p className={`text-sm ${formik.values.reviewNotes.length > 250 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {formik.values.reviewNotes.length}/300
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="px-6 py-3 bg-[#1c6ead] text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] disabled:from-blue-300 disabled:to-indigo-400 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none font-medium"
              >
                {formik.isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {leave ? 'Updating...' : 'Submitting...'}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={leave ? 'M5 13l4 4L19 7' : 'M12 4v16m8-8H4'} />
                    </svg>
                    {leave ? 'Update Request' : 'Submit Request'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
       {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Discard Changes?</h3>
              <button
                onClick={cancelDiscard}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to discard changes? Any unsaved changes will be lost.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDiscard}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDiscard}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 font-medium"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveModal;