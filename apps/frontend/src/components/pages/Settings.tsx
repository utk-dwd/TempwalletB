// frontend/src/components/pages/Settings.tsx
import React from 'react';
import TelegramRegistration from '../TelegramRegistration';

const Settings: React.FC = () => (
  <div style={{ padding: '20px' }}>
    <h1>Settings</h1>
    <h2>Telegram Notifications</h2>
    <TelegramRegistration />
  </div>
);

export default Settings;