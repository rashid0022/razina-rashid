import React from "react";

const Contract = ({ state, setState, setPage, showNotification }) => {
  // Pata mkopo wa sasa wa mtumiaji ulioidhinishwa
  const approvedLoan = state.applications.find(
    app => app.name === state.currentUser && app.status === "approved"
  );

  if (!approvedLoan) return <p>No contract available</p>;

  const handleAgree = () => {
    // Weka status ya contract kuwa "accepted"
    const updatedApplications = state.applications.map(app => {
      if (app.id === approvedLoan.id) {
        return { ...app, contractAccepted: true };
      }
      return app;
    });

    setState({ ...state, applications: updatedApplications });
    showNotification("Contract accepted successfully!", "success");
    setPage("dashboard");
  };

  const handleDisagree = () => {
    // Weka status ya contract kuwa "rejected"
    const updatedApplications = state.applications.map(app => {
      if (app.id === approvedLoan.id) {
        return { ...app, contractAccepted: false, status: "contract_rejected" };
      }
      return app;
    });

    setState({ ...state, applications: updatedApplications });
    showNotification("Contract rejected. Loan application cancelled.", "error");
    setPage("dashboard");
  };

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

      <div className="contract-section">
        <h3>Terms and Conditions</h3>
        <p>
          1. By accepting this contract, the applicant agrees to repay the loan 
          in monthly installments until the balance is cleared.
        </p>
        <p>
          2. Failure to make payments on time may result in additional fees and 
          negatively impact your credit score.
        </p>
        <p>
          3. The lender reserves the right to take legal action in case of 
          default on payments.
        </p>
        <p>
          4. Early repayment is allowed without penalty.
        </p>
      </div>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button 
          onClick={handleAgree}
          style={{ background: "linear-gradient(90deg, #2ecc71, #27ae60)" }}
        >
          I Agree
        </button>
        <button 
          onClick={handleDisagree}
          style={{ background: "linear-gradient(90deg, #e74c3c, #c0392b)" }}
        >
          I Disagree
        </button>
      </div>
    </div>
  );
};

export default Contract;