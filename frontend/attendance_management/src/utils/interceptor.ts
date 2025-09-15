import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:80", // your backend base URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // or "auth" if you used that

    if (token) {

      // Ensure headers exist
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
