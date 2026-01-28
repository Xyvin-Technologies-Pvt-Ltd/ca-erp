import { useRef, useEffect, useState } from "react";
import ProjectForm from "./ProjectForm";
import ApplyPresetWizard from "./ApplyPresetWizard";
import { presetProjectsApi } from "../api/presetProjectApi";
import {
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/24/outline";

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const modalRef = useRef(null);
  const [mode, setMode] = useState("select-type"); // select-type, blank, select-preset, apply-preset
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [loadingPresets, setLoadingPresets] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode("select-type");
      setSelectedPresetId(null);
      setPresets([]);
    }
  }, [isOpen]);

  // Handle outside click
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

  // Fetch presets when switching to select-preset mode
  useEffect(() => {
    if (mode === "select-preset") {
      const loadPresets = async () => {
        try {
          setLoadingPresets(true);
          const res = await presetProjectsApi.getAll();
          setPresets(res.data || []);
        } catch (err) {
          console.error("Failed to load presets", err);
        } finally {
          setLoadingPresets(false);
        }
      };
      loadPresets();
    }
  }, [mode]);

  if (!isOpen) return null;

  const handlePresetSelect = (presetId) => {
    setSelectedPresetId(presetId);
    setMode("apply-preset");
  };

  const handleStepBack = () => {
    if (mode === "select-preset") setMode("select-type");
    else if (mode === "apply-preset") setMode("select-preset");
    else setMode("select-type");
  };


  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Dynamic sizing based on content */}
      <div
        ref={modalRef}
        className={`w-full mx-auto max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl transition-all duration-300 ${mode === "select-type" ? "max-w-2xl" : "max-w-4xl"
          }`}
      >
        {/* Helper to render content based on mode */}
        {mode === "select-type" && (
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
                <p className="text-gray-500 mt-1">Choose how you want to start your project</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Option 1: Blank Project */}
              <button
                onClick={() => setMode("blank")}
                className="group relative flex flex-col items-center p-8 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-center"
              >
                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <DocumentPlusIcon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Blank Project</h3>
                <p className="text-sm text-gray-500 mb-6">Start from scratch. Define your own structure, milestones, and tasks.</p>
                <span className="text-blue-600 font-medium text-sm flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                  Select <ArrowLongRightIcon className="h-4 w-4 ml-2" />
                </span>
              </button>

              {/* Option 2: From Preset */}
              <button
                onClick={() => setMode("select-preset")}
                className="group relative flex flex-col items-center p-8 border-2 border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300 text-center"
              >
                <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ClipboardDocumentListIcon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">From Preset</h3>
                <p className="text-sm text-gray-500 mb-6">Use a predefined template. Includes structure, tasks, and department flows.</p>
                <span className="text-indigo-600 font-medium text-sm flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                  Browse Presets <ArrowLongRightIcon className="h-4 w-4 ml-2" />
                </span>
              </button>
            </div>
          </div>
        )}

        {mode === "select-preset" && (
          <div className="flex flex-col h-full max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <button onClick={handleStepBack} className="text-gray-500 hover:text-gray-700">
                  <ArrowLongRightIcon className="h-6 w-6 transform rotate-180" />
                </button>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Select a Preset</h3>
                  <p className="text-sm text-gray-500">Choose a template to start with</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {loadingPresets ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : presets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No preset projects found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {presets.map(preset => (
                    <button
                      key={preset._id}
                      onClick={() => handlePresetSelect(preset._id)}
                      className="text-left p-4 border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all duration-200 bg-white group"
                    >
                      <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{preset.name}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{preset.description || "No description provided."}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {preset.levels?.length || 0} Levels
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          {preset.tasks?.length || 0} Tasks
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {(mode === "blank" || mode === "apply-preset") && (
          <>

            {mode === "blank" ? (
              <ProjectForm
                onSuccess={(project) => {
                  onProjectCreated(project);
                  onClose();
                }}
                onCancel={onClose}
              />
            ) : (
              <ApplyPresetWizard
                presetId={selectedPresetId}
                onClose={onClose}
                onSuccess={(project) => {
                  onProjectCreated(project);
                  onClose();
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CreateProjectModal;
