import * as SecureStore from 'expo-secure-store';
import { apiClient } from './client';

export const authService = {
    login: async (email: string, password: string) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await apiClient.post('/api/v1/auth/login/access-token', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const { access_token } = response.data;
        await SecureStore.setItemAsync('userToken', access_token);
        return response.data;
    },

    logout: async () => {
        await SecureStore.deleteItemAsync('userToken');
    },

    isAuthenticated: async () => {
        const token = await SecureStore.getItemAsync('userToken');
        return !!token;
    },

    getMe: async () => {
        const response = await apiClient.get('/api/v1/empleados/me');
        return response.data;
    },
};
