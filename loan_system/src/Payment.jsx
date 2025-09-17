import React, { useState } from 'react';
import api, { getCSRFToken } from '../api';

const PaymentForm = () => {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [debt, setDebt] = useState(1000);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

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

    try {
      // send to backend, assuming loan id 1 for demo
      await api.post('payments/', {
        loan: 1,
        amount: payment,
        payment_date: new Date().toISOString().split('T')[0],
        phone
      }, {
        headers: { 'X-CSRFToken': getCSRFToken() }
      });

      setDebt(prevDebt => prevDebt - payment);
      setMessage(`Payment of $${payment} successful! Remaining balance: $${debt - payment}`);
      setPhone('');
      setAmount('');
    } catch (err) {
      setMessage('Payment failed on server.');
    }
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
