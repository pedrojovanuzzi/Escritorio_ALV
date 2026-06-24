import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.REACT_APP_URL || "http://localhost:3000/api",
});

// Injeta o token em toda requisição.
api.interceptors.request.use((config) => {
  const saved = Cookies.get("user");
  if (saved) {
    try {
      const token = JSON.parse(saved);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* cookie inválido, ignora */
    }
  }
  return config;
});

export default api;
