// api.js
import axios from "axios";

// ================= 1️⃣ Axios instance =================
const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true, // Muhimu kwa CSRF cookies na session
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// ================= 2️⃣ Helper: pata cookie kwa jina fulani =================
export function getCookie(name) {
  if (!document.cookie) return null;
  const cookies = document.cookie.split(";").map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

// ================= 3️⃣ Request interceptor: ongeza CSRF token =================
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken && ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())) {
      config.headers["X-CSRFToken"] = csrfToken;
      console.log(`✅ CSRF token added to ${config.method.toUpperCase()} request:`, csrfToken);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================= 4️⃣ Response interceptor: handle errors globally =================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        console.error("⚠️ Authentication required (401):", error.response);
      } else if (status === 403) {
        console.error("⚠️ CSRF / Permission error (403):", error.response);
      } else {
        console.error(`⚠️ HTTP error ${status}:`, error.response);
      }
    } else if (error.request) {
      console.error("⚠️ No response from server:", error.request);
    } else {
      console.error("⚠️ Request setup error:", error.message);
    }
    return Promise.reject(error);
  }
);

// ================= 5️⃣ Fetch CSRF token on app start =================
async function fetchCsrfToken() {
  if (!getCookie("csrftoken")) {
    try {
      const res = await api.get("/csrf/");
      console.log("✅ CSRF token fetched from backend:", res.data.csrfToken);
      // Now the token is saved in cookie and ready for POST/PUT/PATCH/DELETE
    } catch (err) {
      console.error("❌ CSRF fetch error:", err);
    }
  }
}

// Call it once when this file is imported
fetchCsrfToken();

// ================= 6️⃣ Optional helper: safe API call with CSRF retry =================
export async function safeApiCall(requestFn) {
  try {
    return await requestFn();
  } catch (error) {
    if (error.response?.status === 403) {
      console.warn("⚠️ 403 detected, fetching CSRF token and retrying...");
      await fetchCsrfToken();
      return requestFn(); // retry
    }
    throw error;
  }
}

// ================= 7️⃣ Example usage =================
// Login example
export async function loginUser(username, password) {
  return safeApiCall(() =>
    api.post("/login/", { username, password })
  );
}

// Fetch users example (admin only)
export async function fetchUsers() {
  return safeApiCall(() =>
    api.get("/users/")
  );
}

// Apply loan example
export async function applyLoan(loanData) {
  return safeApiCall(() =>
    api.post("/loans/", loanData)
  );
}

// Update loan example
export async function updateLoan(loanId, data) {
  return safeApiCall(() =>
    api.patch(`/loans/${loanId}/`, data)
  );
}

// ✅ Default export
export default api;
