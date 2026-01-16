import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { presetProjectsApi } from "../api/presetProjectApi";
import ProjectForm from "./ProjectForm";
import TaskForm from "./TaskForm";
import { XMarkIcon } from "@heroicons/react/24/outline";

const ApplyPresetWizard = ({ presetId, onClose }) => {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [preset, setPreset] = useState(null);

    const [projectData, setProjectData] = useState(null);
    const [presetTasks, setPresetTasks] = useState([]);

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [assignedTasks, setAssignedTasks] = useState([]);

    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const loadPreset = async () => {
            try {
                const res = await presetProjectsApi.getById(presetId);
                setPreset(res.data);
            } catch (err) {
                console.error("Failed to load preset", err);
            } finally {
                setLoading(false);
            }
        };
        loadPreset();
    }, [presetId]);

    const handleProjectSubmit = (projectData) => {
        // Auto-assign tasks based on selected users in departments
        const autoAssignedTasks = preset.tasks.map(task => {
            const assignment = projectData.assignedTo[task.levelIndex];

            return {
                ...task,
                assignedTo: assignment?.user,
                department: assignment?.department,
            };
        });

        submitAll(projectData, autoAssignedTasks);
    };

    const submitAll = async (cleanProjectData, tasks) => {
        try {
            const res = await presetProjectsApi.applyToProject(presetId, {
                projectData: cleanProjectData,
                tasks: tasks,
            });

            if (onSuccess) {
                onSuccess(res.data);
            } else {
                navigate(`/projects/${res.projectId}`);
                onClose();
            }
        } catch (err) {
            console.error("Failed to apply preset", err);
        }
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="h-10 w-10 border-2 border-t-[#1c6ead] rounded-full animate-spin" />
            </div>
        );
    }

    if (!preset) return null;

    return (
        <ProjectForm
            project={{
                name: preset.name,
                description: preset.description,
            }}
            presetLevels={preset.levels}
            lockDepartments={true}
            onCancel={onClose}
            onSubmit={handleProjectSubmit}
        />
    );
};

export default ApplyPresetWizard;