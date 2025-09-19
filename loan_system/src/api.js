import axios from "axios";

// 1️⃣ Axios instance
const api = axios.create({
  baseURL: "http://localhost:8000/api", // base URL ya backend
  withCredentials: true,                 // ✅ muhimu kwa CSRF cookies
});

// 2️⃣ Helper: pata cookie kwa jina
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

// 3️⃣ Request interceptor: ongeza CSRF token
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken && ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 4️⃣ Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        console.error("Authentication/CSRF error:", error.response);
        // Optional: redirect to login page
        window.location.href = "/#login";
      }
    }
    return Promise.reject(error);
  }
);

// 5️⃣ Optional: fetch CSRF token once at app start
api.get("/csrf/")
  .then((res) => console.log("CSRF token fetched:", res.data.csrfToken))
  .catch((err) => console.error("CSRF fetch error:", err));

export default api;
