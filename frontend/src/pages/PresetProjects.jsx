import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Layers } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../config/constants";
import { presetProjectsApi } from "../api/presetProjectApi";
import CreatePresetProjectModal from "../components/CreatePresetProjectModal";


const PresetProjects = () => {
    const navigate = useNavigate();
    const { role } = useAuth();

    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadPresets = async () => {
        try {
            setLoading(true);

            const data = await presetProjectsApi.getAll();

            // Validate response
            if (!data?.data || !Array.isArray(data.data)) {
                throw new Error("Invalid API response format");
            }

            // Sort by createdAt (latest first)
            const sortedPresets = data.data.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            setPresets(sortedPresets);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch preset projects:", err);
            setError("Failed to load preset projects. Please try again later.");
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPresets();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-b from-gray-50 to-gray-100">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="h-12 w-12 border-t-2 border-b-2 border-indigo-500 rounded-full"
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 bg-gradient-to-b from-gray-50 to-gray-100">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl min-h-[90vh] mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Header */}
            <motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="mb-6 flex flex-col gap-4"
>
  {/* Top row: Back + Create button */}
  <div className="flex items-center justify-between">
    <motion.button
      onClick={() => navigate(ROUTES.PROJECTS)}
      className="flex items-center text-[#1c6ead] hover:text-blue-700"
      whileHover={{ scale: 1.05 }}
    >
      <ArrowLeftIcon className="h-5 w-5 mr-2" />
      Back
    </motion.button>

    {(role === "admin" || role === "manager") && (
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className="group px-6 py-3 bg-[#1c6ead] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl flex items-center"
        whileHover={{ scale: 1.02 }}
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Create Preset
      </motion.button>
    )}
  </div>

  {/* Second row: Icon + Title */}
  <div className="flex items-center space-x-3">
    <Layers className="h-8 w-8 text-[#1c6ead]" />
    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
      Preset Projects
    </h1>
  </div>
</motion.div>

            <AnimatePresence mode="wait">
                {presets.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white rounded-lg shadow p-8 text-center border border-gray-200"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            No preset projects found
                        </h2>
                        <p className="text-gray-500">
                            Create preset templates to speed up project creation.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white shadow rounded-lg overflow-hidden border border-gray-200"
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                            Preset Name
                                        </th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">
                                            Departments
                                        </th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">
                                            Tasks
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                            Created
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    <AnimatePresence>
                                        {presets.map((preset, index) => (
                                            <motion.tr
                                                key={preset._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.25, delay: index * 0.03 }}
                                                onClick={() =>
                                                    navigate(`/preset-projects/${preset._id}`)
                                                }
                                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {preset.name}
                                                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                        {preset.description || "No description"}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">
                                                    {preset.levels?.length || 0}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-500 text-center">
                                                    {preset.tasks?.length || 0}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(preset.createdAt).toLocaleDateString()}
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <CreatePresetProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onPresetCreated={(newPreset) => {
                    setPresets((prev) => [newPreset, ...prev]);
                }}
            />
        </div>
    );
};

export default PresetProjects;