import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import LeaveModal from "../../components/LeaveModal";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
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
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case "Rejected":
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case "Pending":
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
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

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
        <Button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Leave Request
        </Button>
      </div>

      <Card className=" bg-white shadow-md rounded-xl border-0">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
              <p className="text-gray-500 font-medium">Loading leave requests...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
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
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <CalendarIcon className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">No leave requests found</h3>
                <p className="text-gray-500 mt-1">Get started by creating your first leave request</p>
              </div>
              <Button
                onClick={handleAdd}
                className="inline-flex items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Leave Request
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave, idx) => (
                  <tr key={leave._id || idx}>
                    <td className="px-4 py-4 text-sm">
                      <span className="font-semibold text-gray-900 truncate">
                        {leave.employee ? leave.employee.name : "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="font-semibold text-gray-900">
                        {leave.leaveType?.charAt(0).toUpperCase() + leave.leaveType?.slice(1) || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="text-sm text-gray-900">
                        {leave.startDate
                          ? new Date(leave.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "2-digit",
                            })
                          : "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="text-sm text-gray-900">
                        {leave.endDate
                          ? new Date(leave.endDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "2-digit",
                            })
                          : "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-gray-900">
                          {leave.duration ? `${leave.duration} ${leave.duration === 1 ? "day" : "days"}` : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          leave.status
                        )}`}
                      >
                        {getStatusIcon(leave.status)}
                        <span>{leave.status || "Pending"}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline-none"
                          onClick={() => handleEdit(leave)}
                          className="p-1 rounded-md hover:bg-gray-200 transition-all duration-200"
                          title={`Edit ${leave.leaveType} Leave Request`}
                        >
                          <PencilIcon className="h-5 w-5 text-gray-600" />
                        </Button>
                        <Button
                          variant="outline-none"
                          onClick={() => handleDeleteClick(leave)}
                          className="p-1 rounded-md hover:bg-red-100 transition-all duration-200"
                          title={`Delete ${leave.leaveType} Leave Request`}
                        >
                          <TrashIcon className="h-5 w-5 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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