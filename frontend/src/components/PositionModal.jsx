import { useState, useEffect } from 'react';
import { XMarkIcon, BriefcaseIcon, CodeBracketIcon, BuildingOffice2Icon, DocumentTextIcon, UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { createPosition, updatePosition, getNextPositionCode } from '../api/positions.api';
import { getDepartments } from '../api/department.api';
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';

const PositionModal = ({ isOpen, onClose, onSuccess, position }) => {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    department: '',
    description: '',
    responsibilities: '',
    requirements: '',
    employmentType: 'Full-time',
    level: 1,
    maxPositions: 1,
    isActive: true,
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const maxDescriptionLength = 500;
  const maxResponsibilitiesLength = 500;
  const maxRequirementsLength = 500;

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const data = await getDepartments();
        setDepartments(Array.isArray(data.data) ? data.data : []);
      } catch (error) {
        setDepartments([]);
      }
    };
    if (isOpen) fetchDeps();
  }, [isOpen]);

  useEffect(() => {
    const initializeForm = async () => {
      try {
        if (position) {
          setFormData({
            title: position.title || '',
            code: position.code || '',
            department: position.department?._id || position.department || '',
            description: position.description || '',
            responsibilities: Array.isArray(position.responsibilities) ? position.responsibilities.join('\n') : '',
            requirements: Array.isArray(position.requirements) ? position.requirements.join('\n') : '',
            employmentType: position.employmentType || 'Full-time',
            level: position.level || 1,
            maxPositions: position.maxPositions || 1,
            isActive: position.isActive !== undefined ? position.isActive : true,
          });
        } else {
          const response = await getNextPositionCode();
          const nextCode = response?.data?.code || 'POS001';
          setFormData((prev) => ({
            ...prev,
            code: nextCode,
            employmentType: 'Full-time',
            level: 1,
            maxPositions: 1,
            isActive: true,
          }));
        }
      } catch (error) {
        toast.error('Failed to initialize form');
        onClose();
      }
    };
    if (isOpen) initializeForm();
  }, [isOpen, position, onClose]);

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
      const payload = {
        ...formData,
        responsibilities: formData.responsibilities.split('\n').filter(Boolean),
        requirements: formData.requirements.split('\n').filter(Boolean),
        level: Number(formData.level),
        maxPositions: Number(formData.maxPositions),
      };
      if (position) {
        await updatePosition(position._id, payload);
        toast.success('Position updated successfully');
      } else {
        await createPosition(payload);
        toast.success('Position created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save position');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(true);
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
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-3xl overflow-hidden transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-[#1c6ead] text-white p-3 rounded-lg shadow-sm">
                <BriefcaseIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {position ? 'Edit Position' : 'Add New Position'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {position ? 'Update position details below' : 'Fill in the details to create a new position'}
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
                  <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position Title <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Software Engineer"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position Code <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      readOnly
                      disabled
                      placeholder="e.g. POS001"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                    >
                      <option value="" disabled>Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Position Level <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      required
                      pattern="[0-9]*"
                      placeholder="e.g. 1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Positions <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      name="maxPositions"
                      value={formData.maxPositions}
                      onChange={handleChange}
                      required
                      pattern="[0-9]*"
                      placeholder="e.g. 1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    maxLength={maxDescriptionLength}
                    required
                    placeholder="Enter position description..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 resize-none"
                  ></textarea>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">Position details or overview</p>
                  <p className={`text-sm ${formData.description.length > maxDescriptionLength * 0.8 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {formData.description.length}/{maxDescriptionLength}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <textarea
                      name="responsibilities"
                      value={formData.responsibilities}
                      onChange={handleChange}
                      rows="4"
                      maxLength={maxResponsibilitiesLength}
                      required
                      placeholder="Enter responsibilities"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 resize-none"
                    ></textarea>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">List responsibilities, one per line</p>
                    <p className={`text-sm ${formData.responsibilities.length > maxResponsibilitiesLength * 0.8 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {formData.responsibilities.length}/{maxResponsibilitiesLength}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requirements <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <textarea
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleChange}
                      rows="4"
                      maxLength={maxRequirementsLength}
                      required
                      placeholder="Enter requirements"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c6ead] focus:border-[#1c6ead] transition-colors duration-200 resize-none"
                    ></textarea>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">List requirements, one per line</p>
                    <p className={`text-sm ${formData.requirements.length > maxRequirementsLength * 0.8 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {formData.requirements.length}/{maxRequirementsLength}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
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
                    {position ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={position ? 'M5 13l4 4L19 7' : 'M12 6v6m0 0v6m0-6h6m-6 0H6'} />
                    </svg>
                    {position ? 'Update Position' : 'Create Position'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

    {showConfirmModal && (
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Discard Changes?</h3>
            <button
              onClick={cancelDiscard}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
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

export default PositionModal;