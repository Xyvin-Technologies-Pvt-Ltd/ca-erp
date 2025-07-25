import { useState } from 'react';
import { toast } from 'react-toastify';
import { cronJobsApi } from '../api/cronJobs';
import DeleteConfirmationModal from './common/DeleteConfirmationModal';

const CronJobList = ({ cronJobs, sections = [], onUpdate }) => {
  const [executingJobs, setExecutingJobs] = useState(new Set());
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, cronJobId: null, cronJobName: '' });

  const handleDeleteJob = async (cronJobId) => {
    // Open confirmation modal instead of alert
    const cronJob = cronJobs.find(job => job._id === cronJobId);
    setDeleteModal({ isOpen: true, cronJobId, cronJobName: cronJob?.name || '' });
  };

  const confirmDeleteJob = async () => {
    try {
      await cronJobsApi.deleteCronJob(deleteModal.cronJobId);
      toast.success('Cron job deleted successfully');
      setDeleteModal({ isOpen: false, cronJobId: null, cronJobName: '' });
      onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to delete cron job');
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, cronJobId: null, cronJobName: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return frequency;
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getSectionName = (sectionId) => {
    const section = sections.find(s => s._id === sectionId);
    return section ? section.name : 'Unknown Section';
  };

  const toggleSectionCollapse = (sectionId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const groupCronJobsBySection = () => {
    const grouped = {};
    cronJobs.forEach(job => {
      const sectionName = getSectionName(job.section);
      if (!grouped[sectionName]) {
        grouped[sectionName] = [];
      }
      grouped[sectionName].push(job);
    });
    return grouped;
  };

  if (cronJobs.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Projects Found</h3>
        <p className="text-gray-500">Create your first cron job to automatically generate projects.</p>
      </div>
    );
  }

  const groupedJobs = groupCronJobsBySection();
  if (Object.keys(groupedJobs).length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Cron Jobs Found</h3>
        <p className="text-gray-500">Create your first cron job to automatically generate projects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteJob}
        title="Delete Cron Job"
        message={`Are you sure you want to delete the cron job "${deleteModal.cronJobName}"? This action cannot be undone.`}
        itemName={deleteModal.cronJobName}
      />
      {Object.entries(groupedJobs).map(([sectionName, jobs]) => (
        <div key={sectionName} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
          {/* Section Header */}
          <div 
            className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 px-6 py-5 cursor-pointer hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 transition-all duration-300 border-b border-blue-200 shadow-sm"
            onClick={() => toggleSectionCollapse(jobs[0]?.section)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-gray-900">{sectionName}</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm">
                    {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Active: {jobs.filter(job => job.isActive).length}
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    Inactive: {jobs.filter(job => !job.isActive).length}
                  </span>
                </div>
                <svg 
                  className={`w-6 h-6 text-gray-600 transition-all duration-300 ${
                    collapsedSections.has(jobs[0]?.section) ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Section Content */}
          <div className={`overflow-hidden transition-all duration-300 ${
            collapsedSections.has(jobs[0]?.section) ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100'
          }`}>
            <div className="p-6">
              <div className="space-y-4">
                {jobs.map((cronJob, index) => (
                  <div 
                    key={cronJob._id} 
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards'
                    }}
                  >
                    {/* Job Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                          <h4 className="text-lg font-bold text-gray-900">{cronJob.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(cronJob.isActive)}`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${cronJob.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              {cronJob.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                              {getFrequencyLabel(cronJob.frequency)}
                            </span>
                          </div>
                        </div>
                        
                        {cronJob.description && (
                          <p className="text-gray-600 mb-4 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                            {cronJob.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => handleDeleteJob(cronJob._id)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Job Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 cursor-default">
                        <div className="flex items-center space-x-2 mb-1">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Start Date</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{formatDate(cronJob.startDate)}</span>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-200 cursor-default">
                        <div className="flex items-center space-x-2 mb-1">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Next Run</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{formatDate(cronJob.nextRun)}</span>
                      </div>

                      {cronJob.lastRun && (
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 cursor-default">
                          <div className="flex items-center space-x-2 mb-1">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Last Run</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{formatDate(cronJob.lastRun)}</span>
                        </div>
                      )}

                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 cursor-default">
                        <div className="flex items-center space-x-2 mb-1">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Created</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{formatDate(cronJob.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CronJobList; 