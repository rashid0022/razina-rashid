import React from "react";

const Contract = ({ loan, setPage }) => {
  if (!loan) return <p>No contract available</p>;

  return (
    <div className="contract-box">
      <h2>Loan Contract Agreement</h2>
      <p><strong>Applicant:</strong> {loan.name}</p>
      <p><strong>Loan Type:</strong> {loan.loanType}</p>
      <p><strong>Approved Amount:</strong> ${loan.approvedAmount}</p>
      <p><strong>Interest Rate:</strong> {loan.interestRate}%</p>
      <p><strong>Monthly Payment:</strong> ${loan.monthlyPayment}</p>
      <p><strong>Term:</strong> {loan.term} months</p>
      <p><strong>Sponsor:</strong> {loan.sponsorName || "None"}</p>

      <p style={{ marginTop: "20px" }}>
        By accepting this contract, the applicant agrees to repay the loan 
        in monthly installments until the balance is cleared.
      </p>

      <button onClick={() => setPage("dashboard")}>Back to Dashboard</button>
    </div>
  );
};

export default Contract;
