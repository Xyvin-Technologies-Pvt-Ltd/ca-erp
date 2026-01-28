import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon, ChevronRightIcon, ChevronLeftIcon, PaperClipIcon, TagIcon } from '@heroicons/react/24/outline';
import { updateTask } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api';

const PresetTaskCompletionWizard = ({ tasks, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await userApi.getUsersDepartmentProject();
                setUsers(response.data || []);
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };
        fetchUsers();
    }, []);

    const [selectedProjectId, setSelectedProjectId] = useState('');

    const uniqueProjects = React.useMemo(() => {
        const projectsMap = new Map();
        tasks.forEach(task => {
            if (task.project && task.project._id) {
                projectsMap.set(task.project._id, task.project.name);
            }
        });
        return Array.from(projectsMap.entries()).map(([id, name]) => ({ id, name }));
    }, [tasks]);

    const filteredTasks = React.useMemo(() => {
        if (!selectedProjectId) return tasks;
        return tasks.filter(t => t.project?._id === selectedProjectId);
    }, [tasks, selectedProjectId]);

    useEffect(() => {
        setCurrentIndex(0);
    }, [selectedProjectId]);

    const currentTask = filteredTasks[currentIndex];
    const isLastTask = currentIndex === filteredTasks.length - 1;

    const tagOptions = [
        "GST", "Income Tax", "TDS", "ROC", "Audit", "Compliance",
        "Financial Statements", "Taxation", "Transfer Pricing",
        "International Tax", "Wealth Management", "Banking",
        "FEMA", "Reconciliation", "44AB",
    ];

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch, getValues } = useForm({
        defaultValues: {
            title: currentTask?.title || '',
            description: currentTask?.description || '',
            dueDate: currentTask?.dueDate ? new Date(currentTask.dueDate).toISOString().split('T')[0] : '',
            priority: currentTask?.priority || 'medium',
            amount: currentTask?.amount || 0,
            estimatedHours: currentTask?.estimatedHours || 0,
            taskIncentivePercentage: currentTask?.taskIncentivePercentage || 0,
            verificationIncentivePercentage: currentTask?.verificationIncentivePercentage || 1,
            tags: currentTask?.tags || [],
            assignedTo: currentTask?.assignedTo || ''
        }
    });

    // Reset form when task changes
    React.useEffect(() => {
        if (currentTask) {
            reset({
                title: currentTask.title,
                description: currentTask.description,
                dueDate: currentTask.dueDate ? new Date(currentTask.dueDate).toISOString().split('T')[0] : '',
                priority: currentTask.priority,
                amount: currentTask.amount,
                estimatedHours: currentTask.estimatedHours || 0,
                taskIncentivePercentage: currentTask.taskIncentivePercentage || 0,
                verificationIncentivePercentage: currentTask.verificationIncentivePercentage || 1,
                tags: currentTask.tags || [],
                assignedTo: currentTask.assignedTo || ''
            });
            setSelectedTags(currentTask.tags || []);
        }
    }, [currentTask, reset]);

    const handleTagToggle = (tag) => {
        const currentTags = selectedTags.includes(tag)
            ? selectedTags.filter(t => t !== tag)
            : [...selectedTags, tag];
        setSelectedTags(currentTags);
        setValue('tags', currentTags);
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {

            const payload = {
                ...data,
                tags: selectedTags,
                isPresetPending: false,
                status: 'pending'
            };

            if (!payload.assignedTo) {
                delete payload.assignedTo;
            }


            await updateTask(currentTask._id, payload);

            const newCompleted = [...completedTasks, currentTask._id];
            setCompletedTasks(newCompleted);

            if (isLastTask) {
                if (onSuccess) onSuccess();
                onClose();
            } else {
                setCurrentIndex(prev => prev + 1);
            }
        } catch (error) {
            console.error("Failed to update task", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Setup Pending Tasks</h2>
                        <div className="flex flex-col">
                            <p className="text-sm text-gray-600">
                                Task {currentIndex + 1} of {filteredTasks.length}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                                    Level {currentTask?.levelIndex !== undefined ? currentTask.levelIndex + 1 : '?'}
                                </span>
                                {currentTask?.department && (
                                    <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                                        {currentTask.department?.name || "Unknown Dept"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {uniqueProjects.length > 0 && (
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white py-1 pl-2 pr-8"
                            >
                                <option value="">All Projects</option>
                                {uniqueProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                {filteredTasks.length > 0 && (
                    <div className="w-full bg-gray-200 h-1.5">
                        <div
                            className="bg-[#1c6ead] h-1.5 transition-all duration-300"
                            style={{ width: `${((currentIndex) / filteredTasks.length) * 100}%` }}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <PaperClipIcon className="h-12 w-12 mb-2 text-gray-300" />
                            <p className="text-lg font-medium">No pending tasks for this project</p>
                            <p className="text-sm">Select another project or view all</p>
                        </div>
                    ) : (
                        <form id="task-wizard-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                                <input
                                    {...register('title', { required: "Title is required" })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent bg-gray-50"
                                />
                                {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    {...register('description')}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Due Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        {...register('dueDate', { required: "Due date is required" })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                                    />
                                    {errors.dueDate && <span className="text-red-500 text-xs">{errors.dueDate.message}</span>}
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        {...register('priority')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {/* Assigned To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                                <select
                                    {...register('assignedTo')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                                >
                                    <option value="">Auto Assign (Based on Levels)</option>
                                    {users
                                        .filter(user => {
                                            const taskDeptId = currentTask?.department?._id || currentTask?.department;
                                            const userDeptId = user.department?._id || user.department;
                                            return !taskDeptId || taskDeptId === userDeptId;
                                        })
                                        .map(user => (
                                            <option key={user._id} value={user._id}>
                                                {user.name} {user.department ? `— ${user.department.name}` : ''}
                                            </option>
                                        ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Leave empty to use default level-based assignment</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                        <input
                                            type="number"
                                            {...register('amount')}
                                            className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Estimated Hours */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        {...register('estimatedHours')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>

                            {/* Admin Only Incentives */}
                            {user?.role === 'admin' && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Task Incentive %</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            {...register('taskIncentivePercentage')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Verification Incentive %</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            {...register('verificationIncentivePercentage')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <TagIcon className="h-4 w-4 mr-1" /> Tags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {tagOptions.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => handleTagToggle(tag)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${selectedTags.includes(tag)
                                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
                        disabled={currentIndex === 0 || loading || filteredTasks.length === 0}
                        className={`flex items-center text-gray-600 hover:text-gray-900 ${currentIndex === 0 || filteredTasks.length === 0 ? 'invisible' : ''}`}
                    >
                        <ChevronLeftIcon className="h-4 w-4 mr-1" />
                        Back
                    </button>

                    <button
                        form="task-wizard-form"
                        type="submit"
                        disabled={loading || filteredTasks.length === 0}
                        className={`flex items-center px-6 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-blue-700 shadow-md transition-all ${filteredTasks.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        ) : null}
                        {isLastTask ? 'Finish Setup' : 'Next Task'}
                        {!isLastTask && <ChevronRightIcon className="h-4 w-4 ml-2" />}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default PresetTaskCompletionWizard;
