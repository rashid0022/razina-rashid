import React, { useState } from "react";

const Repayment = ({ state, setState, showNotification }) => {
    const [paymentInfo, setPaymentInfo] = useState({ phone: "", amount: "" });
    const [error, setError] = useState("");

    // Get current user's approved loans
    const loans = state.applications.filter(
        app => app.status === "approved" && app.name === state.currentUser
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPaymentInfo(prev => ({ ...prev, [name]: value }));
    };

    const handlePayment = (e) => {
        e.preventDefault();

        const { phone, amount } = paymentInfo;

        // Validate phone number
        if (!/^\+255\d{9}$/.test(phone.trim())) {
            setError("Phone number must be in format +255XXXXXXXXX");
            return;
        }

        // Validate amount
        if (!amount || Number(amount) <= 0) {
            setError("Please enter a valid payment amount");
            return;
        }

        const paymentAmount = parseFloat(amount);

        // Apply payment to the first active loan
        const loan = loans[0];
        if (!loan) {
            setError("You have no approved loans to pay");
            return;
        }

        if (paymentAmount > loan.remainingBalance) {
            setError(`Payment cannot exceed remaining balance of $${loan.remainingBalance}`);
            return;
        }

        const updatedApplications = state.applications.map(l => {
            if (l.id === loan.id) {
                const newBalance = l.remainingBalance - paymentAmount;
                const newPayment = {
                    amount: paymentAmount,
                    date: new Date().toLocaleDateString(),
                    loanType: l.loanType,
                    phone
                };

                return {
                    ...l,
                    remainingBalance: newBalance,
                    amountPaid: l.amountPaid + paymentAmount,
                    payments: [...(l.payments || []), newPayment]
                };
            }
            return l;
        });

        setState({ ...state, applications: updatedApplications });
        setPaymentInfo({ phone: "", amount: "" });
        setError("");
        showNotification(`Payment of $${paymentAmount} processed successfully!`, "success");
    };

    return (
        <div className="repayment-box">
            <h2>Loan Repayment via Phone</h2>
            {loans.length === 0 ? (
                <p>You have no approved loans to pay</p>
            ) : (
                <p>You have one or more approved loans. Payment will be applied to the first active loan.</p>
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
                />
                <button type="submit">Pay</button>
            </form>
        </div>
    );
};

export default Repayment;
 