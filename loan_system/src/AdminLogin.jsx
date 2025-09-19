import React, { useEffect, useState } from "react";
import api from "./api";

const AdminLogin = ({ onAdminLogin }) => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  // Pata CSRF token wakati component inarender
  useEffect(() => {
    api.get("/csrf/")
      .then(res => console.log("CSRF token:", res.data.csrfToken))
      .catch(console.error);

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
      const user = res.data.user || res.data;

      if (user && (user.is_superuser || user.is_staff || user.is_admin)) {
        // Save user info locally
        localStorage.setItem("currentUser", JSON.stringify(user));
        onAdminLogin(user);
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
