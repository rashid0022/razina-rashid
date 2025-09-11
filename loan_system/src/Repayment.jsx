import React, { useState } from "react";

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

    const handlePayment = (e) => {
        e.preventDefault();

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

        
        const remainingAfterPayment = loan.remainingBalance - paymentAmount;
        if (remainingAfterPayment < 0) {
            setError(`Payment exceeds remaining balance. Please enter an amount not greater than $${loan.remainingBalance.toLocaleString()}`);
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
                    amountPaid: (l.amountPaid || 0) + paymentAmount,
                    payments: [...(l.payments || []), newPayment]
                };
            }
            return l;
        });

        setState({ ...state, applications: updatedApplications });
        setPaymentInfo({ phone: "", amount: "" });
        setError("");
        showNotification(`Payment of $${paymentAmount.toLocaleString()} processed successfully!`, "success");
    };

    return (
        <div className="repayment-box">
            <h2>Loan Repayment via Phone</h2>
            {loans.length === 0 ? (
                <p>You have no approved loans to repay</p>
            ) : (
                <>
                    <p>You have approved loans. Payment will be applied to the first active loan.</p>
                    <div className="loan-details">
                        <h3>Loan Details:</h3>
                        <p><strong>Loan Type:</strong> {loans[0].loanType}</p>
                        <p><strong>Approved Amount:</strong> ${loans[0].approvedAmount?.toLocaleString()}</p>
                        <p><strong>Remaining Balance:</strong> ${loans[0].remainingBalance?.toLocaleString()}</p>
                        <p><strong>Monthly Payment:</strong> ${loans[0].monthlyPayment?.toLocaleString()}</p>
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
