import api from './axios';

export const getDepartments = async () => {
    const response = await api.get('/departments');
    return response.data;
};

export const getDepartment = async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
};

export const createDepartment = async (data) => {
    const response = await api.post('/departments', data);
    return response.data;
};

export const updateDepartment = async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
};

export const deleteDepartment = async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
};

export const getNextDepartmentCode = async () => {
    const response = await api.get('/departments/code/next');
    return response.data;
}; 