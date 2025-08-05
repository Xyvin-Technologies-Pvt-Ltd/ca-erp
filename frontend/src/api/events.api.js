import api from './axios';

export const getEvents = async (params = {}) => {
    let { page = 1, limit = 10 } = params;
    page = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    limit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
    const response = await api.get('/events', { params: { page, limit } });
    return response.data;
};

export const getEvent = async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
};

export const createEvent = async (data) => {
    const response = await api.post('/events', data);
    return response.data;
};

export const updateEvent = async (id, data) => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
};

export const deleteEvent = async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
}; 