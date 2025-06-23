import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import LeaveModal from "../../components/LeaveModal";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";
import {
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
  reviewLeave,
} from "../../api/Leave";

const Leave = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, leave: null });

  const fetchLeavesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaves();
      setLeaves(data);
    } catch (err) {
      setError("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeavesData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircleIcon className="h-4 w-4 text-teal-600" />;
      case "Rejected":
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case "Pending":
        return <ClockIcon className="h-4 w-4 text-amber-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusStyle = (status) => {
    const statusMap = {
      Approved:
        "bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 border border-teal-200",
      Rejected:
        "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200",
      Pending:
        "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200",
    };
    return (
      statusMap[status] ||
      "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200"
    );
  };

  const handleEdit = (leave) => {
    setSelectedLeave(leave);
    setShowModal(true);
  };

  const handleDeleteClick = (leave) => {
    setDeleteModal({ isOpen: true, leave });
  };

  const handleDelete = async () => {
    if (!deleteModal.leave?._id) return;
    try {
      await deleteLeave(deleteModal.leave._id);
      toast.success("Leave request deleted successfully");
      fetchLeavesData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete leave request");
    } finally {
      setDeleteModal({ isOpen: false, leave: null });
    }
  };

  const handleAdd = () => {
    setSelectedLeave(null);
    setShowModal(true);
  };

  console.log(leaves, "leaves");

  return (
    <div className="space-y-8 min-h-screen">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl text-gray-900">Leave Requests</h1>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Leave Request
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-teal-600 mx-auto"></div>
              <p className="text-gray-500 font-medium">Loading leave requests...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-teal-50 to-white">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mx-auto">
                <XCircleIcon className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Error Loading Leave Requests</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mx-auto">
                <CalendarDaysIcon className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">No leave requests found</h3>
                <p className="text-gray-500 mt-1">Get started by creating your first leave request</p>
              </div>
              <button
                onClick={handleAdd}
                className="inline-flex items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Leave Request
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">End Date</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {leaves.map((leave, idx) => (
                  <tr key={leave._id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-sm font-normal text-gray-900 truncate">
                          {leave.employee ? leave.employee.name : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="text-sm font-normal text-gray-900">
                        {leave.leaveType?.charAt(0).toUpperCase() + leave.leaveType?.slice(1) || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="text-sm font-normal text-gray-900">
                        {leave.startDate ? new Date(leave.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="text-sm font-normal text-gray-900">
                        {leave.endDate ? new Date(leave.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-normal text-gray-900">
                          {leave.duration ? `${leave.duration} ${leave.duration === 1 ? "day" : "days"}` : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-normal shadow-sm ${getStatusStyle(leave.status)}`}>
                        {getStatusIcon(leave.status)}
                        <span className="ml-1.5">{leave.status || "Pending"}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(leave)}
                          className="group p-1.5 rounded-lg hover:bg-gray-50 transition-all duration-200"
                          title="Edit Leave Request"
                        >
                          <PencilIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(leave)}
                          className="group p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
                          title="Delete Leave Request"
                        >
                          <TrashIcon className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, leave: null })}
        onConfirm={handleDelete}
        title="Delete Leave Request"
        message={`Are you sure you want to delete this leave request for ${
          deleteModal.leave?.employee?.name || "Unknown"
        }? This action cannot be undone.`}
        itemName="leave request"
      />
      {showModal && (
        <LeaveModal
          leave={selectedLeave}
          onClose={() => {
            setShowModal(false);
            setSelectedLeave(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedLeave(null);
            fetchLeavesData();
          }}
        />
      )}
    </div>
  );
};

export default Leave;