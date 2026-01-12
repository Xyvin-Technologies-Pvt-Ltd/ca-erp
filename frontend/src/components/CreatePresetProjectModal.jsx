import { useRef, useEffect } from "react";
import PresetProjectForm from "./PresetProjectForm";

const CreatePresetProjectModal = ({ isOpen, onClose, onPresetCreated }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div
        ref={modalRef}
        className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <PresetProjectForm
          onSuccess={(preset) => {
            onPresetCreated(preset);
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default CreatePresetProjectModal;