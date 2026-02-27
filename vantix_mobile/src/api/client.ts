import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use environment variable for the backend URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
