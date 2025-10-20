import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, BASE_URL } from "@env";

// Create axios instance with direct baseURL - no backticks
const client = axios.create({
  baseURL: BASE_URL, // Using double quotes instead of single quotes
  timeout: 30000, // Increased timeout for slower connections
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor for adding token
client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("bookcircle_auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh
client.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = await AsyncStorage.getItem(
          "bookcircle_refresh_token"
        );
        if (!refreshToken) {
          // No refresh token, user needs to login again
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/api/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;

        // Store the new token
        await AsyncStorage.setItem("bookcircle_auth_token", access);

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${access}`;
        client.defaults.headers.common["Authorization"] = `Bearer ${access}`;

        // Retry the original request
        return client(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        await AsyncStorage.removeItem("bookcircle_auth_token");
        await AsyncStorage.removeItem("bookcircle_refresh_token");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
