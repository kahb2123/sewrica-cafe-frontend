// src/pages/admin/tabs/ReportsTab.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const SECTIONS = [
  { key: 'sales', label: 'Sales' },
  { key: 'items', label: 'Items' },
  { key: 'staff', label: 'Staff' }
];

const emptyReport = {
  period: { start: '', end: '', days: 0, timezone: '' },
  totals: {},
  daily: [],
  hourly: [],
  statusBreakdown: [],
  paymentMethods: [],
  orderChannels: [],
  categories: [],
  topItems: [],
  staff: [],
  staffDetail: null
};

const ReportsTab = () => {
  const [preset, setPreset] = useState('7d');
  const [range, setRange] = useState(() => ({ start: daysAgo(6), end: daysAgo(0) }));
  const [role, setRole] = useState('all');
  const [section, setSection] = useState('sales');
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  const [report, setReport] = useState(emptyReport);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  const sectionLabel = SECTIONS.find((entry) => entry.key === section)?.label || 'Report';

  const loadReport = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await adminService.getUnifiedReport({
        start: range.start,
        end: range.end,
        role,
        staffId: selectedStaffId,
        section: selectedStaffId ? 'staff' : section
      });
      setReport({ ...emptyReport, ...(response?.data || {}) });
    } catch (error) {
      setReport(emptyReport);
      toast.error(error.message || 'Failed to load report');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [range.start, range.end, role, section, selectedStaffId]);

  useEffect(() => { loadReport(); }, [loadReport]);

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

  const handleStaffSelect = (staffId) => {
    setSelectedStaffId(staffId || null);
  };

  const handleExport = async (format, exportSection = section) => {
    try {
      setExporting(format);
      const blob = await adminService.exportUnifiedReport(format, {
        start: range.start,
        end: range.end,
        role,
        staffId: selectedStaffId || undefined,
        section: exportSection
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sewrica-report-${range.start}-to-${range.end}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}${exportSection !== 'all' ? ` (${exportSection})` : ''}`);
    } catch (error) {
      toast.error(error.message || 'Failed to export report');
    } finally {
      setExporting(null);
    }
  };

  const t = report.totals || {};
  const assumedPaid = Number(t.paidRevenue) + Number(t.outstandingRevenue);

  const peakRevenue = useMemo(
    () => Math.max(1, ...report.daily.map((row) => Number(row.paidRevenue) || 0)),
    [report.daily]
  );
  const peakCategory = useMemo(
    () => Math.max(1, ...report.categories.map((row) => Number(row.revenue) || 0)),
    [report.categories]
  );
  const peakHour = useMemo(
    () => Math.max(1, ...report.hourly.map((row) => Number(row.paidRevenue) || 0)),
    [report.hourly]
  );
  const peakStaff = useMemo(
    () => Math.max(1, ...report.staff.map((row) => Number(row.totalOrders) || 0)),
    [report.staff]
  );

  const roleMeta = {
    cook: { label: 'Chef', color: '#e74c3c' },
    delivery: { label: 'Delivery', color: '#3498db' },
    cashier: { label: 'Cashier', color: '#f39c12' }
  };

  const staffOptions = report.staff.map((s) => ({ value: s.staffId, label: `${s.name} (${roleMeta[s.role]?.label || s.role})` }));
  const detail = report.staffDetail;

  return (
    <div className="reports-tab">
      <div className="reports-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Sales, items and staff performance for any date range</p>
        </div>
        <div className="reports-export">
          <div className="export-format-group">
            <span className="export-label">Export as:</span>
            <button
              className="btn-export btn-csv"
              onClick={() => handleExport('csv', 'all')}
              disabled={exporting !== null}
            >
              {exporting === 'csv' ? 'Exporting...' : 'Full CSV'}
            </button>
            <button
              className="btn-export btn-csv btn-export-section"
              onClick={() => handleExport('csv', section)}
              disabled={exporting !== null}
            >
              {exporting === 'csv' ? '...' : `${sectionLabel} CSV`}
            </button>
          </div>
          <div className="export-format-group">
            <button
              className="btn-export btn-pdf"
              onClick={() => handleExport('pdf', 'all')}
              disabled={exporting !== null}
            >
              {exporting === 'pdf' ? 'Exporting...' : 'Full PDF'}
            </button>
            <button
              className="btn-export btn-pdf btn-export-section"
              onClick={() => handleExport('pdf', section)}
              disabled={exporting !== null}
            >
              {exporting === 'pdf' ? '...' : `${sectionLabel} PDF`}
            </button>
          </div>
        </div>
      </div>

      <div className="report-controls">
        <div className="preset-group">
          {PRESETS.map((entry) => (
            <button
              key={entry.key}
              className={preset === entry.key ? 'active' : ''}
              onClick={() => { applyPreset(entry.key); setSelectedStaffId(null); }}
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

        <div className="role-filter">
          <label>Staff role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All staff</option>
            <option value="cook">Chefs</option>
            <option value="delivery">Delivery</option>
            <option value="cashier">Cashiers</option>
          </select>
        </div>

        <div className="staff-filter">
          <label>Staff member</label>
          <select
            value={selectedStaffId || ''}
            onChange={(e) => handleStaffSelect(e.target.value || null)}
            disabled={section !== 'staff'}
          >
            <option value="">All staff</option>
            {staffOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {selectedStaffId && (
            <button
              className="btn-clear-staff"
              onClick={() => handleStaffSelect(null)}
              title="Clear selection"
            >
              Clear
            </button>
          )}
        </div>

        {selectedStaffId && detail && (
          <button
            className="btn-back-to-staff"
            onClick={() => handleStaffSelect(null)}
          >
            &larr; Back to staff list
          </button>
        )}
      </div>

      <div className="section-tabs">
        {SECTIONS.map((entry) => (
          <button
            key={entry.key}
            className={section === entry.key ? 'active' : ''}
            onClick={() => { setSection(entry.key); setSelectedStaffId(null); }}
            disabled={!!selectedStaffId}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="summary-cards">
        <div className="summary-card primary">
          <div className="card-icon">Orders</div>
          <span className="label">Total orders</span>
          <span className="value">{(t.totalOrders || 0).toLocaleString()}</span>
          <span className="sub">{t.paidOrders || 0} paid · {t.cancelledOrders || 0} cancelled</span>
        </div>

        <div className="summary-card success">
          <div className="card-icon">Paid</div>
          <span className="label">Paid revenue</span>
          <span className="value">{formatMoney(t.paidRevenue)}</span>
          <span className="sub">Only settled payments</span>
        </div>

        <div className="summary-card assumed">
          <div className="card-icon">Assumed</div>
          <span className="label">Total BIRR (assumed paid)</span>
          <span className="value">{formatMoney(assumedPaid)}</span>
          <span className="sub">{formatMoney(t.outstandingRevenue)} from {t.unpaidOrders || 0} pending orders</span>
        </div>

        <div className="summary-card warning">
          <div className="card-icon">Pending</div>
          <span className="label">Outstanding</span>
          <span className="value">{formatMoney(t.outstandingRevenue)}</span>
          <span className="sub">{t.unpaidOrders || 0} unpaid orders</span>
        </div>

        <div className="summary-card neutral">
          <div className="card-icon">Avg order</div>
          <span className="label">Average order</span>
          <span className="value">{formatMoney(t.averageOrderValue)}</span>
          <span className="sub">per paid order</span>
        </div>

        {t.avgCookingMinutes > 0 && (
          <div className="summary-card neutral">
            <div className="card-icon">Cooking</div>
            <span className="label">Avg cooking</span>
            <span className="value">{(t.avgCookingMinutes || 0)} min</span>
            <span className="sub">across all cooks</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="report-loading">Building report...</div>
      ) : (
        <>
          {detail ? (
            <>
              <div className="staff-detail-header">
                <h2>{detail.name}</h2>
                <span className="staff-role-badge" style={{ background: roleMeta[detail.role]?.color || '#95a5a6' }}>
                  {roleMeta[detail.role]?.label || detail.role}
                </span>
              </div>

              <div className="summary-cards">
                <div className="summary-card primary">
                  <div className="card-icon">Orders</div>
                  <span className="label">Total orders</span>
                  <span className="value">{(detail.summary?.totalOrders || 0).toLocaleString()}</span>
                  <span className="sub">{detail.summary?.completedOrders || 0} completed · {detail.summary?.cancelledOrders || 0} cancelled</span>
                </div>
                <div className="summary-card success">
                  <div className="card-icon">Revenue</div>
                  <span className="label">Paid revenue</span>
                  <span className="value">{formatMoney(detail.summary?.paidRevenue)}</span>
                  <span className="sub">{detail.summary?.paidOrders || 0} paid orders</span>
                </div>
                <div className="summary-card assumed">
                  <div className="card-icon">Total</div>
                  <span className="label">Total BIRR</span>
                  <span className="value">{formatMoney(Number(detail.summary?.paidRevenue) + Number(detail.summary?.outstandingRevenue))}</span>
                  <span className="sub">{formatMoney(detail.summary?.outstandingRevenue)} outstanding</span>
                </div>
                <div className="summary-card neutral">
                  <div className="card-icon">Done</div>
                  <span className="label">Completion rate</span>
                  <span className="value">{detail.summary?.completionRate || 0}%</span>
                  <span className="sub">of {detail.summary?.totalOrders || 0} orders</span>
                </div>
                {detail.role === 'cook' && detail.summary?.averageCookingTime !== undefined && (
                  <div className="summary-card neutral">
                    <div className="card-icon">Avg cook</div>
                    <span className="label">Avg cooking time</span>
                    <span className="value">{detail.summary.averageCookingTime} min</span>
                    <span className="sub">slowest: {detail.summary.slowestCookingTime || 0} min</span>
                  </div>
                )}
                {detail.role === 'delivery' && detail.summary?.averageDeliveryTime !== undefined && (
                  <div className="summary-card neutral">
                    <div className="card-icon">Avg delivery</div>
                    <span className="label">Avg delivery time</span>
                    <span className="value">{detail.summary.averageDeliveryTime} min</span>
                    <span className="sub">total deliveries: {detail.summary.totalDeliveries || 0}</span>
                  </div>
                )}
              </div>

              {detail.itemsBreakdown && (
                <div className="report-section">
                  <h3>Items handled</h3>
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr><th>Item</th><th>Quantity</th></tr>
                      </thead>
                      <tbody>
                        {Object.entries(detail.itemsBreakdown)
                          .sort(([, a], [, b]) => b - a)
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
            </>
          ) : (
            <>
              {section === 'sales' && (
                <>
                  <div className="report-section">
                    <h3>Daily revenue</h3>
                    {report.daily.length === 0 ? (
                      <p className="empty-note">No orders in this range.</p>
                    ) : (
                      <div className="bar-chart">
                        {report.daily.map((row) => (
                          <div key={row.date} className="bar-column">
                            <span className="bar-value">{Number(row.paidRevenue) > 0 ? Math.round(row.paidRevenue) : ''}</span>
                            <div className="bar-track">
                              <div
                                className="bar-fill"
                                style={{ height: `${((Number(row.paidRevenue) || 0) / peakRevenue) * 100}%` }}
                              />
                            </div>
                            <span className="bar-label">{row.date ? row.date.slice(5) : ''}</span>
                            <span className="bar-orders">{row.orders} orders</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="report-grid">
                    <div className="report-section">
                      <h3>Payment methods</h3>
                      {report.paymentMethods.length === 0 ? (
                        <p className="empty-note">No settled payments yet.</p>
                      ) : (
                        <div className="breakdown-list">
                          {report.paymentMethods.map((row) => (
                            <div key={row.method} className="breakdown-item">
                              <div className="breakdown-header">
                                <span className="breakdown-name">{row.method}</span>
                                <span className="breakdown-stats">
                                  <strong>{row.count}</strong> payments · {formatMoney(row.amount)}
                                </span>
                              </div>
                              <div className="progress-track">
                                <div className="progress-fill" style={{ width: `${row.share}%` }} />
                              </div>
                              <span className="breakdown-share">{row.share}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="report-section">
                      <h3>Busiest hours</h3>
                      {report.hourly.length === 0 ? (
                        <p className="empty-note">No orders in this range.</p>
                      ) : (
                        <div className="breakdown-list">
                          {report.hourly.slice(0, 8).map((row) => (
                            <div key={row.hour} className="breakdown-item">
                              <div className="breakdown-header">
                                <span className="breakdown-name">{row.hour}:00</span>
                                <span className="breakdown-stats">
                                  <strong>{row.orders}</strong> orders · {formatMoney(row.paidRevenue)}
                                </span>
                              </div>
                              <div className="progress-track">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${((Number(row.paidRevenue) || 0) / peakHour) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="report-section">
                    <h3>Order channels & statuses</h3>
                    <div className="chip-grid">
                      {report.orderChannels.map((row) => (
                        <div key={row.channel} className="chip">
                          <span className="chip-label">{row.channel}</span>
                          <span className="chip-value">{row.count}</span>
                        </div>
                      ))}
                      {report.statusBreakdown.map((row) => (
                        <div key={row.status} className={`chip status-${row.status}`}>
                          <span className="chip-label">{row.status}</span>
                          <span className="chip-value">{row.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {section === 'items' && (
                <>
                  <div className="report-section">
                    <h3>Top selling items</h3>
                    {report.topItems.length === 0 ? (
                      <p className="empty-note">No items sold in this range.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="report-table">
                          <thead>
                            <tr><th>#</th><th>Item</th><th>Quantity</th><th>Revenue</th></tr>
                          </thead>
                          <tbody>
                            {report.topItems.map((row, index) => (
                              <tr key={row.name} className={index === 0 ? 'top-item-row' : ''}>
                                <td><span className={`rank-badge ${index === 0 ? 'rank-badge--gold' : ''}`}>{index + 1}</span></td>
                                <td className="item-name">{row.name}</td>
                                <td>{row.quantity}</td>
                                <td>{formatMoney(row.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="report-section">
                    <h3>Sales by category</h3>
                    {report.categories.length === 0 ? (
                      <p className="empty-note">No category sales in this range.</p>
                    ) : (
                      <div className="breakdown-list">
                        {report.categories.map((row) => (
                          <div key={row.category} className="breakdown-item">
                            <div className="breakdown-header">
                              <span className="breakdown-name">{row.category}</span>
                              <span className="breakdown-stats">
                                <strong>{row.itemsSold}</strong> items · {formatMoney(row.revenue)}
                              </span>
                            </div>
                            <div className="progress-track">
                              <div
                                className="progress-fill"
                                style={{ width: `${row.share}%` }}
                              />
                            </div>
                            <span className="breakdown-share">{row.share}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {section === 'staff' && (
                <div className="report-section">
                  <h3>Staff performance
                    <span className="section-subtitle">Click a staff member to view their detailed report</span>
                  </h3>
                  {report.staff.length === 0 ? (
                    <p className="empty-note">No staff activity in this range. Revenue is attributed to a chef once the admin assigns them via "Assign Chef", and to a courier once the admin assigns them via "Assign Delivery". Cashiers are credited for orders whose payment they process.</p>
                  ) : (
                    <div className="staff-performance-grid">
                      {report.staff.map((row) => (
                        <div
                          key={`${row.role}-${row.staffId}`}
                          className="staff-performance-card clickable"
                          style={{ borderTopColor: roleMeta[row.role]?.color || '#95a5a6' }}
                          onClick={() => handleStaffSelect(row.staffId)}
                        >
                          <div className="spc-header">
                            <strong>{row.name}</strong>
                            <span className="spc-role" style={{ color: roleMeta[row.role]?.color }}>
                              {roleMeta[row.role]?.label || row.role}
                            </span>
                          </div>
                          <div className="spc-bar-track">
                            <div
                              className="spc-bar-fill"
                              style={{
                                width: `${((Number(row.totalOrders) || 0) / peakStaff) * 100}%`,
                                backgroundColor: roleMeta[row.role]?.color || '#95a5a6'
                              }}
                            />
                          </div>
                          <div className="spc-stats">
                            <span><em>Orders</em> <strong>{row.totalOrders}</strong></span>
                            <span><em>Completed</em> <strong>{row.completedOrders}</strong></span>
                            <span><em>Revenue</em> <strong>{formatMoney(row.revenue)}</strong></span>
                            <span><em>Done</em> <strong>{row.completionRate}%</strong></span>
                          </div>
                          {row.role === 'cashier' && row.cashCollected > 0 && (
                            <div className="spc-foot">
                              <span>{formatMoney(row.cashCollected)} cash collected</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsTab;
