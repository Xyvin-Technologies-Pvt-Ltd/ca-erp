import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import useHrmStore from '../../stores/useHrmStore';
import LeaveModal from '../../components/LeaveModal';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';

const Leave = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, leave: null });
  const { leaves, leavesLoading, leavesError, fetchLeaves, deleteLeave } = useHrmStore();

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleEdit = (leave) => { setSelectedLeave(leave); setShowModal(true); };
  const handleDeleteClick = (leave) => { setDeleteModal({ isOpen: true, leave }); };
  const handleDelete = async () => {
    if (!deleteModal.leave?._id) return;
    try {
      await deleteLeave(deleteModal.leave._id);
      toast.success('Leave request deleted successfully');
      fetchLeaves();
    } catch (error) {
      toast.error(error.message || 'Failed to delete leave request');
    } finally {
      setDeleteModal({ isOpen: false, leave: null });
    }
  };
  const handleAdd = () => { setSelectedLeave(null); setShowModal(true); };

  if (leavesLoading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>);
  if (leavesError) return (<div className="flex items-center justify-center h-64 text-red-600">{leavesError}</div>);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Leave Requests</h1>
        <button onClick={handleAdd} className="inline-flex items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"><PlusIcon className="h-5 w-5 mr-2" />Add Leave</button>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaves.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No leave requests found. Add your first leave!</td></tr>
            ) : (
              leaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leave.employee ? `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}` : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{leave.leaveType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.startDate ? new Date(leave.startDate).toLocaleDateString() : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.endDate ? new Date(leave.endDate).toLocaleDateString() : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.duration}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' : leave.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{leave.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button onClick={() => handleEdit(leave)} className="text-blue-600 hover:text-blue-900"><PencilIcon className="h-5 w-5" /></button>
                      <button onClick={() => handleDeleteClick(leave)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <LeaveModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedLeave(null); }}
        onSuccess={() => { setShowModal(false); setSelectedLeave(null); fetchLeaves(); }}
        leave={selectedLeave}
      />
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, leave: null })}
        onConfirm={handleDelete}
        title="Delete Leave Request"
        message={`Are you sure you want to delete this leave request? This action cannot be undone.`}
        itemName="leave request"
      />
    </div>
  );
};

export default Leave; 