// api.js
import axios from "axios";

// API instance
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Pata CSRF cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken && ["post", "put", "delete", "patch"].includes(config.method)) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
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

// ✅ Pata CSRF token kutoka backend na chapisha
api.get("/csrf/")
   .then(res => console.log("CSRF token:", res.data.csrfToken))
   .catch(err => console.error("CSRF fetch error:", err));

export default api;
