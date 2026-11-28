// src/pages/admin/tabs/ReportsTab.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { toast } from 'react-toastify';
import { adminService } from '../../../services/api';
import scrollToPageTop from '../../../utils/scrollToPageTop';
import Pagination from '../../../components/Pagination';
import usePagination from '../../../hooks/usePagination';
import './ReportsTab.css';

const money = new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatMoney = (value) => `${money.format(Number(value) || 0)} ETB`;

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
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
  { value: 'cashier', label: 'Cashier' },
  { value: 'waiter', label: 'Waiter' }
];

const ROLE_LABELS = {
  cook: 'Chef',
  delivery: 'Delivery',
  cashier: 'Cashier',
  waiter: 'Waiter',
  admin: 'Admin',
  customer: 'Customer'
};

const REVENUE_ROLES = ['waiter', 'delivery'];

const ReportsTab = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [itemSort, setItemSort] = useState({ key: 'revenue', dir: 'desc' });
  const [preset, setPreset] = useState('7d');
  const [range, setRange] = useState(() => ({ start: daysAgo(6), end: daysAgo(0) }));

  const [items, setItems] = useState([]);
  const [itemSummary, setItemSummary] = useState(null);
  const [reportTotals, setReportTotals] = useState(null);
  const [taxSummary, setTaxSummary] = useState(null);
  const [staff, setStaff] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffDetail, setStaffDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(null);
  const requestId = useRef(0);
  const detailRequestId = useRef(0);

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

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    let cancelled = false;
    setLoading(true);

    const loadReport = async () => {
      try {
        const response = await adminService.getUnifiedReport({
          start: range.start,
          end: range.end,
          section: activeTab
        });
        if (!cancelled && requestId.current === currentRequestId) {
            setReportTotals(response?.data?.totals || null);
            if (activeTab === 'items') {
              setItems(response?.data?.topItems || []);
              setItemSummary(response?.data?.itemSummary || null);
              setTaxSummary(response?.data?.taxSummary || null);
            } else {
              const rows = response?.data?.staff || [];
              setStaff(rows);
          }
        }
      } catch (error) {
        if (!cancelled && requestId.current === currentRequestId) {
          toast.error(error.message || `Failed to load ${activeTab} report`);
          setReportTotals(null);
          if (activeTab === 'items') {
            setItems([]);
            setItemSummary(null);
            setTaxSummary(null);
          } else {
            setStaff([]);
          }
        }
      } finally {
        if (!cancelled && requestId.current === currentRequestId) setLoading(false);
      }
    };

    loadReport();
    return () => { cancelled = true; };
  }, [activeTab, range.start, range.end]);

  useEffect(() => {
    const currentRequestId = ++detailRequestId.current;
    let cancelled = false;

    if (activeTab !== 'staff' || !selectedStaff) {
      setStaffDetail(null);
      setDetailLoading(false);
      return () => { cancelled = true; };
    }

    setDetailLoading(true);
    const loadDetail = async () => {
      try {
        const response = await adminService.getUnifiedReport({
          start: range.start,
          end: range.end,
          staffId: selectedStaff.id,
          section: 'staff'
        });
        if (!cancelled && detailRequestId.current === currentRequestId) {
          setStaffDetail(response?.data?.staffDetail || null);
        }
      } catch (error) {
        if (!cancelled && detailRequestId.current === currentRequestId) {
          toast.error(error.message || 'Failed to load staff detail');
          setStaffDetail(null);
        }
      } finally {
        if (!cancelled && detailRequestId.current === currentRequestId) setDetailLoading(false);
      }
    };

    loadDetail();
    return () => { cancelled = true; };
  }, [activeTab, selectedStaff, range.start, range.end]);

  const handleExport = async (format, scope = 'current') => {
    setExporting(format);
    try {
      const isIndividual = scope === 'current' && activeTab === 'staff' && selectedStaff;
      const blob = await adminService.exportUnifiedReport(format, {
        start: range.start,
        end: range.end,
        section: activeTab === 'items' ? 'items' : 'staff',
        role: activeTab === 'staff' ? roleFilter : undefined,
        staffId: isIndividual ? selectedStaff.id : undefined
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const reportName = isIndividual
        ? `staff-${String(selectedStaff.name || 'individual').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        : activeTab === 'items' ? 'items' : 'staff';
      link.setAttribute('download', `sewrica-${reportName}-report-${range.start}-to-${range.end}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(error.message || 'Failed to export report');
    } finally {
      setExporting(null);
    }
  };

  const peakItemRevenue = useMemo(
    () => Math.max(1, ...items.map((row) => Number(row.revenue) || 0)),
    [items]
  );

  const activeStaff = staff.filter((row) => Number(row.totalOrders) > 0);
  const filteredStaff = roleFilter === 'all'
    ? activeStaff
    : activeStaff.filter((row) => row.role === roleFilter);
  const showStaffRevenue = roleFilter === 'all' || REVENUE_ROLES.includes(roleFilter);
  const revenueStaff = filteredStaff.filter((row) => REVENUE_ROLES.includes(row.role));
  const reportResetKey = `${range.start}|${range.end}|${activeTab}|${roleFilter}`;
  const itemPagination = usePagination(items, 10, reportResetKey);
  const staffPagination = usePagination(filteredStaff, 10, reportResetKey);
  const revenueStaffPagination = usePagination(revenueStaff, 10, reportResetKey);
  const staffItemRows = Object.entries(staffDetail?.itemsBreakdown || {})
    .sort(([, a], [, b]) => Number(b) - Number(a));
  const staffDailyRows = Object.entries(staffDetail?.dailyBreakdown || {});
  const staffItemPagination = usePagination(
    staffItemRows,
    10,
    `${selectedStaff?.id || ''}|${range.start}|${range.end}`
  );
  const staffDailyPagination = usePagination(
    staffDailyRows,
    10,
    `${selectedStaff?.id || ''}|${range.start}|${range.end}`
  );
  const peakStaffRevenue = useMemo(
    () => Math.max(1, ...revenueStaff.map((row) => Number(row.revenue) || 0)),
    [revenueStaff]
  );

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
            title={selectedStaff ? 'Export this staff member as CSV' : 'Export the current report as CSV'}
          >
            {exporting === 'csv' ? 'Exporting...' : selectedStaff ? 'Individual CSV' : 'CSV'}
          </button>
          <button
            className="btn-export btn-pdf"
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'csv' || exporting === 'pdf'}
            title={selectedStaff ? 'Export this staff member as PDF' : 'Export the current report as PDF'}
          >
            {exporting === 'pdf' ? 'Exporting...' : selectedStaff ? 'Individual PDF' : 'PDF'}
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
            onClick={() => {
              if (tab.key !== activeTab) scrollToPageTop();
              setActiveTab(tab.key);
              setSelectedStaff(null);
              setStaffDetail(null);
              setRoleFilter('all');
            }}
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
                <div className="kpi-cards">
                  <div className="kpi-card">
                    <span className="kpi-label">Top Items Listed</span>
                    <strong className="kpi-value">{items.length}</strong>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Units Sold</span>
                    <strong className="kpi-value">{itemSummary?.unitsSold || 0}</strong>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Total Paid Revenue</span>
                    <strong className="kpi-value">{formatMoney(reportTotals?.paidRevenue)}</strong>
                  </div>
                </div>

                {activeTab === 'items' && (
                  <div className="charts-grid">
                    <div className="chart-card">
                      <h2>Top Sellers (Units Sold)</h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[...items].sort((a, b) => (Number(b.quantity) || 0) - (Number(a.quantity) || 0)).slice(0, 8)}
                          layout="vertical"
                          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="quantity" name="Units Sold" fill="#1e3a2f" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="chart-card">
                      <h2>Revenue Mix</h2>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={items}
                            dataKey="revenue"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {items.map((_, i) => {
                              const palette = ['#1e3a2f', '#2f5d4a', '#c9a227', '#e0b84a', '#8b5a2b', '#a87438', '#4a7c59', '#6b9b7a'];
                              return <Cell key={i} fill={palette[i % palette.length]} />;
                            })}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {activeTab === 'staff' && (
                  <div className="chart-card">
                    <h2>Staff Performance</h2>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={staff} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="unitsSold" name="Units Sold" fill="#c9a227" />
                        <Bar yAxisId="right" dataKey="revenue" name="Total Sales (ETB)" fill="#1e3a2f" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="chart-card">
                  <h2>Revenue by Menu Item</h2>
                  <div className="bar-chart">
                    {itemPagination.pageItems.map((row) => (
                      <div key={row._id || row.name} className="bar-row">
                        <span className="bar-label">{row.name}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${((Number(row.revenue) || 0) / peakItemRevenue) * 100}%` }}
                          />
                        </div>
                        <span className="bar-value">{formatMoney(row.revenue)}</span>
                      </div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={itemPagination.currentPage}
                    pageSize={itemPagination.pageSize}
                    totalItems={itemPagination.totalItems}
                    onPageChange={itemPagination.setPage}
                  />
                </div>

                {taxSummary && (
                  <div className="tax-summary-card">
                    <h2>Government Tax & Ledger Summary</h2>
                    <div className="tax-grid">
                      <div className="tax-item" title="Sum of all approved expenses in the selected period">
                        <span className="tax-label">Total Operating Expenses</span>
                        <strong className="tax-value">{formatMoney(taxSummary.totalOperatingExpenses)}</strong>
                      </div>
                      <div className="tax-item" title="Gross Sales minus Total Operating Expenses">
                        <span className="tax-label">Taxable Net Income</span>
                        <strong className="tax-value">{formatMoney(taxSummary.netTaxableProfit)}</strong>
                      </div>
                      <div className="tax-item" title="30% of Taxable Net Income">
                        <span className="tax-label">Est. Government Tax Due (30%)</span>
                        <strong className="tax-value">{formatMoney(taxSummary.estimatedTax)}</strong>
                      </div>
                      <div className="tax-item" title="Taxable Net Income minus Tax Due">
                        <span className="tax-label">Net Take-Home Margin</span>
                        <strong className="tax-value">{formatMoney(taxSummary.takeHomeProfit)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="table-card">
                  <h2>Sales Details</h2>
                  <div className="table-responsive">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Menu Item</th>
                          <th className="sortable" onClick={() => setItemSort(s => ({ key: 'quantity', dir: s.key === 'quantity' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                            Units Sold {itemSort.key === 'quantity' ? (itemSort.dir === 'asc' ? '▲' : '▼') : ''}
                          </th>
                          <th className="sortable" onClick={() => setItemSort(s => ({ key: 'revenue', dir: s.key === 'revenue' && s.dir === 'asc' ? 'desc' : 'asc' }))}>
                            Revenue {itemSort.key === 'revenue' ? (itemSort.dir === 'asc' ? '▲' : '▼') : ''}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...items].sort((a, b) => {
                          const av = itemSort.key === 'revenue' ? (Number(a.revenue) || 0) : (Number(a.quantity) || 0);
                          const bv = itemSort.key === 'revenue' ? (Number(b.revenue) || 0) : (Number(b.quantity) || 0);
                          return itemSort.dir === 'asc' ? av - bv : bv - av;
                        }).map((row, index) => (
                          <tr key={row._id || row.name}>
                            <td><span className="rank-badge">{index + 1}</span></td>
                            <td className="item-name">{row.name}</td>
                            <td className="num-cell">{row.quantity || 0}</td>
                            <td className="num-cell">{formatMoney(row.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === 'staff' && (
          <section className="report-section">
            {loading && !selectedStaff ? (
              <div className="loading-state">Loading staff performance data...</div>
            ) : selectedStaff ? (
              detailLoading ? (
                <div className="loading-state">Loading individual staff report...</div>
              ) : staffDetail ? (
              <>
                <div className="staff-detail-header">
                  <div>
                    <h2>{staffDetail.name || selectedStaff.name || 'Staff Member'}</h2>
                    <span className={`staff-role-badge role-${staffDetail.role || 'unknown'}`}>
                      {ROLE_LABELS[staffDetail.role] || staffDetail.role}
                    </span>
                  </div>
                  <div className="dashboard-actions">
                    <button
                      className="btn-export btn-csv"
                      onClick={() => handleExport('csv', 'all')}
                      disabled={Boolean(exporting)}
                    >
                      Export all staff CSV
                    </button>
                    <button
                      className="btn-export btn-pdf"
                      onClick={() => handleExport('pdf', 'all')}
                      disabled={Boolean(exporting)}
                    >
                      Export all staff PDF
                    </button>
                  </div>
                </div>

                <div className="staff-detail-panel">
                  <div className="summary-bar staff-detail-summary">
                    <div className="summary-item">
                      <span>Total Orders</span>
                      <strong>{staffDetail.summary?.totalOrders || 0}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Units Sold</span>
                      <strong>{staffDetail.summary?.unitsSold || 0}</strong>
                    </div>
                    {REVENUE_ROLES.includes(staffDetail.role) && (
                      <div className="summary-item">
                        <span>Paid Revenue</span>
                        <strong>{formatMoney(staffDetail.summary?.paidRevenue)}</strong>
                      </div>
                    )}
                    <div className="summary-item">
                      <span>Completed</span>
                      <strong>{staffDetail.summary?.completedOrders || 0}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Completion Rate</span>
                      <strong>{staffDetail.summary?.completionRate || 0}%</strong>
                    </div>
                    {REVENUE_ROLES.includes(staffDetail.role) && (
                      <div className="summary-item">
                        <span>Outstanding</span>
                        <strong>{formatMoney(staffDetail.summary?.outstandingRevenue)}</strong>
                      </div>
                    )}
                    <div className="summary-item">
                      <span>Cancelled</span>
                      <strong>{staffDetail.summary?.cancelledOrders || 0}</strong>
                    </div>
                    {staffDetail.role === 'cook' && (
                      <div className="summary-item">
                        <span>Avg. Cooking Time</span>
                        <strong>{staffDetail.summary?.averageCookingTime || 0} min</strong>
                      </div>
                    )}
                    {staffDetail.role === 'delivery' && (
                      <div className="summary-item">
                        <span>Avg. Delivery Time</span>
                        <strong>{staffDetail.summary?.averageDeliveryTime ?? 'N/A'}{staffDetail.summary?.averageDeliveryTime != null ? ' min' : ''}</strong>
                      </div>
                    )}
                  </div>

                  <div className="staff-profile">
                    {staffDetail.email && <span><strong>Email:</strong> {staffDetail.email}</span>}
                    {staffDetail.phone && <span><strong>Phone:</strong> {staffDetail.phone}</span>}
                    {staffDetail.firstAssignedAt && (
                      <span><strong>First assigned:</strong> {new Date(staffDetail.firstAssignedAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {staffDetail.itemsBreakdown && Object.keys(staffDetail.itemsBreakdown).length > 0 && (
                    <div className="table-card">
                      <h2>Units Sold by Item</h2>
                      <div className="table-responsive">
                        <table className="report-table">
                          <thead><tr><th>Item</th><th>Units Sold</th></tr></thead>
                          <tbody>
                            {staffItemPagination.pageItems
                              .map(([name, qty]) => <tr key={name}><td className="item-name">{name}</td><td>{qty}</td></tr>)}
                          </tbody>
                        </table>
                      </div>
                      <Pagination
                        currentPage={staffItemPagination.currentPage}
                        pageSize={staffItemPagination.pageSize}
                        totalItems={staffItemPagination.totalItems}
                        onPageChange={staffItemPagination.setPage}
                      />
                    </div>
                  )}

                  {staffDetail.dailyBreakdown && Object.keys(staffDetail.dailyBreakdown).length > 0 && (
                    <div className="table-card">
                      <h2>Daily Performance</h2>
                      <div className="table-responsive">
                        <table className="report-table">
                          <thead>
                            <tr>
                              <th>Date</th><th>Orders</th><th>Completed</th><th>Cancelled</th>
                              {REVENUE_ROLES.includes(staffDetail.role) && <th>Order Value</th>}
                              <th>Avg. Cooking</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staffDailyPagination.pageItems.map(([date, day]) => (
                              <tr key={date}>
                                <td>{date}</td>
                                <td>{day.count}</td>
                                <td>{day.completed}</td>
                                <td>{day.cancelled}</td>
                                {REVENUE_ROLES.includes(staffDetail.role) && <td>{formatMoney(day.totalAmount)}</td>}
                                <td>{day.avgCookingMinutes == null ? 'N/A' : `${day.avgCookingMinutes} min`}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Pagination
                        currentPage={staffDailyPagination.currentPage}
                        pageSize={staffDailyPagination.pageSize}
                        totalItems={staffDailyPagination.totalItems}
                        onPageChange={staffDailyPagination.setPage}
                      />
                    </div>
                  )}

                </div>
              </>
              ) : (
                <div className="empty-state">No staff detail is available for this period.</div>
              )
            ) : filteredStaff.length === 0 ? (
              <div className="empty-state">No staff activity in the selected period.</div>
            ) : (
              <>
                <div className="kpi-cards">
                  <div className="kpi-card">
                    <span className="kpi-label">Staff Members</span>
                    <strong className="kpi-value">{filteredStaff.length}</strong>
                  </div>
                  <div className="kpi-card">
                    <span
                      className="kpi-label"
                      title="Unique units on paid cafe orders, matching the Menu Items Report. Per-staff unit totals are attributed separately."
                    >
                      Total Units Sold
                    </span>
                    <strong className="kpi-value">{reportTotals?.unitsSold || 0}</strong>
                  </div>
                  {showStaffRevenue && (
                    <div
                      className="kpi-card"
                      title="Unique paid order totals, matching the Menu Items Report. Per-staff revenue and units are attributed separately."
                    >
                      <span className="kpi-label">Total Paid Revenue</span>
                      <strong className="kpi-value">{formatMoney(reportTotals?.paidRevenue)}</strong>
                    </div>
                  )}
                </div>

                <div className="table-card">
                  <h2>Staff Performance</h2>
                  <div className="table-responsive">
                    <table className={`report-table staff-performance-table${showStaffRevenue ? ' staff-performance-table--with-revenue' : ''}`}>
                      <colgroup>
                        <col style={{ width: '5%' }} />
                        <col style={{ width: showStaffRevenue ? '19%' : '23%' }} />
                        <col style={{ width: '17%' }} />
                        <col style={{ width: '16%' }} />
                        <col style={{ width: '14%' }} />
                        {showStaffRevenue && <col style={{ width: '17%' }} />}
                        <col style={{ width: showStaffRevenue ? '12%' : '25%' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Orders Handled</th>
                          <th title="Units on paid orders attributed to this staff member. Staff totals may overlap.">Units Sold</th>
                          {showStaffRevenue && <th>Total Revenue</th>}
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffPagination.pageItems.map((row, index) => (
                          <tr key={row.staffId || row._id || index}>
                            <td><span className="rank-badge">{(staffPagination.currentPage - 1) * staffPagination.pageSize + index + 1}</span></td>
                            <td className="item-name">{row.name || 'Unassigned'}</td>
                            <td>
                              <span className={`role-badge role-${row.role || 'unknown'}`}>
                                {ROLE_LABELS[row.role] || row.role || 'N/A'}
                              </span>
                            </td>
                            <td>{row.totalOrders || 0}</td>
                            <td>{row.unitsSold || 0}</td>
                            {showStaffRevenue && (
                              <td>{REVENUE_ROLES.includes(row.role) ? formatMoney(row.revenue) : '—'}</td>
                            )}
                            <td>
                              <button
                                className="btn-view-detail"
                                onClick={() => setSelectedStaff({ id: row.staffId, name: row.name })}
                              >
                                View Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    currentPage={staffPagination.currentPage}
                    pageSize={staffPagination.pageSize}
                    totalItems={staffPagination.totalItems}
                    onPageChange={staffPagination.setPage}
                  />
                </div>

                {showStaffRevenue && (
                  <div className="chart-card">
                    <h2>Revenue by Waiter and Delivery Staff</h2>
                    <div className="bar-chart">
                      {revenueStaffPagination.pageItems.map((row) => (
                        <div key={row.staffId || row._id} className="bar-row">
                          <span className="bar-label">{row.name || 'Unassigned'}</span>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${((Number(row.revenue) || 0) / peakStaffRevenue) * 100}%`
                              }}
                            />
                          </div>
                          <span className="bar-value">{formatMoney(row.revenue)}</span>
                        </div>
                      ))}
                    </div>
                    <Pagination
                      currentPage={revenueStaffPagination.currentPage}
                      pageSize={revenueStaffPagination.pageSize}
                      totalItems={revenueStaffPagination.totalItems}
                      onPageChange={revenueStaffPagination.setPage}
                    />
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;
