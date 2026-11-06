/** @format */

import axios from "axios";
import { useAuthStore } from "../stores/authStore";
import { loginPath } from "../lib/utils";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.questunit.com/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired or revoked session: sign out and go to the login page
    // (but not for a failed sign-in itself, which shows its own message).
    const isLoginCall = String(error.config?.url || "").includes("/auth/login");
    if (error.response?.status === 401 && !isLoginCall) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.href = loginPath(window.location.pathname + window.location.search);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
