import { useState, useEffect, useRef } from "react";
import { presetProjectsApi } from "../api/presetProjectApi";
import { getDepartments } from "../api/department.api";
import {
    DocumentTextIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

const PresetProjectForm = ({ preset, onSuccess, onCancel }) => {
    const modalRef = useRef(null);
    const lastTaskRef = useRef(null);
    const prevTasksLength = useRef(0);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [departments, setDepartments] = useState([]);
    const [levels, setLevels] = useState([{ department: "" }]);
    const [tasks, setTasks] = useState([
        {
            title: "",
            description: "",
            priority: "medium",
            levelIndex: 0,
        },
    ]);


    useEffect(() => {
        prevTasksLength.current = tasks.length;
    }, []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const isEditMode = Boolean(preset);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

    /* LOAD DEPARTMENTS */

    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const res = await getDepartments({ limit: 1000 });
                setDepartments(res.data || []);
            } catch (err) {
                console.error("Failed to load departments", err);
            }
        };
        loadDepartments();
    }, []);

    useEffect(() => {
        if (preset) {
            setName(preset.name || "");
            setDescription(preset.description || "");
            setLevels(
                preset.levels?.map((lvl) => ({
                    department: lvl.department,
                })) || [{ department: "" }]
            );
            const initialTasks = preset.tasks || [];
            setTasks(initialTasks);
            prevTasksLength.current = initialTasks.length;
        }
    }, [preset]);

    // Scroll to the new task when added
    useEffect(() => {
        if (tasks.length > prevTasksLength.current) {
            lastTaskRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
        prevTasksLength.current = tasks.length;
    }, [tasks.length]);

    /*  LEVEL HANDLERS  */

    const addLevel = () => {
        setLevels([...levels, { department: "" }]);
    };

    const updateLevel = (index, value) => {
        const updated = [...levels];
        updated[index].department = value;
        setLevels(updated);
    };

    const removeLevel = (index) => {
        const updated = levels.filter((_, i) => i !== index);
        setLevels(updated.length ? updated : [{ department: "" }]);
    };
    const cancelDiscard = () => {
        setShowDiscardConfirm(false);
    };

    const confirmDiscard = () => {
        setShowDiscardConfirm(false);
        onCancel(); // closes the modal
    };
    /*  TASK HANDLERS  */

    const addTask = () => {
        setTasks([
            ...tasks,
            {
                title: "",
                description: "",
                priority: "medium",
                levelIndex: 0,
            },
        ]);
    };

    const updateTask = (index, field, value) => {
        const updated = [...tasks];
        updated[index][field] = value;
        setTasks(updated);
    };

    const removeTask = (index) => {
        setTasks(tasks.filter((_, i) => i !== index));
    };

    /* ================= SUBMIT ================= */

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) return setError("Preset name is required");
        if (levels.some((l) => !l.department))
            return setError("All department levels are required");

        try {
            setLoading(true);

            const payload = {
                name,
                description,
                levels: levels.map((l, index) => ({
                    levelIndex: index,
                    department: l.department,
                })),
                tasks,
            };

            const res = isEditMode
                ? await presetProjectsApi.update(preset._id, payload)
                : await presetProjectsApi.create(payload);

            onSuccess(res.data);
        } catch (err) {
            console.error(err);
            setError(isEditMode
                ? "Failed to update preset project"
                : "Failed to create preset project"
            );
        } finally {
            setLoading(false);
        }
    };

    /* ================= UI ================= */

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                ref={modalRef}
                className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-[#1c6ead] text-white p-3 rounded-lg">
                                <DocumentTextIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {isEditMode ? "Edit Preset Project" : "Create Preset Project"}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Define reusable project structure
                                </p>
                            </div>
                        </div>

                        <button onClick={() => setShowDiscardConfirm(true)}>
                            <XMarkIcon className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <form
                    onSubmit={handleSubmit}
                    className="max-h-[70vh] overflow-y-auto p-6 space-y-8"
                >
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Preset Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preset Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 resize-none"
                            />
                        </div>
                    </div>

                    {/* Department Levels */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department Levels *
                        </label>

                        {levels.map((level, index) => (
                            <div key={index} className="flex gap-3 mb-3">
                                <select
                                    value={level.department}
                                    onChange={(e) =>
                                        updateLevel(index, e.target.value)
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 cursor-pointer"
                                >
                                    <option value="">Select department</option>
                                    {departments.map((d) => (
                                        <option key={d._id} value={d.name}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>

                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => removeLevel(index)}
                                        className="text-red-600 font-bold"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addLevel}
                            className="text-[#1c6ead] font-semibold"
                        >
                            + Add Level
                        </button>
                    </div>

                    {/* Tasks */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                                Preset Tasks
                            </label>
                        </div>

                        {tasks.map((task, index) => (
                            <div
                                key={index}
                                ref={index === tasks.length - 1 ? lastTaskRef : null}
                                className="border rounded-lg p-4 mb-4 space-y-2"
                            >
                                <input
                                    type="text"
                                    placeholder="Task title"
                                    value={task.title}
                                    onChange={(e) =>
                                        updateTask(index, "title", e.target.value)
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                                />

                                <textarea
                                    rows={2}
                                    placeholder="Task description"
                                    value={task.description}
                                    onChange={(e) =>
                                        updateTask(index, "description", e.target.value)
                                    }
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 resize-none"
                                />

                                <div className="flex gap-3">
                                    <select
                                        value={task.priority}
                                        onChange={(e) =>
                                            updateTask(index, "priority", e.target.value)
                                        }
                                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 cursor-pointer"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>

                                    <select
                                        value={task.levelIndex}
                                        onChange={(e) =>
                                            updateTask(
                                                index,
                                                "levelIndex",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 cursor-pointer"
                                    >
                                        {levels.map((_, i) => (
                                            <option key={i} value={i}>
                                                Level {i + 1}
                                            </option>
                                        ))}
                                    </select>

                                    {tasks.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeTask(index)}
                                            className="text-red-600"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addTask}
                            className="text-[#1c6ead] font-semibold"
                        >
                            + Add Task
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-colors duration-200 font-medium"
                        >
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-3 bg-[#1c6ead] text-white rounded-lg hover:blue-600 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] disabled:from-blue-300 disabled:to-indigo-400 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none font-medium">
                            {loading
                                ? isEditMode ? "Updating..." : "Creating..."
                                : isEditMode ? "Update Preset" : "Create Preset"}
                        </button>
                    </div>
                </form>
            </div>
            {showDiscardConfirm && (
                <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Discard changes?
                        </h3>

                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to discard changes? Any unsaved changes will be lost.
                        </p>

                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={cancelDiscard}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-colors duration-200 font-medium"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmDiscard}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 font-medium"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PresetProjectForm;