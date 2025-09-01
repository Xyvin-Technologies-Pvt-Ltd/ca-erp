import { useState, useEffect } from 'react';
import { XMarkIcon, BuildingOffice2Icon, CodeBracketIcon, MapPinIcon, CurrencyDollarIcon, DocumentTextIcon, PowerIcon } from '@heroicons/react/24/outline';
import { createDepartment, updateDepartment, getNextDepartmentCode } from '../api/department.api';
import { toast } from "react-toastify";

const DepartmentModal = ({ isOpen, onClose, onSuccess, department }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    location: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false); // New state for popup
  const maxDescriptionLength = 500;

  useEffect(() => {
    const initializeForm = async () => {
      try {
        if (department) {
          setFormData({
            name: department.name || '',
            code: department.code || '',
            description: department.description || '',
            location: department.location || '',
            isActive: department.isActive,
          });
        } else {
          const response = await getNextDepartmentCode();
          const nextCode = response?.data?.code || 'DEP001';
          setFormData((prev) => ({
            ...prev,
            code: nextCode,
          }));
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        toast.error('Failed to initialize form');
        onClose();
      }
    };

    if (isOpen) {
      initializeForm();
    }
  }, [isOpen, department, onClose]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (department) {
        await updateDepartment(department._id, formData);
        toast.success('Department updated successfully');
      } else {
        await createDepartment(formData);
        toast.success('Department created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error(error.response?.data?.message || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  // Handle click outside modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(true); // Show popup
  };

  const confirmDiscard = () => {
    setShowConfirmModal(false);
    onClose();
  };

  const cancelDiscard = () => {
    setShowConfirmModal(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-[#1c6ead] text-white p-3 rounded-lg shadow-sm">
                <BuildingOffice2Icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {department ? 'Edit Department' : 'Add New Department'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {department ? 'Update department details below' : 'Fill in the details to create a new department'}
                </p>
              </div>
            </div>
            <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200">
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
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BuildingOffice2Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                      placeholder="e.g. Human Resources"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Code <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      readOnly
                      disabled
                      placeholder="e.g. DEP001"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                      placeholder="e.g. Building A, Floor 3"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    maxLength={maxDescriptionLength}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 resize-none"
                    placeholder="Enter department description"
                  ></textarea>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">Department details or notes</p>
                  <p className={`text-sm ${formData.description.length > maxDescriptionLength * 0.8 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {formData.description.length}/{maxDescriptionLength}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* <div className="bg-green-100 p-2 rounded-lg">
                  <PowerIcon className="h-5 w-5 text-green-600" />
                </div> */}
                <span className="text-sm font-medium text-gray-700">Status</span>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-7 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-all duration-300 ease-in-out group-hover:ring-2 group-hover:ring-green-300"></div>
                  <div className="absolute left-1 top-1 w-5 h-5 bg-white border border-gray-300 rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-5 peer-checked:border-green-500"></div>
                </label>
                <span className="text-sm text-gray-600 font-medium">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[#1c6ead] text-white rounded-lg hover:bg-[#1557a0] focus:outline-none focus:ring-2 focus:ring-[#1c6ead] disabled:bg-blue-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none font-medium"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {department ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center">
                    {/* <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={department ? 'M5 13l4 4L19 7' : 'M12 6v6m0 0v6m0-6h6m-6 0H6'} />
                    </svg> */}
                    {department ? 'Update Department' : 'Create Department'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Discard Changes?</h3>
              <button
                onClick={cancelDiscard}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1 transition-all duration-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to discard changes? Any unsaved changes will be lost.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDiscard}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1c6ead] transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDiscard}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 font-medium"
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

export default DepartmentModal;