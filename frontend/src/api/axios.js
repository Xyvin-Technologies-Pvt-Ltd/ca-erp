import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    crossDomain: true,
    timeout: 100000, // 10 seconds timeout //TODO: changed this for a workaround for a bug
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        console.log(token)
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { status, data } = error.response || {};

        // Handle network errors
        if (error.code === 'ERR_NETWORK') {
            console.error('Network error:', error);
            return Promise.reject(new Error('Unable to connect to the server. Please check your internet connection or try again later.'));
        }

        // Handle authentication errors
        if (status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }

        // Handle other errors
        if (data && data.message) {
            return Promise.reject(new Error(data.message));
        }

        return Promise.reject(error);
    }
);

export default api; 