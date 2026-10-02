// src/pages/admin/tabs/ReportsTab.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../../services/api';
import './ReportsTab.css';

const money = new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatMoney = (value) => `${money.format(Number(value) || 0)} ETB`;

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

const ROLE_LABELS = {
  cook: 'Chef',
  delivery: 'Delivery',
  cashier: 'Cashier',
  admin: 'Admin',
  customer: 'Customer'
};

const ReportsTab = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [preset, setPreset] = useState('7d');
  const [range, setRange] = useState(() => ({ start: daysAgo(6), end: daysAgo(0) }));

  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffDetail, setStaffDetail] = useState(null);
  const [exporting, setExporting] = useState(null);

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
    if (activeTab === 'items') { setSelectedStaff(null); setStaffDetail(null); loadItems(); }
    if (activeTab === 'staff') { setSelectedStaff(null); setStaffDetail(null); loadStaff(); }
  }, [activeTab, range.start, range.end]);

  const loadStaffDetail = async (staffId, staffName) => {
    setLoading(true);
    try {
      const response = await adminService.getStaffDetail(staffId, { start: range.start, end: range.end });
      setStaffDetail(response?.data?.staffDetail || null);
      setSelectedStaff({ id: staffId, name: staffName });
    } catch (error) {
      toast.error(error.message || 'Failed to load staff detail');
      setStaffDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const blob = await adminService.exportReport(format, {
        start: range.start,
        end: range.end,
        type: activeTab === 'items' ? 'items' : 'staff',
        staffId: selectedStaff?.id
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sewrica-${activeTab === 'items' ? 'items' : 'staff'}-report-${range.start}-to-${range.end}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(error.message || 'Failed to export report');
    } finally {
      setExporting(null);
    }
  };

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
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Restaurant performance insights for Menu Items and Staff</p>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn-export btn-csv"
            onClick={() => handleExport('csv')}
            disabled={exporting === 'csv' || exporting === 'pdf'}
            title="Export as CSV"
          >
            {exporting === 'csv' ? 'Exporting...' : 'CSV'}
          </button>
          <button
            className="btn-export btn-pdf"
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'csv' || exporting === 'pdf'}
            title="Export as PDF"
          >
            {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
          </button>
        </div>
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

        {activeTab === 'staff' && !selectedStaff && (
          <div className="role-filter">
            <label>Staff role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {selectedStaff && (
          <button
            className="btn-back-staff"
            onClick={() => { setSelectedStaff(null); setStaffDetail(null); }}
          >
            Back to Staff List
          </button>
        )}
      </div>

      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => { setActiveTab(tab.key); setSelectedStaff(null); setStaffDetail(null); setRoleFilter('all'); }}
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
            ) : staffDetail ? (
              <>
                <div className="staff-detail-header">
                  <h2>{staffDetail.name || 'Staff Member'}</h2>
                  <span className={`staff-role-badge role-${staffDetail.role || 'unknown'}`}>
                    {ROLE_LABELS[staffDetail.role] || staffDetail.role}
                  </span>
                </div>

                <div className="dashboard-content">
                  <div className="summary-bar">
                    <div className="summary-item">
                      <span>Total Orders</span>
                      <strong>{staffDetail.summary?.totalOrders || 0}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Total Revenue</span>
                      <strong>{formatMoney(staffDetail.summary?.totalRevenue)}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Average Order</span>
                      <strong>{formatMoney(staffDetail.summary?.avgOrderValue)}</strong>
                    </div>
                  </div>

                  {staffDetail.itemsBreakdown && (
                    <div className="table-card" style={{ marginTop: '18px' }}>
                      <h3>Items Handled</h3>
                      <div className="table-responsive">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Quantity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(staffDetail.itemsBreakdown)
                              .sort(([, a], [, b]) => Number(b) - Number(a))
                              .map(([name, qty]) => (
                                <tr key={name}>
                                  <td className="item-name">{name}</td>
                                  <td>{qty}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {staffDetail.recentOrders && staffDetail.recentOrders.length > 0 && (
                    <div className="table-card" style={{ marginTop: '18px' }}>
                      <h3>Recent Orders</h3>
                      <div className="table-responsive">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th>Order #</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staffDetail.recentOrders.map((order) => (
                              <tr key={order.orderId}>
                                <td className="item-name">{order.orderNumber}</td>
                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td>{order.status}</td>
                                <td>{formatMoney(order.totalAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
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
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStaff.map((row, index) => (
                          <tr key={row.staffId || row._id || index}>
                            <td><span className="rank-badge">{index + 1}</span></td>
                            <td className="item-name">{row.name || 'Unassigned'}</td>
                            <td>
                              <span className={`role-badge role-${row.role || 'unknown'}`}>
                                {ROLE_LABELS[row.role] || row.role || 'N/A'}
                              </span>
                            </td>
                            <td>{row.totalOrders || 0}</td>
                            <td>{formatMoney(row.totalRevenue)}</td>
                            <td>
                              <button
                                className="btn-view-detail"
                                onClick={() => loadStaffDetail(row.staffId, row.name)}
                              >
                                View Detail
                              </button>
                            </td>
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
