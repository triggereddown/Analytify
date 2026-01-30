import axios from "axios";
import dotenv from "dotenv";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach JWT token automatically to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default API;
