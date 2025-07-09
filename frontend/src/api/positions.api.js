import api from './axios';

export const getPositions = async (params = {}) => {
    const { page = 1, limit = 10, ...rest } = params;
    const response = await api.get('/positions', { params: { page, limit, ...rest } });
    return response.data;
};

export const getPosition = async (id) => {
    const response = await api.get(`/positions/${id}`);
    return response.data;
};

export const createPosition = async (data) => {
    const response = await api.post('/positions', data);
    return response.data;
};

export const updatePosition = async (id, data) => {
    const response = await api.put(`/positions/${id}`, data);
    return response.data;
};

export const deletePosition = async (id) => {
    const response = await api.delete(`/positions/${id}`);
    return response.data;
};

export const getNextPositionCode = async () => {
    const response = await api.get('/positions/next-code');
    return response.data;
}; 