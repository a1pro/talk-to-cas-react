import axios from "axios";
import { getDeviceFingerprint } from "@/lib/deviceFingerprint";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("talktocas_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["X-Device-Fingerprint"] = getDeviceFingerprint();

  return config;
});

export default api;
