import React, { useEffect, useState } from "react";

// Helper functions for validation
function isValidNationalId(id) {
  return /^\d{20}$/.test(id);
}

function isValidPhone(phone) {
  return /^\d{10}$/.test(phone); // assuming local format without country code
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

  // Fetch pending applications safely
  const fetchApplications = () => {
    if (Array.isArray(state.applications)) {
      setApplications(state.applications.filter(app => app.status === "pending"));
    } else {
      console.error("Applications data is not an array:", state.applications);
      setApplications([]);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [state.applications]);

  const handleApprove = (id) => {
    const updatedApplications = state.applications.map(app => {
      if (app.id === id) {
        const loanDetails = loanTypes[app.loan_type];
        const approvedAmount = Math.min(app.requested_amount, loanDetails.max);
        const monthlyRate = loanDetails.rate / 12;
        const monthlyPayment = Math.max(
          100000,
          (approvedAmount * monthlyRate * Math.pow(1 + monthlyRate, loanDetails.term)) /
          (Math.pow(1 + monthlyRate, loanDetails.term) - 1)
        ).toFixed(2);
        const totalPayable = monthlyPayment * loanDetails.term;

        return {
          ...app,
          status: "approved",
          approvedAmount,
          interestRate: loanDetails.rate * 100,
          monthlyPayment: parseFloat(monthlyPayment),
          remainingBalance: parseFloat(totalPayable),
          totalPayable: parseFloat(totalPayable),
          amountPaid: 0,
          term: loanDetails.term
        };
      }
      return app;
    });

    setState({ ...state, applications: updatedApplications });
    setApplications(updatedApplications.filter(app => app.status === "pending"));
    setSelectedApp(null);
    showNotification("Application approved!", "success");
  };

  const handleReject = (id) => {
    const updatedApplications = state.applications.map(app =>
      app.id === id ? { ...app, status: "rejected" } : app
    );
    setState({ ...state, applications: updatedApplications });
    setApplications(updatedApplications.filter(app => app.status === "pending"));
    setSelectedApp(null);
    showNotification("Application rejected!", "success");
  };

  const viewSponsorDetails = (app) => setSelectedApp(app);

  const getMediaUrl = (path) => path ? `http://127.0.0.1:8000${path}` : null;

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
                <td>{app.applicant ? `${app.applicant.first_name} ${app.applicant.last_name}` : "N/A"}</td>
                <td>
                  {app.applicant?.national_id || "❌"}{" "}
                  {isValidNationalId(app.applicant?.national_id || "") ? "✅" : "❌"}
                </td>
                <td>
                  {app.applicant?.phone || "❌"}{" "}
                  {isValidPhone(app.applicant?.phone || "") ? "✅" : "❌"}
                </td>
                <td>{app.loan_type || "N/A"}</td>
                <td>{app.requested_amount?.toLocaleString() || "0"}</td>
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
          <h3>Sponsor Details for {selectedApp.applicant ? `${selectedApp.applicant.first_name} ${selectedApp.applicant.last_name}` : "N/A"}</h3>
          <p><strong>Name:</strong> {selectedApp.sponsor_name}</p>
          <p><strong>Address:</strong> {selectedApp.sponsor_address}</p>
          <p>
            <strong>National ID:</strong> {selectedApp.sponsor_national_id}{" "}
            {isValidNationalId(selectedApp.sponsor_national_id) ? "✅" : "❌"}
          </p>
          <p>
            <strong>Phone:</strong> {selectedApp.sponsor_phone}{" "}
            {isValidPhone(selectedApp.sponsor_phone) ? "✅" : "❌"}
          </p>
          <p><strong>Email:</strong> {selectedApp.sponsor_email}</p>
          <p>
            <strong>Photo:</strong><br />
            {selectedApp.sponsor_photo ? (
              <img
                src={typeof selectedApp.sponsor_photo === "string" ? getMediaUrl(selectedApp.sponsor_photo) : URL.createObjectURL(selectedApp.sponsor_photo)}
                alt="Sponsor"
                style={{ width: "120px", marginTop: "5px", borderRadius: "5px" }}
              />
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
