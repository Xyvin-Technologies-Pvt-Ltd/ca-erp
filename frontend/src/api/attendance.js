import api from './axios';

// Get all attendance records
export const getAttendance = async (params) => {
  const response = await api.get('/attendance', { params });
  return response.data;
};

// Get attendance stats
export const getAttendanceStats = async ({ startDate, endDate }) => {
  const response = await api.get('/attendance/stats', {
    params: { startDate, endDate },
  });
  return response.data;
};

// Get my attendance (for logged-in employee)
export const getMyAttendance = async (params) => {
  const response = await api.get('/attendance/my-attendance', { params });
  return response.data;
};

// Update attendance record
export const updateAttendance = async (id, data) => {
  const response = await api.put(`/attendance/${id}`, data);
  return response.data;
};

// Check in
export const checkIn = async (data) => {
  const response = await api.post('/attendance/check-in', data);
  return response.data;
};

// Check out
export const checkOut = async (id) => {
  const response = await api.post(`/attendance/${id}/check-out`);
  return response.data;
};

// Create bulk attendance records
export const createBulkAttendance = async (data) => {
  const response = await api.post('/attendance/bulk', data);
  return response.data;
};

// Delete attendance record
export const deleteAttendance = async (id) => {
  const response = await api.delete(`/attendance/${id}`);
  return response.data;
};

