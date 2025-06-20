import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import useHrmStore from '../stores/useHrmStore';
import toast from 'react-hot-toast';

const LeaveModal = ({ isOpen, onClose, onSuccess, leave }) => {
  const { createLeave, updateLeave, reviewLeave } = useHrmStore();
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'Pending',
    duration: 1,
    reviewNotes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (leave) {
      setFormData({
        leaveType: leave.leaveType || '',
        startDate: leave.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : '',
        endDate: leave.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : '',
        reason: leave.reason || '',
        status: leave.status || 'Pending',
        duration: leave.duration || 1,
        reviewNotes: leave.reviewNotes || '',
      });
    } else {
      setFormData({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
        status: 'Pending',
        duration: 1,
        reviewNotes: '',
      });
    }
  }, [leave, isOpen]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      setFormData((prev) => ({ ...prev, duration: durationInDays }));
    }
  }, [formData.startDate, formData.endDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (leave) {
        if (formData.status !== leave.status && (formData.status === 'Approved' || formData.status === 'Rejected')) {
          await reviewLeave(leave._id, { status: formData.status, reviewNotes: formData.reviewNotes });
          toast.success(`Leave request ${formData.status.toLowerCase()} successfully`);
        } else {
          await updateLeave(leave._id, formData);
          toast.success('Leave request updated successfully');
        }
      } else {
        await createLeave(formData);
        toast.success('Leave request submitted successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6 ">
          <h2 className="text-2xl font-semibold text-gray-800">{leave ? 'Edit Leave Request' : 'Add Leave Request'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Leave Type</label>
              <select name="leaveType" value={formData.leaveType} onChange={handleChange} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2">
                <option value="">Select Type</option>
                <option value="Annual">Annual Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Personal">Personal Leave</option>
                <option value="Maternity">Maternity Leave</option>
                <option value="Paternity">Paternity Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2">
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
              <input type="number" name="duration" value={formData.duration} disabled className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea name="reason" value={formData.reason} onChange={handleChange} rows="3" required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"></textarea>
            </div>
            {(formData.status === 'Approved' || formData.status === 'Rejected') && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Review Notes</label>
                <textarea name="reviewNotes" value={formData.reviewNotes} onChange={handleChange} rows="3" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"></textarea>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : leave ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveModal; 