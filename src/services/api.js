import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3002/api";
export const API_PUBLIC_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiPublic = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const normalizarRol = (rol = "") => {
  const valor = rol.toLowerCase();
  if (valor === "mesero") return "Mesero";
  if (valor === "cocinero") return "Cocinero";
  if (valor === "administrador") return "Administrador";
  return rol;
};

export const construirUrlImagen = (imagenUrl) => {
  if (!imagenUrl) return "";
  if (/^https?:\/\//i.test(imagenUrl)) return imagenUrl;
  if (imagenUrl.startsWith("/")) return `${API_PUBLIC_BASE_URL}${imagenUrl}`;
  return `${API_PUBLIC_BASE_URL}/${imagenUrl}`;
};

export default api;
