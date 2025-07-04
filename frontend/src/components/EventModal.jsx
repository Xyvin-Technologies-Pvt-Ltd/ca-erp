import { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { createEvent, updateEvent } from '../api/events.api';
import toast from 'react-hot-toast';
import { CalendarDays } from 'lucide-react';

const EventModal = ({ isOpen, onClose, onSuccess, event }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
      });
    }
  }, [event, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (event) {
        await updateEvent(event._id, formData);
        toast.success('Event updated successfully');
      } else {
        await createEvent(formData);
        toast.success('Event created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-lg shadow-sm">
                              <CalendarDays className="h-6 w-6" />

              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {event ? 'Edit Event' : 'Add New Event'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {event ? 'Update event details below' : 'Fill in the details to create a new event'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors duration-200">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
              
                <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Title <span className='text-red-500'>*</span></label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Annual Conference"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date <span className='text-red-500'>*</span></label>
                  <div className="relative">
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date <span className='text-red-500'>*</span></label>
                  <div className="relative">
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className='text-red-500'>*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  maxLength={500}
                  required
                  placeholder="Enter event description..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                ></textarea>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">Event details or overview</p>
                  <p className={`text-sm ${formData.description.length > 400 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {formData.description.length}/500
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:from-blue-300 disabled:to-blue-400 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none font-medium"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {event ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h упаковка-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={event ? 'M5 13l4 4L19 7' : 'M12 6v6m0 0v6m0-6h6m-6 0H6'} />
                    </svg>
                    {event ? 'Update Event' : 'Create Event'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventModal;