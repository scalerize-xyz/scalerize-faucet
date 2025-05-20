'use client';

import './App.css';

import React, { useState } from 'react';

export default function Home() {
  const [address, setAddress] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const requestFaucet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('Sending request...');
    try {
      const response = await fetch(`/api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Sent! TxHash: ${data.txHash}`);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Fetch failed: ${error.message}`);
    }
  };

  return (
    <div className='App'>
      <header className='App-header'>
        <h1>Ethereum Faucet</h1>
        <form onSubmit={requestFaucet} className='faucet-form'>
          <input
            type='text'
            placeholder='0xYourAddress'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className='address-input'
          />
          <button type='submit' className='request-button'>
            Request 0.1 ETH
          </button>
        </form>
        {message && <p className='message'>{message}</p>}
      </header>
    </div>
  );
}
