import axios from "axios";

// 1️⃣ Unda Axios instance
const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true, // muhimu kwa CSRF
});

// 2️⃣ Optional: fetch CSRF token once at app start
axios.get("http://localhost:8000/csrf/", {
  withCredentials: true
})
.then(response => {
  console.log("CSRF token fetched successfully:", response.data.csrfToken);
})
.catch(err => console.error("CSRF fetch error:", err));

// 3️⃣ Helper: get cookie by name
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

// 4️⃣ Add CSRF token automatically for unsafe methods
api.interceptors.request.use((config) => {
  const csrfToken = getCookie("csrftoken");
  
  if (csrfToken && ["post", "put", "delete", "patch"].includes(config.method?.toLowerCase())) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
}, (error) => Promise.reject(error));

// 5️⃣ Response interceptor
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

// 6️⃣ Export instance
export default api;
