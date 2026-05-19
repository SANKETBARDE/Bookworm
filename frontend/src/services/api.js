import axios from "axios";

const normalizeApiUrl = (url) => {
  const trimmedUrl = url.replace(/\/+$/, "");
  return trimmedUrl.endsWith("/api") ? trimmedUrl : `${trimmedUrl}/api`;
};

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL || "http://127.0.0.1:5000");

const AUTH_STORAGE_KEYS = {
  token: "bookworm_token",
  user: "bookworm_user",
  profile: "bookworm_profile",
};

const removeStoredAuth = () => {
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const saveAuth = (data) => {
  removeStoredAuth();
  localStorage.setItem(AUTH_STORAGE_KEYS.token, data.access_token);
  localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(data.user));
  localStorage.setItem(AUTH_STORAGE_KEYS.profile, JSON.stringify(data.profile));
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

export default api;
