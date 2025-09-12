import React, { useEffect, useState } from "react";
import api from "./api";

const AdminLogin = ({ onAdminLogin }) => {
  // Default username na password
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  // Pata CSRF token wakati component inarender
  useEffect(() => {
    api.get("/csrf/")
      .then(res => console.log("CSRF token:", res.data.csrfToken))
      .catch(console.error);
  }, []);

  // Handle submit – version mpya ya debugging
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Request kwa backend
      const res = await api.post("/login/", { username, password });
      console.log("Login response:", res.data); // debugging

      const user = res.data.user;
      if (user && (user.is_superuser || user.is_staff)) {
        onAdminLogin(user); // trigger parent callback
      } else {
        setError("Huna ruhusa ya admin");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Username au password si sahihi");
    }
  };

  return (
    <div>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default AdminLogin;
