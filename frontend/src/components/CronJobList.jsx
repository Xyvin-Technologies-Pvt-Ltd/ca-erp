import { useState } from 'react';
import { toast } from 'react-toastify';
import { cronJobsApi } from '../api/cronJobs';

const CronJobList = ({ cronJobs, onUpdate }) => {
  const [executingJobs, setExecutingJobs] = useState(new Set());

  const handleExecuteJob = async (cronJobId) => {
    if (executingJobs.has(cronJobId)) return;

    try {
      setExecutingJobs(prev => new Set(prev).add(cronJobId));
      await cronJobsApi.executeCronJob(cronJobId);
      toast.success('Project created successfully from cron job');
      onUpdate();
    } catch (error) {
      toast.error(error.message || 'Failed to execute cron job');
    } finally {
      setExecutingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(cronJobId);
        return newSet;
      });
    }
  };

  const handleDeleteJob = async (cronJobId) => {
    if (window.confirm('Are you sure you want to delete this cron job?')) {
      try {
        await cronJobsApi.deleteCronJob(cronJobId);
        toast.success('Cron job deleted successfully');
        onUpdate();
      } catch (error) {
        toast.error(error.message || 'Failed to delete cron job');
      }
    }
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

  if (cronJobs.length === 0) {
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
    <div className="space-y-4">
      {cronJobs.map((cronJob) => (
        <div key={cronJob._id} className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{cronJob.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cronJob.isActive)}`}>
                  {cronJob.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getFrequencyLabel(cronJob.frequency)}
                </span>
              </div>
              
              {cronJob.description && (
                <p className="text-gray-600 mb-3">{cronJob.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Section:</span>
                  <span className="ml-2 font-medium">{cronJob.section}</span>
                </div>
                <div>
                  <span className="text-gray-500">Start Date:</span>
                  <span className="ml-2 font-medium">{formatDate(cronJob.startDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Next Run:</span>
                  <span className="ml-2 font-medium">{formatDate(cronJob.nextRun)}</span>
                </div>
                {cronJob.lastRun && (
                  <div>
                    <span className="text-gray-500">Last Run:</span>
                    <span className="ml-2 font-medium">{formatDate(cronJob.lastRun)}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 font-medium">{formatDate(cronJob.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => handleExecuteJob(cronJob._id)}
                disabled={executingJobs.has(cronJob._id)}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
              >
                {executingJobs.has(cronJob._id) ? (
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Execute
              </button>
              <button
                onClick={() => handleDeleteJob(cronJob._id)}
                className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CronJobList; 