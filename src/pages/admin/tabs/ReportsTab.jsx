// src/pages/admin/tabs/ReportsTab.jsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/api';
import { toast } from 'react-toastify';
import './ReportsTab.css';

const ReportsTab = () => {
  const [reportType, setReportType] = useState('daily');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Auto-generate report on component mount
  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    try {
      setLoading(true);
      let data;
      
      switch(reportType) {
        case 'daily':
          data = await adminService.getDailyReport(dateRange.start);
          break;
        case 'weekly':
          data = await adminService.getWeeklyReport();
          break;
        case 'monthly':
          data = await adminService.getMonthlyReport();
          break;
        case 'custom':
          data = await adminService.getReport('custom', dateRange.start, dateRange.end);
          break;
        default:
          data = await adminService.getDailyReport();
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData(null);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const data = await adminService.exportReport(reportType, format, dateRange.start, dateRange.end);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportType}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="reports-tab">
      <div className="reports-header">
        <div>
          <h1 className="page-title">📊 Sales Reports</h1>
          <p className="page-subtitle">View detailed sales analytics and performance metrics</p>
        </div>
      </div>
      
      <div className="report-controls">
        <div className="control-group">
          <div className="report-type-selector">
            <button className={reportType === 'daily' ? 'active' : ''} onClick={() => setReportType('daily')}>
              📅 Daily
            </button>
            <button className={reportType === 'weekly' ? 'active' : ''} onClick={() => setReportType('weekly')}>
              📆 Weekly
            </button>
            <button className={reportType === 'monthly' ? 'active' : ''} onClick={() => setReportType('monthly')}>
              📋 Monthly
            </button>
            <button className={reportType === 'custom' ? 'active' : ''} onClick={() => setReportType('custom')}>
              🎯 Custom Range
            </button>
          </div>

          {reportType === 'custom' && (
            <div className="date-range">
              <div className="date-input-group">
                <label>From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
              </div>
              <span className="date-range-separator">to</span>
              <div className="date-input-group">
                <label>To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="report-actions">
            <button className="btn-generate" onClick={generateReport} disabled={loading}>
              {loading ? '⏳ Generating...' : '🔄 Generate Report'}
            </button>
            {reportData && (
              <div className="export-buttons">
                <button className="btn-export btn-csv" onClick={() => handleExport('csv')}>
                  📥 CSV
                </button>
                <button className="btn-export btn-pdf" onClick={() => handleExport('pdf')}>
                  📄 PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {reportData && (
        <div className="report-results">
          <h2>📈 Report Summary - {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</h2>
          
          <div className="summary-cards">
            <div className="summary-card primary">
              <div className="card-icon">📦</div>
              <span className="label">Total Orders</span>
              <span className="value">{reportData.totalOrders}</span>
            </div>
            <div className="summary-card success">
              <div className="card-icon">💰</div>
              <span className="label">Total Revenue</span>
              <span className="value">{reportData.totalRevenue.toLocaleString()} ETB</span>
            </div>
            <div className="summary-card warning">
              <div className="card-icon">📊</div>
              <span className="label">Average Order Value</span>
              <span className="value">{reportData.averageOrderValue.toLocaleString()} ETB</span>
            </div>
          </div>

          <div className="report-grid">
            <div className="report-section">
              <h3>📂 Sales by Category</h3>
              <div className="category-breakdown">
                {reportData.categoryBreakdown?.map((cat, idx) => (
                  <div key={cat.category} className="breakdown-item">
                    <div className="breakdown-header">
                      <span className="category-name">{cat.category}</span>
                      <span className="category-stats">
                        <strong>{cat.itemsSold}</strong> items • <strong>{cat.revenue.toLocaleString()}</strong> ETB
                      </span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${(cat.revenue / Math.max(...reportData.categoryBreakdown.map(c => c.revenue))) * 100}%`,
                          backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'][idx % 4]
                        }}
                      />
                    </div>
                    <div className="percentage">{cat.percentage || Math.round((cat.revenue / reportData.totalRevenue) * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="report-section">
              <h3>🍽️ Top Selling Items</h3>
              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topItems?.map((item, idx) => (
                      <tr key={item.name} className={`rank-${idx + 1}`}>
                        <td className="item-name">
                          <span className="rank-badge">#{idx + 1}</span>
                          {item.name}
                        </td>
                        <td className="quantity">{item.quantity}</td>
                        <td className="revenue">{item.revenue.toLocaleString()} ETB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="report-section full-width">
            <h3>🚚 Delivery Performance</h3>
            <div className="delivery-breakdown">
              {reportData.deliveryBreakdown?.map(del => (
                <div key={del.name} className="delivery-card">
                  <div className="delivery-header">
                    <h4>{del.name}</h4>
                    <span className="delivery-badge">{del.ordersCount} orders</span>
                  </div>
                  <div className="delivery-stats">
                    <div className="stat">
                      <span className="label">Total Amount</span>
                      <span className="value">{del.totalAmount.toLocaleString()} ETB</span>
                    </div>
                    <div className="stat">
                      <span className="label">Performance</span>
                      <span className="percentage">{del.percentage || Math.round((del.totalAmount / reportData.deliveryBreakdown.reduce((sum, d) => sum + d.totalAmount, 0)) * 100)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;