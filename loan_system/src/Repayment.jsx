import React, { useState } from "react";
import api, { fetchCSRF } from "./api"; 

const Repayment = ({ state, setState, showNotification }) => {
    const [paymentInfo, setPaymentInfo] = useState({ phone: "", amount: "" });
    const [error, setError] = useState("");

    const loans = state.applications.filter(
        app => app.status === "approved" && app.name === state.currentUser
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPaymentInfo(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setError("");

        const { phone, amount } = paymentInfo;

        if (!/^\+255\d{9}$/.test(phone.trim())) {
            setError("Phone number must be in the format +255XXXXXXXXX");
            return;
        }

        if (!amount || Number(amount) <= 0) {
            setError("Please enter a valid payment amount");
            return;
        }

        const paymentAmount = parseFloat(amount);
        const loan = loans[0];
        if (!loan) {
            setError("You have no approved loans to repay");
            return;
        }

        if (paymentAmount > loan.remainingBalance) {
            setError(`Payment cannot exceed the remaining balance of $${loan.remainingBalance.toLocaleString()}`);
            return;
        }

        try {
            await api.post("payments/", {
                loan: loan.id,
                amount: paymentAmount,
                phone
            });
            showNotification(`Payment of $${paymentAmount.toLocaleString()} successful!`, "success");
            setPaymentInfo({ phone: "", amount: "" });
        } catch (err) {
            console.error(err);
            setError("Payment failed. Please try again.");
        }
    };

    return (
        <div className="repayment-box">
            <h2>Loan Repayment via Phone</h2>
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
