// src/pages/admin/tabs/ReportsTab.jsx
import React, { useState } from 'react';
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
      setReportData({
        totalOrders: 45,
        totalRevenue: 12500,
        averageOrderValue: 278,
        categoryBreakdown: [
          { category: 'Main Course', itemsSold: 28, revenue: 8400 },
          { category: 'Appetizers', itemsSold: 12, revenue: 2160 },
          { category: 'Desserts', itemsSold: 8, revenue: 960 },
          { category: 'Beverages', itemsSold: 15, revenue: 980 },
        ],
        deliveryBreakdown: [
          { name: 'Abebe', ordersCount: 15, totalAmount: 4200 },
          { name: 'Kebede', ordersCount: 12, totalAmount: 3600 },
          { name: 'Almaz', ordersCount: 18, totalAmount: 4700 },
        ],
        topItems: [
          { name: 'Cheese Burger', quantity: 25, revenue: 6250 },
          { name: 'Doro Wat', quantity: 18, revenue: 5040 },
          { name: 'Pizza', quantity: 15, revenue: 5250 },
        ]
      });
      toast.error('Using mock data - backend not connected');
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
      <h1 className="page-title">Sales Reports</h1>
      
      <div className="report-controls">
        <div className="report-type-selector">
          <button className={reportType === 'daily' ? 'active' : ''} onClick={() => setReportType('daily')}>
            Daily
          </button>
          <button className={reportType === 'weekly' ? 'active' : ''} onClick={() => setReportType('weekly')}>
            Weekly
          </button>
          <button className={reportType === 'monthly' ? 'active' : ''} onClick={() => setReportType('monthly')}>
            Monthly
          </button>
          <button className={reportType === 'custom' ? 'active' : ''} onClick={() => setReportType('custom')}>
            Custom Range
          </button>
        </div>

        {reportType === 'custom' && (
          <div className="date-range">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        )}

        <div className="report-actions">
          <button className="btn-generate" onClick={generateReport} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData && (
            <div className="export-buttons">
              <button className="btn-export" onClick={() => handleExport('csv')}>Export CSV</button>
              <button className="btn-export" onClick={() => handleExport('pdf')}>Export PDF</button>
            </div>
          )}
        </div>
      </div>

      {reportData && (
        <div className="report-results">
          <h2>Report Summary - {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</h2>
          
          <div className="summary-cards">
            <div className="summary-card">
              <span className="label">Total Orders</span>
              <span className="value">{reportData.totalOrders}</span>
            </div>
            <div className="summary-card">
              <span className="label">Total Revenue</span>
              <span className="value">{reportData.totalRevenue.toLocaleString()} ETB</span>
            </div>
            <div className="summary-card">
              <span className="label">Average Order</span>
              <span className="value">{reportData.averageOrderValue.toLocaleString()} ETB</span>
            </div>
          </div>

          <div className="report-section">
            <h3>Sales by Category</h3>
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Items Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.categoryBreakdown?.map(cat => (
                    <tr key={cat.category}>
                      <td>{cat.category}</td>
                      <td>{cat.itemsSold}</td>
                      <td>{cat.revenue.toLocaleString()} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="report-section">
            <h3>Top Selling Items</h3>
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topItems?.map(item => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.revenue.toLocaleString()} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="report-section">
            <h3>Delivery Performance</h3>
            <div className="table-responsive">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Delivery Person</th>
                    <th>Orders Delivered</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.deliveryBreakdown?.map(del => (
                    <tr key={del.name}>
                      <td>{del.name}</td>
                      <td>{del.ordersCount}</td>
                      <td>{del.totalAmount.toLocaleString()} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;