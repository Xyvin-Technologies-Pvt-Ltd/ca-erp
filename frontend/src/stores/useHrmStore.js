import { create } from 'zustand';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../api/department.api';
import toast from 'react-hot-toast';

const useHrmStore = create((set, get) => ({
  // State
  departments: [],
  departmentsLoading: false,
  departmentsError: null,

  // Actions
  fetchDepartments: async () => {
    set({ departmentsLoading: true, departmentsError: null });
    try {
      const response = await getDepartments();
      set({ 
        departments: response.data.departments || [],
        departmentsLoading: false 
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      set({ 
        departmentsError: error.response?.data?.message || 'Failed to fetch departments',
        departmentsLoading: false 
      });
      toast.error('Failed to fetch departments');
    }
  },

  createDepartment: async (departmentData) => {
    try {
      const response = await createDepartment(departmentData);
      const newDepartment = response.data.department;
      set(state => ({
        departments: [...state.departments, newDepartment]
      }));
      return newDepartment;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },

  updateDepartment: async (id, departmentData) => {
    try {
      const response = await updateDepartment(id, departmentData);
      const updatedDepartment = response.data.department;
      set(state => ({
        departments: state.departments.map(dept => 
          dept._id === id ? updatedDepartment : dept
        )
      }));
      return updatedDepartment;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  },

  deleteDepartment: async (id) => {
    try {
      await deleteDepartment(id);
      set(state => ({
        departments: state.departments.filter(dept => dept._id !== id)
      }));
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }
}));

export default useHrmStore; 