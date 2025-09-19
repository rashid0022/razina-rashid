import React, { useEffect, useState } from "react";
import api from "./api"; // Axios instance with CSRF
// ---------------------- Helpers ----------------------
const isValidNationalId = (id) => /^\d{20}$/.test(id);
const isValidPhone = (phone) => /^\+255\d{9}$/.test(phone);

const loanTypes = {
  home: { rate: 0.052, max: 50000000, term: 36 },
  car: { rate: 0.045, max: 20000000, term: 24 },
  education: { rate: 0.038, max: 1000000, term: 48 },
  business: { rate: 0.065, max: 100000000, term: 60 },
};

const AdminPanel = ({ state, setState, showNotification }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  // ---------------------- Fetch pending applications ----------------------
  const fetchApplications = async () => {
    try {
      const res = await api.get("/loans/?status=pending");
      setApplications(res.data);
    } catch (err) {
      console.error("Fetch applications error:", err);
      showNotification("Failed to fetch applications", "error");
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // ---------------------- Approve loan ----------------------
  const handleApprove = async (app) => {
    try {
      const loanTypeKey = app.loanType || "home";
      const loanDetails = loanTypes[loanTypeKey];
      const requestedAmount = app.requestedAmount || 0;
      const approvedAmount = Math.min(requestedAmount, loanDetails.max);
      const interestRate = loanDetails.rate * 100;
      const monthlyRate = loanDetails.rate / 12;

      const monthlyPayment = Math.max(
        100000,
        (approvedAmount * monthlyRate * Math.pow(1 + monthlyRate, loanDetails.term)) /
          (Math.pow(1 + monthlyRate, loanDetails.term) - 1)
      ).toFixed(2);

      const totalPayable = monthlyPayment * loanDetails.term;

      const payload = {
        status: "approved",
        approvedAmount,
        interestRate,
        monthlyPayment: parseFloat(monthlyPayment),
        totalPayable: parseFloat(totalPayable),
        remainingBalance: parseFloat(totalPayable),
        amountPaid: 0,
        term: loanDetails.term,
      };

      await api.patch(`/loans/${app.id}/`, payload);
      showNotification("Application approved!", "success");
      fetchApplications();
    } catch (err) {
      console.error("Approve error:", err);
      showNotification("Failed to approve application", "error");
    }
  };

  // ---------------------- Reject loan ----------------------
  const handleReject = async (app) => {
    try {
      await api.patch(`/loans/${app.id}/`, { status: "rejected" });
      showNotification("Application rejected!", "success");
      fetchApplications();
    } catch (err) {
      console.error("Reject error:", err);
      showNotification("Failed to reject application", "error");
    }
  };

  // ---------------------- View sponsor details ----------------------
  const viewSponsorDetails = (app) => setSelectedApp(app);

  // ---------------------- Render ----------------------
  return (
    <div className="admin-box">
      <h2>Admin Panel</h2>

      {applications.length === 0 && <p>No pending applications</p>}

      {applications.length > 0 && (
        <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th>Name</th>
              <th>National ID</th>
              <th>Phone Number</th>
              <th>Loan Type</th>
              <th>Requested Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.name || app.username || "N/A"}</td>
                <td>
                  {app.nationalId || "N/A"}{" "}
                  {isValidNationalId(app.nationalId) ? (
                    <span style={{ color: "green" }}>✅</span>
                  ) : (
                    <span style={{ color: "red" }}>❌</span>
                  )}
                </td>
                <td>
                  {app.phone || "N/A"}{" "}
                  {isValidPhone(app.phone) ? (
                    <span style={{ color: "green" }}>✅</span>
                  ) : (
                    <span style={{ color: "red" }}>❌</span>
                  )}
                </td>
                <td>{app.loanType || "N/A"}</td>
                <td>${(app.requestedAmount ?? 0).toLocaleString()}</td>
                <td>{app.status || "pending"}</td>
                <td>
                  <div className="admin-actions">
                    <button onClick={() => handleApprove(app)}>Approve</button>
                    <button onClick={() => handleReject(app)}>Reject</button>
                    <button onClick={() => viewSponsorDetails(app)}>View Sponsor</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedApp && (
        <div
          className="sponsor-details"
          style={{ marginTop: 20, padding: 15, border: "1px solid #ddd", borderRadius: 5, backgroundColor: "#f9f9f9" }}
        >
          <h3>Sponsor Details for {selectedApp.name || selectedApp.username || "N/A"}</h3>
          <p>
            <strong>Name:</strong> {selectedApp.sponsorName || "N/A"}
          </p>
          <p>
            <strong>Address:</strong> {selectedApp.sponsorAddress || "N/A"}
          </p>
          <p>
            <strong>National ID:</strong> {selectedApp.sponsorNationalId || "N/A"}{" "}
            {isValidNationalId(selectedApp.sponsorNationalId) ? (
              <span style={{ color: "green" }}>✅</span>
            ) : (
              <span style={{ color: "red" }}>❌</span>
            )}
          </p>
          <p>
            <strong>Phone:</strong> {selectedApp.sponsorPhone || "N/A"}{" "}
            {isValidPhone(selectedApp.sponsorPhone) ? (
              <span style={{ color: "green" }}>✅</span>
            ) : (
              <span style={{ color: "red" }}>❌</span>
            )}
          </p>
          <p>
            <strong>Email:</strong> {selectedApp.sponsorEmail || "N/A"}
          </p>
          <p>
            <strong>Photo:</strong>
            <br />
            {selectedApp.sponsorPhoto ? (
              typeof selectedApp.sponsorPhoto === "string" ? (
                <img src={selectedApp.sponsorPhoto} alt="Sponsor" style={{ width: 120, marginTop: 5, borderRadius: 5 }} />
              ) : (
                <img src={URL.createObjectURL(selectedApp.sponsorPhoto)} alt="Sponsor" style={{ width: 120, marginTop: 5, borderRadius: 5 }} />
              )
            ) : (
              "No photo uploaded"
            )}
          </p>
          <button onClick={() => setSelectedApp(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
