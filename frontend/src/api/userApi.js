import axiosInstance from "./axios";

export const userApi = {
    getAllUsers: async (params = { page: 1, limit: 10 }) => {
        const response = await axiosInstance.get('/users', { params });
        return {
            data: response.data.data,
            total: response.data.total,
            pagination: response.data.pagination,
            count: response.data.count
        };
    },

    getUserById: async (id) => {
        const response = await axiosInstance.get(`/users/${id}`);
        return response.data;
    },

    createUser: async (userData) => {
        const response = await axiosInstance.post('/users', userData);
        return response.data;
    },

    updateUser: async (id, userData) => {
        const response = await axiosInstance.put(`/users/${id}`, userData);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await axiosInstance.delete(`/users/${id}`);
        return response.data;
    },

    async uploadAvatarToS3(file) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axiosInstance.post("/upload/single", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data.data.fileUrl; // S3 URL
    },

    async updateUserAvatarUrl(userId, avatarUrl) {
        // PATCH or PUT to update user avatar field with S3 URL
        const response = await axiosInstance.put(`/users/${userId}`, { avatar: avatarUrl });
        return response.data;
    },

    Allusers: async () => {
        const response = await axiosInstance.get('/users/allusers');
        return {
            data: response,
         
        };
    },
}