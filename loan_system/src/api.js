import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  withCredentials: true, // send cookies
});

// Helper: get CSRF token from cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    document.cookie.split(";").forEach(cookie => {
      cookie = cookie.trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
      }
    });
  }
  return cookieValue;
}

// Interceptor: add CSRF token automatically for unsafe requests
api.interceptors.request.use(config => {
  const csrfToken = getCookie("csrftoken");
  if (csrfToken && ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
});

// Fetch CSRF token from server
export const fetchCSRF = async () => {
  try {
    await api.get("csrf/"); // hits get_csrf_token view
  } catch (err) {
    console.error("CSRF fetch error:", err);
  }
};

// API functions
export const applyLoan = async (payload) => {
  await fetchCSRF(); // ensure CSRF cookie
  return api.post("apply-loan/", payload);
};

export const registerAndApply = async (payload) => {
  await fetchCSRF();
  return api.post("register-apply/", payload);
};

export const makePayment = async (payload) => {
  await fetchCSRF();
  return api.post("payments/", payload);
};

export default api;
