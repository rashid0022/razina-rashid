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

  
  let progressPercent = 0;
  let nextPaymentDue = "No upcoming payments";

  if (approvedApps.length > 0) {
    const app = approvedApps[0];
    const principal = app.approvedAmount || 0;
    const interestRate = app.interestRate || 0;
    const term = app.term || 1;
    const remainingBalance = app.remainingBalance || 0;
    
   
    const totalPayable = principal * (1 + (interestRate / 100) * (term / 12));
    
   
    const paidAmount = totalPayable - remainingBalance;
    
    
    progressPercent = totalPayable > 0 ? ((paidAmount / totalPayable) * 100) : 0;
    
    
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 30);
    nextPaymentDue = `Payment of $${app.monthlyPayment?.toLocaleString() || 0} is due on ${nextDueDate.toLocaleDateString()}`;
  }

  return (
    <div className="sidebar">
      <h3>Loan Application Status</h3>
      {state.currentUser && state.currentUser !== "admin" ? (
        <div>
          {pendingApps.length > 0 && <p>You have {pendingApps.length} pending loan application(s)</p>}
          {approvedApps.length > 0 && <p>You have {approvedApps.length} approved loan(s)</p>}
          
          {approvedApps.length > 0 && (
            <>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p>Overall progress: {progressPercent.toFixed(1)}%</p>
              <p>{nextPaymentDue}</p>
            </>
          )}
        </div>
      ) : <p>Please log in to view your loan application status</p>}

      <h3>Active Loans</h3>
      {approvedApps.length > 0 ? (
        approvedApps.map(app => (
          <div key={app.id} className="loan-item">
            <p><strong>{app.loanType
              ? app.loanType.charAt(0).toUpperCase() + app.loanType.slice(1)
              : "Loan"} </strong> - ${app.approvedAmount?.toLocaleString() || 0}</p>
            <p>Remaining balance: ${app.remainingBalance?.toLocaleString() || 0}</p>
          </div>
        ))
      ) : <p>No active loans</p>}

      <h3>Recent Payments</h3>
      {recentPayments.length > 0 ? (
        recentPayments.map((p, i) => (
          <div key={i} className="transaction">
            <p>{p.loanType} payment - ${p.amount?.toLocaleString() || 0} <span style={{color:'#2ecc71'}}>Completed</span></p>
            <p>{p.date}</p>
          </div>
        ))
      ) : <p>No recent payments</p>}
    </div>
  );
}
