import axios from "axios";

// 1️⃣ Axios instance
const api = axios.create({
  baseURL: "http://localhost:8000/api", // Base URL ya backend
  withCredentials: true, // Muhimu kwa CSRF cookies
});

// 2️⃣ Helper: pata cookie kwa jina fulani
function getCookie(name) {
  if (!document.cookie) return null;

  const cookies = document.cookie.split(";").map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

// 3️⃣ Request interceptor: ongeza CSRF token
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie("csrftoken");
    // weka token kwa requests zinazohitaji (POST, PUT, PATCH, DELETE)
    if (
      csrfToken &&
      ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())
    ) {
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
        // Optional: unaweza redirect user kwenda login page
        // window.location.href = "/#login";
      }
    } else if (error.request) {
      console.error("Hakuna response kutoka server:", error.request);
    } else {
      console.error("Error wakati wa ku-set up request:", error.message);
    }
    return Promise.reject(error);
  }
);

// 5️⃣ Fetch CSRF token mara moja app inapoanza
// (Hii haina madhara hata ukiacha)
api.get("/csrf/")
  .then((res) => console.log("CSRF token fetched:", res.data))
  .catch((err) => console.error("CSRF fetch error:", err));

export default api;
