// frontend/src/components/TelegramRegistration.tsx
import React, { useState } from 'react';
import { registerTelegram } from '../services/api';
import { TelegramRegistrationPayload } from '@tempwallet/shared';

const TelegramRegistration: React.FC = () => {
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!chatId) {
      setError('Please enter your Telegram Chat ID');
      return;
    }

    try {
      const payload: TelegramRegistrationPayload = { chatId };
      await registerTelegram(payload);
      setMessage('Telegram Chat ID registered successfully!');
      setChatId('');
    } catch (err) {
      setError('Failed to register Telegram Chat ID. Please try again.');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Register for Telegram Notifications</h2>
      <p>
        1. Open Telegram and start a conversation with{' '}
        <a href="https://t.me/IExecWeb3TelegramBot" target="_blank" rel="noopener noreferrer">
          @IExecWeb3TelegramBot
        </a>.
        <br />
        2. Copy the Chat ID provided by the bot.
        <br />
        3. Paste it below to enable transaction notifications.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Telegram Chat ID:
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="Enter your Chat ID"
          />
        </label>
        <button type="submit">Register</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default TelegramRegistration;