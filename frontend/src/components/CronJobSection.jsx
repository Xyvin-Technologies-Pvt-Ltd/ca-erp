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
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-bold text-gray-900">{section.name}</h3>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Template
          </span>
        </div>
        <button
          onClick={() => setIsAddingProject(!isAddingProject)}
          className="inline-flex items-center px-4 py-2 bg-[#1c6ead] rounded-lg text-white transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Project
        </button>
      </div>

      {isAddingProject && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={newProject.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frequency
              </label>
              <div className="flex space-x-2">
                {['weekly', 'monthly', 'yearly'].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setNewProject({ ...newProject, frequency: freq })}
                    className={`px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm
                      ${newProject.frequency === freq
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent scale-105 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-300'}`}
                    aria-pressed={newProject.frequency === freq}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                rows="3"
                placeholder="Enter project description"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsAddingProject(false)}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAddProject}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Create Cron Job
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CronJobSection; 