import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your backend URL
const BASE_URL = 'http://10.125.99.136:8000'; // Placeholder, user will need to change this to their IP

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
