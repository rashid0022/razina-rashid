// src/AdminLogin.jsx
import React, { useEffect, useState } from "react";
import api from "./api";

const AdminLogin = ({ onAdminLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Pata CSRF token wakati component inarender
  useEffect(() => {
    const fetchCSRF = async () => {
      try {
        const res = await api.get("/csrf/");
        const token = res.data.csrfToken;
        api.defaults.headers.post["X-CSRFToken"] = token;
        console.log("CSRF token set:", token);
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
      }
    };

    fetchCSRF();

    // Angalia kama user tayari ame login
    const storedUser = JSON.parse(localStorage.getItem("currentUser"));
    if (storedUser && (storedUser.is_admin || storedUser.is_superuser || storedUser.is_staff)) {
      onAdminLogin(storedUser);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/login/", { username, password });
      const user = res.data.user;

      if (user && (user.is_superuser || user.is_staff || user.is_admin)) {
        // Save user info locally
        localStorage.setItem("currentUser", JSON.stringify(user));
        onAdminLogin(user);
      } else {
        setError("You do not have admin permissions");
      }
    } catch (err) {
      console.error("Login error:", err);

      if (err.response) {
        // Backend returned a response
        setError(err.response.data.error || "Login failed");
      } else {
        setError("Network error. Could not reach server.");
      }
    }
  };

  return (
    <div className="admin-login-box">
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
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
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default AdminLogin;
