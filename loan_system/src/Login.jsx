import { useState, useEffect } from "react";
import api from "./api";

export default function Login({ state, setState, setPage, showNotification }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("csrf/").then(res => console.log("CSRF token:", res.data.csrfToken)).catch(console.error);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("login/", { username, password });
      if (res.status === 200) {
        setState({ ...state, currentUser: username });
        setPage("dashboard");
        showNotification("Login successful", "success");
        setError("");
      }
    } catch (err) {
      console.error(err);
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account?{" "}
        <a href="#" onClick={e => { e.preventDefault(); setPage("register"); }}>Register here</a>
      </p>
    </div>
  );
}
