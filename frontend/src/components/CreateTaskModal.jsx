import { useRef, useEffect } from "react";
import TaskForm from "./TaskForm";

const CreateTaskModal = ({
  isOpen,
  onClose,
  onTaskCreated,
  projectId,
  task,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      // Restore scrolling when modal is closed
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <TaskForm
          projectIds={projectId}
          task={task}
          onSuccess={(task) => {
            onTaskCreated(task);
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default CreateTaskModal;
