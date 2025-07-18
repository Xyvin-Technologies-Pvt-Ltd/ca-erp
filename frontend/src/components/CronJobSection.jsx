import { useState } from 'react';
import { toast } from 'react-toastify';
import { cronJobsApi } from '../api/cronJobs';
import { sectionsApi } from '../api/sections';

const CronJobSection = ({ section, clientId, onUpdate }) => {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    startDate: '',
    frequency: 'monthly',
    description: ''
  });

  const handleAddProject = async () => {
    if (!newProject.name || !newProject.startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const cronJobData = {
        name: newProject.name,
        description: newProject.description,
        client: clientId,
        section: section._id,
        frequency: newProject.frequency,
        startDate: newProject.startDate,
        isActive: true
      };

      await cronJobsApi.createCronJob(cronJobData);
      toast.success('Cron job created successfully');
      
      // Reset form
      setNewProject({
        name: '',
        startDate: '',
        frequency: 'monthly',
        description: ''
      });
      setIsAddingProject(false);
      
      // Refresh parent component
      onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to create cron job');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
        <button
          onClick={() => setIsAddingProject(!isAddingProject)}
          className="inline-flex items-center px-3 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Project
        </button>
      </div>

      {isAddingProject && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={newProject.startDate}
                onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <div className="flex space-x-2">
                {['weekly', 'monthly', 'yearly'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setNewProject({ ...newProject, frequency: freq })}
                    className={`px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] font-medium text-sm
                      ${newProject.frequency === freq
                        ? 'bg-[#1c6ead] text-white border-[#1c6ead] scale-105 shadow-lg'
                        : 'bg-white text-[#1c6ead] border-gray-300 hover:bg-blue-50'}`}
                    aria-pressed={newProject.frequency === freq}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1c6ead] focus:border-transparent"
                rows="2"
                placeholder="Enter project description"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setIsAddingProject(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddProject}
              className="px-4 py-2 bg-[#1c6ead] text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Create Cron Job
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CronJobSection; 