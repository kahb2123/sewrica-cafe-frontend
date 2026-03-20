
import React from 'react';
import './ConnectionStatus.css';

const ConnectionStatus = ({ connected }) => {
  return (
    <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
      {connected ? '🟢 Live' : '🔴 Reconnecting...'}
    </div>
  );
};

export default ConnectionStatus;