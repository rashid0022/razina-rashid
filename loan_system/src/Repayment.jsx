import React, { useState } from "react";
import api from "./api"; // Axios instance

const Repayment = ({ state, setState, showNotification }) => {
  const [paymentInfo, setPaymentInfo] = useState({ phone: "", amount: "" });
  const [error, setError] = useState("");

  // Only show approved loans for the current user
  const loans = state.applications.filter(
    (loan) =>
      loan.status === "approved" &&
      loan.applicant === state.currentUser.id &&
      loan.remainingBalance > 0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    const { phone, amount } = paymentInfo;

    // Validate phone number format
    if (!/^\+255\d{9}$/.test(phone.trim())) {
      setError("Phone number must be in the format +255XXXXXXXXX");
      return;
    }

    // Validate payment amount
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    const loan = loans[0];
    if (!loan) {
      setError("You have no approved loans to repay");
      return;
    }

    if (paymentAmount > loan.remainingBalance) {
      setError(
        `Payment cannot exceed remaining balance of $${loan.remainingBalance.toLocaleString()}`
      );
      return;
    }

    try {
      // Send payment to backend
      const res = await api.post("/payments/", {
        loan: loan.id,
        amount: paymentAmount,
        phone,
      });

      // Update state locally
      const updatedApplications = state.applications.map((l) => {
        if (l.id === loan.id) {
          return {
            ...l,
            remainingBalance: l.remainingBalance - paymentAmount,
            amountPaid: (l.amountPaid || 0) + paymentAmount,
            payments: [...(l.payments || []), res.data],
          };
        }
        return l;
      });

      setState({ ...state, applications: updatedApplications });
      setPaymentInfo({ phone: "", amount: "" });
      setError("");
      showNotification(
        `Payment of $${paymentAmount.toLocaleString()} processed successfully!`,
        "success"
      );
    } catch (err) {
      console.error("Payment error:", err);
      if (err.response) {
        setError(
          err.response.data.detail ||
            `Server Error: ${err.response.status}`
        );
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  return (
    <div className="repayment-box">
      <h2>Loan Repayment via Phone</h2>
      {loans.length === 0 ? (
        <p>You have no approved loans to repay</p>
      ) : (
        <>
          <p>
            Payment will be applied to the first active approved loan.
          </p>
          <div className="loan-details">
            <h3>Loan Details:</h3>
            <p>
              <strong>Loan Type:</strong> {loans[0].loanType}
            </p>
            <p>
              <strong>Approved Amount:</strong> $
              {loans[0].approvedAmount?.toLocaleString()}
            </p>
            <p>
              <strong>Remaining Balance:</strong> $
              {loans[0].remainingBalance?.toLocaleString()}
            </p>
            <p>
              <strong>Monthly Payment:</strong> $
              {loans[0].monthlyPayment?.toLocaleString()}
            </p>
          </div>
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handlePayment}>
        <input
          type="text"
          name="phone"
          placeholder="Phone Number (+255XXXXXXXXX)"
          value={paymentInfo.phone}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="amount"
          placeholder="Payment Amount"
          value={paymentInfo.amount}
          onChange={handleChange}
          required
          min="1"
          step="0.01"
        />
        <button type="submit">Pay</button>
      </form>
    </div>
  );
};

export default Repayment;
