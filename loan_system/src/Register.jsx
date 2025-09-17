import { useState } from "react";
import api, { fetchCSRF } from "./api"; // hakikisha fetchCSRF imesafirishwa

export default function Register({ setPage, state, setState, showNotification }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return showNotification("Passwords do not match", "error");
    }

    try {
      // Fetch CSRF token before POST
      await fetchCSRF();

      const res = await api.post("register/", { username, password, email });
      if (res.status === 201) {
        showNotification("Account created! Proceed to apply loan", "success");
        setState(prev => ({ ...prev, currentUser: username }));
        setPage("apply");
      }
    } catch (err) {
      console.error(err.response?.data || err);
      const msg = err.response?.data?.error || "Registration failed. Try again.";
      showNotification(msg, "error");
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          placeholder="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account?{" "}
        <a
          href="#"
          onClick={e => {
            e.preventDefault();
            setPage("login");
          }}
        >
          Login here
        </a>
      </p>
    </div>
  );
}
