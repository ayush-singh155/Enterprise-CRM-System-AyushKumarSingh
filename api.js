import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
let accessToken = null;
let refreshRequest = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        accessToken = data.accessToken;
        return data;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (error.response?.status !== 401 || !request || request._retry ||
        request.url?.includes('/auth/login') || request.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      const { accessToken: token } = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    } catch (refreshError) {
      accessToken = null;
      window.dispatchEvent(new Event('auth:expired'));
      return Promise.reject(refreshError);
    }
  }
);
