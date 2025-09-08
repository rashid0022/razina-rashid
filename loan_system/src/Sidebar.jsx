export default function Sidebar({ state }) {
  const userApplications = state.currentUser && state.currentUser !== "admin"
    ? state.applications.filter(app => app.name === state.currentUser)
    : [];

  const approvedApps = userApplications.filter(app => app.status === "approved");
  const pendingApps = userApplications.filter(app => app.status === "pending");

  const allPayments = [];
  approvedApps.forEach(app => {
    if (app.payments) {
      app.payments.forEach(payment => allPayments.push({ ...payment, loanType: app.loanType }));
    }
  });
  allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentPayments = allPayments.slice(0, 3);

  const progressPercent = approvedApps.length > 0
    ? ((approvedApps[0].totalPayable - approvedApps[0].remainingBalance) / approvedApps[0].totalPayable * 100).toFixed(1)
    : 0;

  return (
    <div className="sidebar">
      <h3>Loan Application Status</h3>
      {state.currentUser && state.currentUser !== "admin" ? (
        <div>
          {pendingApps.length > 0 && <p>You have {pendingApps.length} pending application(s)</p>}
          {approvedApps.length > 0 && <p>You have {approvedApps.length} approved loan(s)</p>}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <p>Overall progress: {progressPercent}%</p>
        </div>
      ) : <p>Login to view application status</p>}

      <h3>Active Loans</h3>
      {approvedApps.length > 0 ? (
        approvedApps.map(app => (
          <div key={app.id} className="loan-item">
            <p><strong>{app.loanType
  ? app.loanType.charAt(0).toUpperCase() + app.loanType.slice(1)
  : "Unknown Loan Type"} Loan</strong> - ${app.approvedAmount}</p>
            <p>Next payment: ${app.monthlyPayment} due in 30 days</p>
          </div>
        ))
      ) : <p>No active loans</p>}

      <h3>Recent Transactions</h3>
      {recentPayments.length > 0 ? (
        recentPayments.map((p, i) => (
          <div key={i} className="transaction">
            <p>{p.loanType} Payment - ${p.amount} <span style={{color:'#2ecc71'}}>Completed</span></p>
            <p>{p.date}</p>
          </div>
        ))
      ) : <p>No recent transactions</p>}
    </div>
  );
}