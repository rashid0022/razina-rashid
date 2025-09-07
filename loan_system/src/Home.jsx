export default function Home({ loanTypes, setPage }) {
  return (
    <div className="dashboard-box">
      <h2>Welcome to Loan Management System</h2>
      <p>Select a loan type to apply for:</p>

      <div className="loan-types">
        {Object.keys(loanTypes).map(type => (
          <div key={type} className="loan-type" onClick={() => setPage("apply")}>
            <i className={`fas fa-${type === "home" ? "home" : type === "car" ? "car" : type === "education" ? "graduation-cap" : "business-time"}`}></i>
            <h3>{type.charAt(0).toUpperCase() + type.slice(1)} Loan</h3>
            <p>Up to ${loanTypes[type].max}</p>
            <p>{(loanTypes[type].rate*100).toFixed(1)}% interest</p>
          </div>
        ))}
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Apply for a Loan</h3>
          <p>Submit your loan application online</p>
          <button onClick={() => setPage("apply")}>Apply Now</button>
        </div>
        <div className="dashboard-card">
          <h3>Already Applied?</h3>
          <p>Login to check your application status</p>
          <button onClick={() => setPage("login")}>Applicant Login</button>
        </div>
        <div className="dashboard-card">
          <h3>Admin Access</h3>
          <p>Administrator login portal</p>
          <button onClick={() => setPage("admin-login")}>Admin Login</button>
        </div>
      </div>
    </div>
  );
}
