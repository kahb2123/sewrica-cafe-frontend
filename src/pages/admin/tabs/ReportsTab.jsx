// src/pages/admin/tabs/ReportsTab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../../services/api';
import './ReportsTab.css';

const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatMoney = (value) => `$${money.format(Number(value) || 0)}`;

const toInputDate = (date) => date.toISOString().split('T')[0];
const daysAgo = (n) => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return toInputDate(date);
};

const PRESETS = [
  { key: 'today', label: 'Today', range: () => [daysAgo(0), daysAgo(0)] },
  { key: '7d', label: 'Last 7 days', range: () => [daysAgo(6), daysAgo(0)] },
  { key: '30d', label: 'Last 30 days', range: () => [daysAgo(29), daysAgo(0)] },
  { key: 'month', label: 'This month', range: () => {
    const start = new Date();
    start.setDate(1);
    return [toInputDate(start), daysAgo(0)];
  } }
];

const TABS = [
  { key: 'items', label: 'Menu Items Report' },
  { key: 'staff', label: 'Staff Performance Report' }
];

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'cook', label: 'Chef' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'cashier', label: 'Cashier' }
];

const ReportsTab = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [preset, setPreset] = useState('7d');
  const [range, setRange] = useState(() => ({ start: daysAgo(6), end: daysAgo(0) }));

  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const applyPreset = (key) => {
    const match = PRESETS.find((entry) => entry.key === key);
    if (!match) return;
    setPreset(key);
    setRange({ start: match.range()[0], end: match.range()[1] });
  };

  const handleRangeChange = (field, value) => {
    setPreset('custom');
    setRange((current) => ({ ...current, [field]: value }));
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await adminService.getItemPerformance({ start: range.start, end: range.end });
      setItems(response?.data?.items || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load item performance');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      const response = await adminService.getStaffPerformance({ start: range.start, end: range.end });
      setStaff(response?.data?.staff || []);
      setAllStaff(response?.data?.allStaff || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load staff performance');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'items') loadItems();
    if (activeTab === 'staff') loadStaff();
  }, [activeTab, range.start, range.end]);

  const peakItemRevenue = useMemo(
    () => Math.max(1, ...items.map((row) => Number(row.totalRevenue) || 0)),
    [items]
  );

  const peakStaffRevenue = useMemo(
    () => Math.max(1, ...staff.map((row) => Number(row.totalRevenue) || 0)),
    [staff]
  );

  const filteredStaff = roleFilter === 'all'
    ? staff
    : staff.filter((s) => s.role === roleFilter);

  return (
    <div className="reports-tab">
      <header className="dashboard-header">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="page-subtitle">Restaurant performance insights for Menu Items and Staff</p>
      </header>

      <div className="dashboard-controls">
        <div className="preset-group">
          {PRESETS.map((entry) => (
            <button
              key={entry.key}
              className={preset === entry.key ? 'active' : ''}
              onClick={() => applyPreset(entry.key)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="date-range">
          <div className="date-input-group">
            <label>From</label>
            <input
              type="date"
              value={range.start}
              max={range.end}
              onChange={(e) => handleRangeChange('start', e.target.value)}
            />
          </div>
          <span className="date-range-separator">to</span>
          <div className="date-input-group">
            <label>To</label>
            <input
              type="date"
              value={range.end}
              min={range.start}
              onChange={(e) => handleRangeChange('end', e.target.value)}
            />
          </div>
        </div>

        {activeTab === 'staff' && (
          <div className="role-filter">
            <label>Staff role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => { setActiveTab(tab.key); setRoleFilter('all'); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'items' && (
          <section className="report-section">
            {loading ? (
              <div className="loading-state">Loading item performance data...</div>
            ) : items.length === 0 ? (
              <div className="empty-state">No sales data for the selected period.</div>
            ) : (
              <>
                <div className="chart-card">
                  <h2>Revenue by Menu Item</h2>
                  <div className="bar-chart">
                    {items.map((row) => (
                      <div key={row._id || row.name} className="bar-row">
                        <span className="bar-label">{row.name}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${((Number(row.totalRevenue) || 0) / peakItemRevenue) * 100}%`
                            }}
                          />
                        </div>
                        <span className="bar-value">{formatMoney(row.totalRevenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="table-card">
                  <h2>Sales Details</h2>
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Menu Item</th>
                          <th>Category</th>
                          <th>Units Sold</th>
                          <th>Stock</th>
                          <th>Revenue</th>
                          <th>Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((row, index) => (
                          <tr key={row._id || row.name}>
                            <td><span className="rank-badge">{index + 1}</span></td>
                            <td className="item-name">{row.name}</td>
                            <td>{row.category || 'N/A'}</td>
                            <td>{row.unitsSold || 0}</td>
                            <td>{row.currentStock ?? 'N/A'}</td>
                            <td>{formatMoney(row.totalRevenue)}</td>
                            <td>{row.orderCount || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="summary-bar">
                  <div className="summary-item">
                    <span>Total Items</span>
                    <strong>{items.length}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Units Sold</span>
                    <strong>{items.reduce((sum, row) => sum + (Number(row.unitsSold) || 0), 0)}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Total Revenue</span>
                    <strong>{formatMoney(items.reduce((sum, row) => sum + (Number(row.totalRevenue) || 0), 0))}</strong>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === 'staff' && (
          <section className="report-section">
            {loading ? (
              <div className="loading-state">Loading staff performance data...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="empty-state">No staff activity in the selected period.</div>
            ) : (
              <>
                <div className="table-card">
                  <h2>Staff Performance</h2>
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Orders Handled</th>
                          <th>Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStaff.map((row, index) => (
                          <tr key={row.staffId || row._id || index}>
                            <td><span className="rank-badge">{index + 1}</span></td>
                            <td className="item-name">{row.name || 'Unassigned'}</td>
                            <td>
                              <span className={`role-badge role-${row.role || 'unknown'}`}>
                                {row.role || 'N/A'}
                              </span>
                            </td>
                            <td>{row.totalOrders || 0}</td>
                            <td>{formatMoney(row.totalRevenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="chart-card">
                  <h2>Revenue by Staff Member</h2>
                  <div className="bar-chart">
                    {filteredStaff.map((row) => (
                      <div key={row.staffId || row._id} className="bar-row">
                        <span className="bar-label">{row.name || 'Unassigned'}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${((Number(row.totalRevenue) || 0) / peakStaffRevenue) * 100}%`
                            }}
                          />
                        </div>
                        <span className="bar-value">{formatMoney(row.totalRevenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="summary-bar">
                  <div className="summary-item">
                    <span>Staff Members</span>
                    <strong>{allStaff.length}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Total Orders Handled</span>
                    <strong>{staff.reduce((sum, row) => sum + (Number(row.totalOrders) || 0), 0)}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Total Revenue</span>
                    <strong>{formatMoney(staff.reduce((sum, row) => sum + (Number(row.totalRevenue) || 0), 0))}</strong>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;
