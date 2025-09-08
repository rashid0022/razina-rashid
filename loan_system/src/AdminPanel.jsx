import React, { useEffect, useState } from "react";

// Helper functions for validation
function isValidNationalId(id) {
  return /^\d{20}$/.test(id);
}

function isValidPhone(phone) {
  return /^\+255\d{9}$/.test(phone);
}

const loanTypes = {
  home: { rate: 0.052, max: 500000, term: 36 },
  car: { rate: 0.045, max: 200000, term: 24 },
  education: { rate: 0.035, max: 100000, term: 48 },
  business: { rate: 0.06, max: 300000, term: 30 }
};

const AdminPanel = ({ state, setState, showNotification }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchApplications = () => {
    setApplications(state.applications.filter(app => app.status === "pending"));
  };

  // ✅ Approve loan with calculations
  const handleApprove = (id) => {
    const updatedApplications = state.applications.map(app => {
      if (app.id === id) {
        const loanDetails = loanTypes[app.loanType];
        const approvedAmount = Math.min(app.requestedAmount, loanDetails.max);
        const interestRate = loanDetails.rate * 100; // in %
        const monthlyPayment = (
          (approvedAmount * (1 + loanDetails.rate * (loanDetails.term / 12))) / loanDetails.term
        ).toFixed(2);

        return {
          ...app,
          status: "approved",
          approvedAmount,
          interestRate,
          monthlyPayment,
          remainingBalance: approvedAmount,
          amountPaid: 0,
          term: loanDetails.term
        };
      }
      return app;
    });

    setState({ ...state, applications: updatedApplications });
    fetchApplications();
    setSelectedApp(null);
    showNotification("Application approved!", "success");
  };

  const handleReject = (id) => {
    const updatedApplications = state.applications.map(app =>
      app.id === id ? { ...app, status: "rejected" } : app
    );
    setState({ ...state, applications: updatedApplications });
    fetchApplications();
    setSelectedApp(null);
    showNotification("Application rejected!", "success");
  };

  const viewSponsorDetails = (app) => {
    setSelectedApp(app);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="admin-box">
      <h2>Admin Panel</h2>

      {applications.length === 0 && <p>No pending applications</p>}

      {applications.length > 0 && (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
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
            {applications.map(app => (
              <tr key={app.id}>
                <td>{app.name}</td>
                <td>
                  {app.nationalId}{" "}
                  {isValidNationalId(app.nationalId) ? (
                    <span style={{ color: "green" }}>✅</span>
                  ) : (
                    <span style={{ color: "red" }}>❌</span>
                  )}
                </td>
                <td>
                  {app.phone}{" "}
                  {isValidPhone(app.phone) ? (
                    <span style={{ color: "green" }}>✅</span>
                  ) : (
                    <span style={{ color: "red" }}>❌</span>
                  )}
                </td>
                <td>{app.loanType}</td>
                <td>${app.requestedAmount}</td>
                <td>{app.status}</td>
                <td>
                  <div className="admin-actions">
                    <button className="approve-btn" onClick={() => handleApprove(app.id)}>Approve</button>
                    <button className="reject-btn" onClick={() => handleReject(app.id)}>Reject</button>
                    <button className="view-btn" onClick={() => viewSponsorDetails(app)}>View Sponsor</button>
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
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9"
          }}
        >
          <h3>Sponsor Details for {selectedApp.name}</h3>
          <p><strong>Name:</strong> {selectedApp.sponsorName}</p>
          <p><strong>Address:</strong> {selectedApp.sponsorAddress}</p>
          <p>
            <strong>National ID:</strong> {selectedApp.sponsorNationalId}{" "}
            {isValidNationalId(selectedApp.sponsorNationalId) ? (
              <span style={{ color: "green" }}>✅</span>
            ) : (
              <span style={{ color: "red" }}>❌</span>
            )}
          </p>
          <p>
            <strong>Phone:</strong> {selectedApp.sponsorPhone}{" "}
            {isValidPhone(selectedApp.sponsorPhone) ? (
              <span style={{ color: "green" }}>✅</span>
            ) : (
              <span style={{ color: "red" }}>❌</span>
            )}
          </p>
          <p><strong>Email:</strong> {selectedApp.sponsorEmail}</p>
          <p>
            <strong>Photo:</strong><br />
            {selectedApp.sponsorPhoto ? (
              typeof selectedApp.sponsorPhoto === "string" ? (
                <img
                  src={selectedApp.sponsorPhoto}
                  alt="Sponsor"
                  style={{ width: "120px", marginTop: "5px", borderRadius: "5px" }}
                />
              ) : (
                <img
                  src={URL.createObjectURL(selectedApp.sponsorPhoto)}
                  alt="Sponsor"
                  style={{ width: "120px", marginTop: "5px", borderRadius: "5px" }}
                />
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
