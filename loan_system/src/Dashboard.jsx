import React, { useState, useEffect } from "react";

const Dashboard = ({ state, setState, setPage }) => {
    const [userLoans, setUserLoans] = useState([]);

    useEffect(() => {
        // Filter loans for the current user
        const userApplications = state.applications.filter(app => 
            app.name === state.currentUser
        );
        setUserLoans(userApplications);
    }, [state.applications, state.currentUser]);

    return (
        <div className="dashboard-box">
            <h2>My Loans</h2>
            {userLoans.length === 0 ? (
                <p>No loans found</p>
            ) : (
                userLoans.map(loan => (
                    <div key={loan.id} className="dashboard-card">
                        <h3>{loan.loanType} Loan</h3>
                        <p><strong>Requested Amount:</strong> ${loan.requestedAmount}</p>
                        <p><strong>Approved Amount:</strong> ${loan.approvedAmount}</p>
                        <p><strong>Status:</strong> {loan.status}</p>
                        <p><strong>Interest Rate:</strong> {loan.interestRate}</p>
                        <p><strong>Monthly Payment:</strong> ${loan.monthlyPayment}</p>
                        <p><strong>Remaining Balance:</strong> ${loan.remainingBalance}</p>
                        
                        {loan.status === "approved" && (
                            <button onClick={() => setPage("repayment")}>
                                Make Payment
                            </button>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default Dashboard;