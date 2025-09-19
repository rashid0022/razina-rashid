// src/App.jsx
import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Home from "./Home";
import ApplyLoan from "./ApplyLoan";
import Login from "./Login";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";
import Dashboard from "./Dashboard";
import Repayment from "./Repayment";
import Notification from "./Notification";
import Contract from "./Contract";
import api from "./api"; // Axios instance
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

  // ----------------------
  // Notifications helper
  // ----------------------
  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ----------------------
  // Persistent login + CSRF
  // ----------------------
  useEffect(() => {
    const init = async () => {
      // Get CSRF token
      try {
        const res = await api.get("/csrf/");
        api.defaults.headers.post["X-CSRFToken"] = res.data.csrfToken;
        console.log("CSRF token set:", res.data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
      }

      // Restore user from localStorage
      const savedUser = localStorage.getItem("currentUser");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setState((prev) => ({
          ...prev,
          currentUser: user,
          isAdmin: user.is_superuser || user.is_staff || user.is_admin,
        }));
        setPage(
          user.is_superuser || user.is_staff || user.is_admin
            ? "admin-panel"
            : "dashboard"
        );
      }
    };

    init();
  }, []);

  // ----------------------
  // Logout handler
  // ----------------------
  const handleLogout = () => {
    setState((prev) => ({ ...prev, currentUser: null, isAdmin: false }));
    localStorage.removeItem("currentUser");
    setPage("home");
    showNotification("Logged out successfully", "success");
  };

  // ----------------------
  // Fetch loan applications
  // ----------------------
  useEffect(() => {
    if (!state.currentUser) return;

    const fetchLoans = async () => {
      try {
        const res = await api.get("loans/");
        setState((prev) => ({ ...prev, applications: res.data }));
      } catch (err) {
        console.error("Error fetching loans:", err);
        showNotification("Error fetching loans", "error");
      }
    };
    fetchLoans();
  }, [state.currentUser]);

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
        showNotification("Error fetching users. Ensure you are logged in as admin.", "error");
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
          {/* Home page */}
          {page === "home" && <Home loanTypes={loanTypes} setPage={setPage} />}

          {/* Apply Loan */}
          {page === "apply" && (
            <ApplyLoan
              state={state}
              setState={setState}
              setPage={setPage}
              showNotification={showNotification}
              api={api}
            />
          )}

          {/* User Login */}
          {page === "login" && (
            <Login
              state={state}
              setState={setState}
              setPage={setPage}
              showNotification={showNotification}
              api={api}
            />
          )}

          {/* Admin Login */}
          {page === "admin-login" && (
            <AdminLogin
              onAdminLogin={(user) => {
                setState((prev) => ({ ...prev, currentUser: user, isAdmin: true }));
                localStorage.setItem("currentUser", JSON.stringify(user));
                setPage("admin-panel");
                showNotification("Admin logged in successfully", "success");
              }}
            />
          )}

          {/* Admin Panel */}
          {page === "admin-panel" && (
            <AdminPanel
              state={state}
              setState={setState}
              showNotification={showNotification}
              api={api}
            />
          )}

          {/* Dashboard */}
          {page === "dashboard" && (
            <Dashboard
              state={state}
              setState={setState}
              setPage={setPage}
              api={api}
            />
          )}

          {/* Repayment */}
          {page === "repayment" && (
            <Repayment
              state={state}
              setState={setState}
              showNotification={showNotification}
              api={api}
            />
          )}

          {/* Contract */}
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
