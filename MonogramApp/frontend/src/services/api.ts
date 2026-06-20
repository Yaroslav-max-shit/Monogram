import axios from 'axios';
import { getSession, saveSession } from './cookies';

const apiClient = axios.create();
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.request.use(async (config) => {
    const session = await getSession();
    if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                });
            }
            
            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
                const session = await getSession();
                if (!session?.token) {
                    throw new Error('No token');
                }
                
                const response = await axios.post('/auth/refresh', {}, {
                    headers: { Authorization: `Bearer ${session.token}` }
                });
                
                const newToken = response.data.access_token;
                if (newToken) {
                    await saveSession(newToken, session.user);
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                    processQueue(null, newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                const path = window.location.pathname;
                if (path !== '/' && path !== '/login' && !path.startsWith('/invite') && !path.startsWith('/verify')) {
                    window.location.href = '/';
                }
            } finally {
                isRefreshing = false;
            }
        }
        
        return Promise.reject(error);
    }
);

export const searchUsers = async (query: string) => {
    const response = await apiClient.get(`/users/search?q=${query}`);
    return response.data;
};

export default apiClient;
