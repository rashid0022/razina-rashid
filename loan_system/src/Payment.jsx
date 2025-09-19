import React, { useState } from "react";
import api from "./api"; // Axios instance yako iliyosetup CSRF

const PaymentForm = ({ loanId, currentBalance, onPaymentSuccess }) => {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [debt, setDebt] = useState(currentBalance); // initial remaining balance
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const trimmedPhone = phone.trim();

    // Validate phone number format
    if (!/^\+255\d{9}$/.test(trimmedPhone)) {
      setMessage("Phone number must be in the format +255XXXXXXXXX");
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setMessage("Please enter a valid payment amount");
      return;
    }

    if (paymentAmount > debt) {
      setMessage(`Payment cannot exceed remaining debt of $${debt.toLocaleString()}`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/payments/", {
        loan: loanId,
        amount: paymentAmount,
        phone: trimmedPhone,
      });

      // Update frontend debt
      const newDebt = debt - paymentAmount;
      setDebt(newDebt);
      setMessage(`Payment of $${paymentAmount.toLocaleString()} successful! Remaining balance: $${newDebt.toLocaleString()}`);

      // Optional callback to update parent component
      if (onPaymentSuccess) {
        onPaymentSuccess(res.data);
      }

      // Clear form
      setPhone("");
      setAmount("");
    } catch (err) {
      console.error("Payment error:", err);
      if (err.response) {
        setMessage(`Error: ${JSON.stringify(err.response.data)}`);
      } else {
        setMessage("Server error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form">
      <h2>Pay Your Debt</h2>
      <p><strong>Remaining Balance:</strong> ${debt.toLocaleString()}</p>
      {message && <p style={{ color: "green" }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Phone Number (+255XXXXXXXXX)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Payment Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="1"
          step="0.01"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Pay"}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;
