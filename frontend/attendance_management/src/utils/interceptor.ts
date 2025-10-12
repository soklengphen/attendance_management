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

// Auto logout on token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or unauthorized
      localStorage.removeItem("token");
      localStorage.removeItem("auth");
      localStorage.removeItem("user");

      // Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


export default api;
