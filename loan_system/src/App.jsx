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
import "./App.css";

export default function App() {
  const loanTypes = {
    home: { rate: 0.052, max: 500000, term: 36 },
    car: { rate: 0.045, max: 100000, term: 24 },
    education: { rate: 0.038, max: 200000, term: 48 },
    business: { rate: 0.065, max: 1000000, term: 60 },
  };

  const [state, setState] = useState(
    JSON.parse(localStorage.getItem("loanAppState")) || {
      currentUser: null,
      isAdmin: false,
      applications: [],
      users: {}, // { "Full Name": "password123" }
      tempApplicant: null
    }
  );

  const [page, setPage] = useState("home");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    localStorage.setItem("loanAppState", JSON.stringify(state));
  }, [state]);

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null, isAdmin: false }));
    setPage("home");
    showNotification("Logged out successfully", "success");
  };

  return (
    <div className="app-container">
      <Navbar setPage={setPage} handleLogout={handleLogout} state={state} />
      {notification && (
        <Notification message={notification.msg} type={notification.type} />
      )}
      <div className="content-wrapper">
        <div className="main-content">
          {page === "home" && <Home loanTypes={loanTypes} setPage={setPage} />}
          
          {page === "apply" && (
            <ApplyLoan
              state={state}
              setState={setState}
              showNotification={showNotification}
            />
          )}
          
          {page === "login" && (
            <Login
              state={state}
              setState={setState}
              setPage={setPage}
              showNotification={showNotification}
            />
          )}
          
          {page === "admin-login" && (
            <AdminLogin
              onAdminLogin={() => {
                setState(prev => ({ ...prev, isAdmin: true }));
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
            />
          )}

          {page === "dashboard" && (
            <Dashboard state={state} setState={setState} setPage={setPage} />
          )}

          {page === "repayment" && (
            <Repayment
              state={state}
              setState={setState}
              showNotification={showNotification}
            />
          )}
        </div>

        <Sidebar state={state} />
      </div>
    </div>
  );
}
