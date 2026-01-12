import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeftIcon, PlayIcon } from "@heroicons/react/24/outline";
import { presetProjectsApi } from "../api/presetProjectApi";
import { Layers } from "lucide-react";
import { LayoutTemplate } from "lucide-react";
import { CiEdit } from "react-icons/ci";
import PresetProjectForm from "../components/PresetProjectForm";
import ApplyPresetWizard from "../components/ApplyPresetWizard";

const priorityColors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-orange-100 text-orange-800",
    low: "bg-green-100 text-green-800",
};

const PresetProjectDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [preset, setPreset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showApplyWizard, setShowApplyWizard] = useState(false);

    useEffect(() => {
        const loadPreset = async () => {
            try {
                const res = await presetProjectsApi.getById(id);
                setPreset(res.data);
                setLoading(false);
            } catch (err) {
                setError("Failed to load preset project");
                setLoading(false);
            }
        };

        loadPreset();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="h-12 w-12 border-t-2 border-b-2 border-[#1c6ead] rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !preset) {
        return (
            <div className="max-w-4xl mx-auto py-8 text-center text-red-600">
                {error || "Preset not found"}
            </div>
        );
    }

    const levelsWithTasks = preset.levels.map((level) => ({
        ...level,
        tasks: preset.tasks.filter(
            (task) => task.levelIndex === level.levelIndex
        ),
    }));

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 bg-gradient-to-b from-gray-50 to-gray-100 min-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                {/* LEFT */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-[#1c6ead] hover:text-blue-700"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back
                </button>

                {/* RIGHT */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowApplyWizard(true)}
                        className="px-6 py-3 bg-[#1c6ead] text-white rounded-xl font-semibold shadow hover:shadow-lg flex items-center"
                    >
                        <PlayIcon className="h-5 w-5 mr-2" />
                        Apply Preset
                    </button>

                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-6 py-3 border border-[#1c6ead] text-[#1c6ead] rounded-xl font-semibold hover:bg-blue-50 flex items-center"
                    >
                        <CiEdit className="h-5 w-5 mr-2" />
                        Edit Preset
                    </button>
                </div>
            </div>

            {/* Preset Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-blue-100 shadow p-6 mb-8"
            >
                <div className="flex items-center space-x-3 mb-2">
                    <LayoutTemplate className="h-7 w-7 text-[#1c6ead]" />
                    <h1 className="text-2xl font-bold text-gray-900">
                        {preset.name}
                    </h1>
                </div>

                <p className="text-gray-600 mt-2">
                    {preset.description || "No description provided"}
                </p>
            </motion.div>

            {/* Levels & Tasks */}
            <div className="space-y-6">
                {levelsWithTasks.map((level, idx) => (
                    <motion.div
                        key={level.levelIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-xl border border-blue-100 shadow p-6"
                    >
                        {/* Level Header */}
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Level {level.levelIndex + 1} —{" "}
                            <span className="text-[#1c6ead]">
                                {typeof level.department === "string"
                                    ? level.department
                                    : level.department?.name || "Unknown Department"}
                            </span>
                        </h2>

                        {level.tasks.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No tasks in this department
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                                                Task
                                            </th>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                                                Description
                                            </th>
                                            <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">
                                                Priority
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-200">
                                        {level.tasks.map((task, taskIndex) => (
                                            <tr key={task._id || `${level.levelIndex}-${taskIndex}`}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {task.title}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {task.description || "-"}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]
                                                            }`}
                                                    >
                                                        {task.priority}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
            {isEditModalOpen && (
                <PresetProjectForm
                    preset={preset}
                    onCancel={() => setIsEditModalOpen(false)}
                    onSuccess={(updatedPreset) => {
                        setPreset(updatedPreset);
                        setIsEditModalOpen(false);
                    }}
                />
            )}
            {showApplyWizard && (
                <ApplyPresetWizard
                    presetId={id}
                    onClose={() => setShowApplyWizard(false)}
                />
            )}
        </div>
    );
};

export default PresetProjectDetail;