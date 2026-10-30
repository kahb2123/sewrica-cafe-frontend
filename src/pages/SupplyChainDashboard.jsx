// src/pages/SupplyChainDashboard.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import StockTab from './admin/tabs/StockTab';
import '../pages/admin/AdminDashboard.css';

const SupplyChainDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="staff-dashboard">
      <div className="dashboard-header" style={{ background: 'linear-gradient(135deg, #1e2b3a, #2c3e50)', color: 'white', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0 }}>Supply Chain Dashboard</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{user?.name} — Supply Chain</p>
          </div>
          <button onClick={logout} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 6, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>
      <div className="staff-content" style={{ padding: 20 }}>
        <StockTab />
      </div>
    </div>
  );
};

export default SupplyChainDashboard;
