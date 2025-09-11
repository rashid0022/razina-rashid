import React, { useState } from "react";
import axios from "axios";

const Login = ({ state, setState, setPage, showNotification }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ Axios instance yenye withCredentials
  const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // hii inahakikisha cookies/session zinatumika
  });

  // CSRF token interceptor
  api.interceptors.request.use(
    (config) => {
      const csrfToken = getCookie("csrftoken");
      if (csrfToken) config.headers["X-CSRFToken"] = csrfToken;
      return config;
    },
    (error) => Promise.reject(error)
  );

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

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("login/", { username, password });

      if (response.status === 200) {
        setState({ ...state, currentUser: username });
        setPage("dashboard");
        showNotification("Login successful", "success");
        setError("");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid credentials");
    }
  };

  return (
    <div className="login-container">
      <h2>Applicant Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
