// api.js
import axios from "axios";


const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});


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


async function fetchCsrfToken() {
  if (!getCookie("csrftoken")) {
    try {
      const res = await api.get("/csrf/");
      console.log("✅ CSRF token fetched from backend:", res.data.csrfToken);
     
    } catch (err) {
      console.error("❌ CSRF fetch error:", err);
    }
  }
}


fetchCsrfToken();


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



export async function loginUser(username, password) {
  return safeApiCall(() =>
    api.post("/login/", { username, password })
  );
}


export async function fetchUsers() {
  return safeApiCall(() =>
    api.get("/users/")
  );
}


export async function applyLoan(loanData) {
  return safeApiCall(() =>
    api.post("/loans/", loanData)
  );
}


export async function updateLoan(loanId, data) {
  return safeApiCall(() =>
    api.patch(`/loans/${loanId}/`, data)
  );
}


export default api;
