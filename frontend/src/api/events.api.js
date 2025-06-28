import api from './axios';

export const getEvents = async () => {
    const response = await api.get('/events');
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