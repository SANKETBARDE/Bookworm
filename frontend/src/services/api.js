import axios from "axios";

const normalizeApiUrl = (url) => {
  const trimmedUrl = url.replace(/\/+$/, "");
  return trimmedUrl.endsWith("/api") ? trimmedUrl : `${trimmedUrl}/api`;
};

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL || "http://127.0.0.1:5000");

const AUTH_STORAGE_KEYS = {
  token: "bookworm_token",
  refreshToken: "bookworm_refresh_token",
  user: "bookworm_user",
  profile: "bookworm_profile",
};

const removeStoredAuth = () => {
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

const api = axios.create({
  baseURL: API_URL,
});

const refreshApi = axios.create({
  baseURL: API_URL,
});

let refreshRequest = null;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const saveAuth = (data) => {
  removeStoredAuth();
  if (data.access_token) {
    localStorage.setItem(AUTH_STORAGE_KEYS.token, data.access_token);
  }
  if (data.refresh_token) {
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, data.refresh_token);
  }
  if (data.user) {
    localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(data.user));
  }
  if (data.profile) {
    localStorage.setItem(AUTH_STORAGE_KEYS.profile, JSON.stringify(data.profile));
  }
};

export const logout = () => {
  removeStoredAuth();
};

export const getProfile = () => {
  const profile = localStorage.getItem(AUTH_STORAGE_KEYS.profile);
  return profile ? JSON.parse(profile) : null;
};

export const updateStoredProfile = (profile) => {
  localStorage.setItem(AUTH_STORAGE_KEYS.profile, JSON.stringify(profile));
};

export const isLoggedIn = () => {
  return Boolean(localStorage.getItem(AUTH_STORAGE_KEYS.token));
};

export const isAdmin = () => {
  const profile = getProfile();
  return profile?.role === "admin";
};

const refreshSession = async () => {
  const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);

  if (!refreshToken) {
    throw new Error("Refresh token missing");
  }

  if (!refreshRequest) {
    refreshRequest = refreshApi
      .post("/auth/refresh", { refresh_token: refreshToken })
      .then((response) => {
        const authData = response.data.data;
        saveAuth(authData);
        return authData.access_token;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

const isAuthRoute = (url = "") => url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry || isAuthRoute(originalRequest.url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const token = await refreshSession();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return api(originalRequest);
    } catch (refreshError) {
      logout();

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }

      return Promise.reject(refreshError);
    }
  }
);

export default api;
