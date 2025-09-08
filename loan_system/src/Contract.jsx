import React from "react";

const Contract = ({ state, setPage }) => {
  // Pata mkopo wa sasa wa mtumiaji ulioidhinishwa
  const approvedLoan = state.applications.find(
    app => app.name === state.currentUser && app.status === "approved"
  );

  if (!approvedLoan) return <p>No contract available</p>;

  return (
    <div className="contract-box">
      <h2>Loan Contract Agreement</h2>
      <p><strong>Applicant:</strong> {approvedLoan.name}</p>
      <p><strong>Loan Type:</strong> {approvedLoan.loanType}</p>
      <p><strong>Approved Amount:</strong> ${approvedLoan.approvedAmount}</p>
      <p><strong>Interest Rate:</strong> {approvedLoan.interestRate}%</p>
      <p><strong>Monthly Payment:</strong> ${approvedLoan.monthlyPayment}</p>
      <p><strong>Term:</strong> {approvedLoan.term} months</p>
      <p><strong>Sponsor:</strong> {approvedLoan.sponsorName || "None"}</p>

      <p style={{ marginTop: "20px" }}>
        By accepting this contract, the applicant agrees to repay the loan 
        in monthly installments until the balance is cleared.
      </p>

      <button onClick={() => setPage("dashboard")}>Back to Dashboard</button>
    </div>
  );
};

export default Contract;