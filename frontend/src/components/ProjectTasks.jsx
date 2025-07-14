import { useState, useEffect } from "react";
import { fetchTasksByProject, updateTask } from "../api/tasks";
import { Link } from "react-router-dom";
import CreateTaskModal from "./CreateTaskModal";
import { CiEdit } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { TrashIcon } from "@heroicons/react/24/outline";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-blue-100 text-blue-800",
  review: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
  Pending: "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Review: "bg-purple-100 text-purple-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-green-100 text-green-800",
};

const ProjectTasks = ({ projectId, tasks: initialTasks, onTaskCreated }) => {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [loading, setLoading] = useState(!initialTasks);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reload, setReload] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const { role} = useAuth()
  
 const [taskCurrentPage, setTaskCurrentPage] = useState(1);
 const tasksPerPage = 8;
  useEffect(() => {
  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await fetchTasksByProject(projectId);
      
      setTasks(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch project tasks:", err);
      setError("Failed to load tasks. Please try again later.");
      setLoading(false);
    }
  };

  loadTasks();
}, [projectId,reload]);

  const handleTaskCreated = () => {
    setIsModalOpen(false);
    setReload(!reload);
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const confirmDeleteTask = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!taskToDelete) return;
    try {
      await updateTask(taskToDelete.id, { deleted: true });
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      toast.success("Project deleted successfully");
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task. Please try again.");
    } finally {
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  };

  const formatStatus = (status) => {
    if (!status) return "";
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

 
 const visibleTasks = tasks.filter((task) => !task.deleted);
const totalTaskPages = Math.ceil(visibleTasks.length / tasksPerPage);

const currentTasks = visibleTasks.slice(
  (taskCurrentPage - 1) * tasksPerPage,
  taskCurrentPage * tasksPerPage
);


  // Handle page navigation
 const goToNextTaskPage = () => {
  setTaskCurrentPage((prev) => Math.min(prev + 1, totalTaskPages));
 };

const goToPrevTaskPage = () => {
  setTaskCurrentPage((prev) => Math.max(prev - 1, 1));
};



  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out;
          }
        `}
      </style>
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-semibold">Project Tasks</h2>
        {tasks.length > 0 && role !== "staff" ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Task
          </button>
        ) : null}
      </div>

      {tasks.length === 0 ? (
        <div className="p-6 text-center text-gray-500 animate-fade-in" key={`empty-${reload}`}>
          <p>No tasks found for this project.</p>
          {role !== "staff" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create First Task
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto animate-fade-in" key={`tasks-${reload}-${taskCurrentPage}`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Task",
                  "Status",
                  "Priority",
                  "Assigned To",
                  "Due Date",
                  "Amount",
                ]
                  .concat(role !== "staff" ? ["Actions"] : [])
                  .map((head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {head}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/tasks/${task.id}`} className="text-blue-600 hover:text-blue-900">
                      {task.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(task.tags || []).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[task.status] || "bg-gray-100"
                      }`}
                    >
                      {formatStatus(task.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        priorityColors[task.priority] || "bg-gray-100"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {task.assignedTo?.avatar ? (
                          <img
                            className="h-8 w-8 rounded-full"
                            src={`${import.meta.env.VITE_BASE_URL}${task.assignedTo.avatar}`}
                            alt=""
                            onError={(e) => {
                            e.target.outerHTML = `
                              <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ">
                                <span class="text-white  text-sm">
                                  ${task.assignedTo?.name?.charAt(0).toUpperCase() || ''}
                                </span>
                              </div>`
                          }}
                          />
                        ) : (
                          <span className="text-sm bg-blue-500 text-white rounded-full h-8 w-8 flex items-center justify-center">
                            {task.assignee || task.assignedTo?.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-900">
                          {task.assignee || task.assignedTo?.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.amount !== undefined ? `₹${task.amount}` : "-"}
                  </td>
                  {role !== "staff" && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <CiEdit size={20} />
                        </button>
                        <button
                          onClick={() => confirmDeleteTask(task)}
                          className="text-red-600 hover:text-red-800"
                        >
                         <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalTaskPages > 1 && (
        <div className="flex justify-between items-center px-6 py-4 border-t">
          <button
            onClick={goToPrevTaskPage}
            disabled={taskCurrentPage === 1}
            className={`flex items-center text-sm font-medium ${
              taskCurrentPage === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {taskCurrentPage} of {totalTaskPages}
          </span>

          <button
            onClick={goToNextTaskPage}
            disabled={taskCurrentPage === totalTaskPages}
            className={`flex items-center text-sm font-medium ${
              taskCurrentPage === totalTaskPages
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            Next
            <svg
              className="w-5 h-5 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>
        </div>
      )}

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        projectId={projectId}
        task={taskToEdit}
      />

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm Delete
              </h3>
              <p className="text-gray-500">
                Are you sure you want to delete{" "}
                <strong>{taskToDelete?.title}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
              >
                <MdDelete size={20} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTasks;