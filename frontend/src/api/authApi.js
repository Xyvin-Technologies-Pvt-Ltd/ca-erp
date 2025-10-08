import api from './axios';

export const authApi = {
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    logout: async () => {
        const response = await api.get('/auth/logout');
        localStorage.removeItem('auth_token');
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    refreshToken: async () => {
        const response = await api.post('/auth/refresh-token');
        return response.data;
    },

    updatePassword: async (passwordData) => {
        const response = await api.put('/auth/updatepassword', passwordData);
        return response.data;
    },
}; 