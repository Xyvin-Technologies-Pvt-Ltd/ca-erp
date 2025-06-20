import { create } from 'zustand';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../api/department.api';
import { getLeaves, createLeave, updateLeave, deleteLeave, reviewLeave } from '../api/leaves.api';
import toast from 'react-hot-toast';

const useHrmStore = create((set, get) => ({
  // State
  departments: [],
  departmentsLoading: false,
  departmentsError: null,

  // Leave State
  leaves: [],
  leavesLoading: false,
  leavesError: null,

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
  },

  // Leave Actions
  fetchLeaves: async () => {
    set({ leavesLoading: true, leavesError: null });
    try {
      const leaves = await getLeaves();
      set({ leaves, leavesLoading: false });
    } catch (error) {
      set({ leavesError: error.message || 'Failed to fetch leaves', leavesLoading: false });
    }
  },
  createLeave: async (leaveData) => {
    try {
      const response = await createLeave(leaveData);
      set(state => ({ leaves: [...state.leaves, response.data.leave] }));
      return response.data.leave;
    } catch (error) {
      throw error;
    }
  },
  updateLeave: async (id, leaveData) => {
    try {
      const response = await updateLeave(id, leaveData);
      set(state => ({ leaves: state.leaves.map(l => l._id === id ? response.data.leave : l) }));
      return response.data.leave;
    } catch (error) {
      throw error;
    }
  },
  deleteLeave: async (id) => {
    try {
      await deleteLeave(id);
      set(state => ({ leaves: state.leaves.filter(l => l._id !== id) }));
    } catch (error) {
      throw error;
    }
  },
  reviewLeave: async (id, reviewData) => {
    try {
      const response = await reviewLeave(id, reviewData);
      set(state => ({ leaves: state.leaves.map(l => l._id === id ? response.data.leave : l) }));
      return response.data.leave;
    } catch (error) {
      throw error;
    }
  },
}));

export default useHrmStore; 