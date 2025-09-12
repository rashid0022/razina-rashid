// Login.jsx - Simplified version
import React, { useState } from "react";
import api from "./api"; // Use the centralized api instance

const Login = ({ state, setState, setPage, showNotification }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
      if (err.response?.status === 400 || err.response?.status === 401) {
        setError("Invalid username or password");
      } else {
        setError("Login failed. Please try again.");
      }
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
      <p style={{ marginTop: "15px" }}>
        Don't have an account?{" "}
        <a href="#" onClick={(e) => { e.preventDefault(); setPage("apply"); }} style={{ color: "#3498db" }}>
          Apply for a loan to create one
        </a>
      </p>
    </div>
  );
};

export default Login;