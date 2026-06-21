import { getAccessToken, removeAccessToken } from "@/utils/token-storage";
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:6200/api",

  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      removeAccessToken();

      if (window.location.pathname !== "/thuchi/login") {
        window.location.href = "/thuchi/login";
      }
    }

    return Promise.reject(error);
  }
);
