import axios from "axios";

// Axios instance
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // very important for CSRF + session
});

// Helper: get cookie by name
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Add CSRF token automatically for unsafe methods
api.interceptors.request.use((config) => {
  const csrfToken = getCookie("csrftoken");
  if (csrfToken && ["post", "put", "delete", "patch"].includes(config.method)) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: redirect to login on 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.error("Authentication error:", error.response);
      window.location.href = "/#login";
    }
    return Promise.reject(error);
  }
);

// Optional: fetch CSRF token from backend once at app start
api.get("/csrf/").catch(err => console.error("CSRF fetch error:", err));

export default api;
