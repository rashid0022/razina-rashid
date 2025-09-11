import React, { useEffect, useState } from "react";

// Helper functions for validation
function isValidNationalId(id) {
  return /^\d{20}$/.test(id);
}

function isValidPhone(phone) {
  return /^\+255\d{9}$/.test(phone);
}

const loanTypes = {
  home: { rate: 0.052, max: 50000000, term: 36 },
  car: { rate: 0.045, max: 20000000, term: 24 },
  education: { rate: 0.038, max: 1000000, term: 48 },
  business: { rate: 0.065, max: 100000000, term: 60 }
};

const AdminPanel = ({ state, setState, showNotification }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  // Fetch pending applications
  const fetchApplications = () => {
    setApplications(state.applications.filter(app => app.status === "pending"));
  };

  // ✅ Approve loan with calculations
  const handleApprove = (id) => {
    const updatedApplications = state.applications.map(app => {
      if (app.id === id) {
        const loanDetails = loanTypes[app.loanType];
        const approvedAmount = Math.min(app.requestedAmount, loanDetails.max);
        const interestRate = loanDetails.rate * 100;

        // Monthly payment (annuity formula)
        const monthlyRate = loanDetails.rate / 12;
        const monthlyPayment = Math.max(
          100000, // minimum 100,000
          (approvedAmount * monthlyRate * Math.pow(1 + monthlyRate, loanDetails.term)) /
            (Math.pow(1 + monthlyRate, loanDetails.term) - 1)
        ).toFixed(2);

        // Total payable
        const totalPayable = monthlyPayment * loanDetails.term;

        return {
          ...app,
          status: "approved",
          approvedAmount,
          interestRate,
          monthlyPayment: parseFloat(monthlyPayment),
          remainingBalance: parseFloat(totalPayable),
          totalPayable: parseFloat(totalPayable),
          amountPaid: 0,
          term: loanDetails.term
        };
      }
      return app;
    });

    // Update global state
    setState({ ...state, applications: updatedApplications });
    // Refresh pending list immediately
    setApplications(updatedApplications.filter(app => app.status === "pending"));
    setSelectedApp(null);
    showNotification("Application approved!", "success");
  };

  // ❌ Reject loan
  const handleReject = (id) => {
    const updatedApplications = state.applications.map(app =>
      app.id === id ? { ...app, status: "rejected" } : app
    );

    setState({ ...state, applications: updatedApplications });
    setApplications(updatedApplications.filter(app => app.status === "pending"));
    setSelectedApp(null);
    showNotification("Application rejected!", "success");
  };

  const viewSponsorDetails = (app) => {
    setSelectedApp(app);
  };

  useEffect(() => {
    fetchApplications();
  }, [state.applications]);

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
                <td>${app.requestedAmount?.toLocaleString() || "0"}</td>
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
