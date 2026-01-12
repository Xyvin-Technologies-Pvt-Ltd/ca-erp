import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon, ChevronRightIcon, ChevronLeftIcon, PaperClipIcon, TagIcon } from '@heroicons/react/24/outline';
import { updateTask } from '../api/tasks';
import { useAuth } from '../context/AuthContext';

const PresetTaskCompletionWizard = ({ tasks, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completedTasks, setCompletedTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);

    const currentTask = tasks[currentIndex];
    const isLastTask = currentIndex === tasks.length - 1;

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
            tags: currentTask?.tags || []
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
                tags: currentTask.tags || []
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
            // Transform data to FormData if needed, but for now we'll send JSON
            // If file uploads are needed, we'd enable the file input logic.
            // Assuming for this wizard we update fields primarily.

            // NOTE: If updateTask expects purely JSON, we send this. 
            // If we add files, we'll need to construct FormData.
            // Let's stick to JSON for these fields unless files are selected.

            const payload = {
                ...data,
                tags: selectedTags,
                isPresetPending: false,
                status: 'pending'
            };

            // If files are handled, we'd append them here. 
            // For now, simpler implementation for the requested text/number fields.

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
                        <p className="text-sm text-gray-600">
                            Task {currentIndex + 1} of {tasks.length}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 h-1.5">
                    <div
                        className="bg-[#1c6ead] h-1.5 transition-all duration-300"
                        style={{ width: `${((currentIndex) / tasks.length) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
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
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)}
                        disabled={currentIndex === 0 || loading}
                        className={`flex items-center text-gray-600 hover:text-gray-900 ${currentIndex === 0 ? 'invisible' : ''}`}
                    >
                        <ChevronLeftIcon className="h-4 w-4 mr-1" />
                        Back
                    </button>

                    <button
                        form="task-wizard-form"
                        type="submit"
                        disabled={loading}
                        className="flex items-center px-6 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
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
