// src/App.jsx
import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Home from "./Home";
import ApplyLoan from "./ApplyLoan";
import Login from "./Login";
import Register from "./Register";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";
import Dashboard from "./Dashboard";
import Repayment from "./Repayment";
import Notification from "./Notification";
import Contract from "./Contract";
import api from "./api";
import "./App.css";

function App() {
  const loanTypes = {
    home: { rate: 0.052, max: 50000000, term: 36 },
    car: { rate: 0.045, max: 20000000, term: 24 },
    education: { rate: 0.038, max: 1000000, term: 48 },
    business: { rate: 0.065, max: 100000000, term: 60 },
  };

  const [state, setState] = useState({
    currentUser: null,
    isAdmin: false,
    applications: [],
    users: {},
    tempApplicant: null,
  });

  const [page, setPage] = useState("home");
  const [notification, setNotification] = useState(null);
  const [loans, setLoans] = useState([]); // ⚠️ Hapa ndio muhimu

  // ----------------------
  // Notifications helper
  // ----------------------
  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ----------------------
  // Logout handler
  // ----------------------
  const handleLogout = () => {
    setState((prev) => ({ ...prev, currentUser: null, isAdmin: false }));
    setPage("home");
    showNotification("Logged out successfully", "success");
  };

  // ----------------------
  // Fetch loan applications
  // ----------------------
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await api.get("loans/");
        setLoans(res.data);
      } catch (err) {
        console.error("Error fetching loans:", err);
        showNotification("Failed to fetch loans", "error");
      }
    };
    fetchLoans();
  }, []);

  // ----------------------
  // Fetch users if admin
  // ----------------------
  useEffect(() => {
    if (!state.isAdmin) return;

    const fetchUsers = async () => {
      try {
        const res = await api.get("users/");
        const usersObj = {};
        res.data.forEach((user) => {
          usersObj[user.id] = user;
        });
        setState((prev) => ({ ...prev, users: usersObj }));
      } catch (err) {
        console.error("Error fetching users:", err);
        showNotification("Error fetching users", "error");
      }
    };
    fetchUsers();
  }, [state.isAdmin]);

  return (
    <div className="app-container">
      <Navbar setPage={setPage} handleLogout={handleLogout} state={state} />

      {notification && (
        <Notification message={notification.msg} type={notification.type} />
      )}

      <div className="content-wrapper">
        <div className="main-content">
          {page === "home" && <Home loanTypes={loanTypes} setPage={setPage} />}
          {page === "register" && (
            <Register
              setPage={setPage}
              state={state}
              setState={setState}
              showNotification={showNotification}
            />
          )}
          {page === "apply" && (
            <ApplyLoan
              state={state}
              setState={setState}
              setPage={setPage}
              showNotification={showNotification}
            />
          )}
          {page === "login" && (
            <Login
              setPage={setPage}
              state={state}
              setState={setState}
              showNotification={showNotification}
            />
          )}
          {page === "dashboard" && (
            <Dashboard
              state={state}
              setState={setState}
              setPage={setPage}
              api={api}
              loans={loans}
            />
          )}
          {page === "admin-login" && (
            <AdminLogin
              onAdminLogin={() => {
                setState((prev) => ({ ...prev, isAdmin: true }));
                setPage("admin-panel");
                showNotification("Admin logged in successfully", "success");
              }}
            />
          )}
          {page === "admin-panel" && (
            <AdminPanel
              state={state}
              setState={setState}
              showNotification={showNotification}
              api={api}
            />
          )}
          {page === "repayment" && (
            <Repayment
              state={state}
              setState={setState}
              showNotification={showNotification}
              api={api}
            />
          )}
          {page === "contract" && (
            <Contract
              state={state}
              setState={setState}
              setPage={setPage}
              showNotification={showNotification}
              api={api}
            />
          )}
        </div>
        <Sidebar state={state} />
      </div>
    </div>
  );
}

export default App;
