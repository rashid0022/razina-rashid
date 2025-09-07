import React, { useState } from 'react';

const PaymentForm = () => {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [debt, setDebt] = useState(1000); // This is the user's current debt
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate phone number format
    if (!/^\+255\d{9}$/.test(phone.trim())) {
      setMessage('Phone number must be in the format +255XXXXXXXXX');
      return;
    }

    const payment = parseFloat(amount);
    if (!payment || payment <= 0) {
      setMessage('Please enter a valid payment amount');
      return;
    }

    if (payment > debt) {
      setMessage(`Payment cannot exceed remaining debt of $${debt}`);
      return;
    }

    // Update remaining debt
    setDebt(prevDebt => prevDebt - payment);
    setMessage(`Payment of $${payment} successful! Remaining balance: $${debt - payment}`);

    // Clear form
    setPhone('');
    setAmount('');
  };

  return (
    <div>
      <h2>Pay Your Debt</h2>
      <p>Remaining Balance: ${debt}</p>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Phone Number (+255XXXXXXXXX)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Payment Amount"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
        />
        <button type="submit">Pay</button>
      </form>
    </div>
  );
};

export default PaymentForm;
