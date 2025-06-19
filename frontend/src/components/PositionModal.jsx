import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createPosition, updatePosition, getNextPositionCode } from '../api/positions.api';
import { getDepartments } from '../api/department.api';
import toast from 'react-hot-toast';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6 ">
          <h2 className="text-2xl font-semibold text-gray-800">
            {position ? 'Edit Position' : 'Add Position'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Position Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter position title..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Position Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                readOnly
                disabled
                placeholder="Auto-generated..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Employment Type *</label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Position Level *</label>
              <input
                type="number"
                name="level"
                min="1"
                value={formData.level}
                onChange={handleChange}
                required
                placeholder="1"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Positions *</label>
              <input
                type="number"
                name="maxPositions"
                min="1"
                value={formData.maxPositions}
                onChange={handleChange}
                required
                placeholder="1"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              required
              placeholder="Enter position description..."
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
            ></textarea>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Responsibilities *</label>
              <textarea
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleChange}
                rows="3"
                required
                placeholder="Enter responsibilities (one per line)..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Requirements *</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows="3"
                required
                placeholder="Enter requirements (one per line)..."
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">Status:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-all duration-300"></div>
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white border border-gray-300 rounded-full transition-transform duration-300 peer-checked:translate-x-full"></div>
            </label>
            <span className="text-sm text-gray-600">
              {formData.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : position ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PositionModal; 