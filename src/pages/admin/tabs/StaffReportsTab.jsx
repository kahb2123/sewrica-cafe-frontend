// src/pages/admin/tabs/StaffReportsTab.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { staffService } from '../../../services/api';
import { toast } from 'react-toastify';
import './StaffReportsTab.css';

const StaffReportsTab = () => {
  const { user, isAuthenticated } = useAuth();
  const [staffReports, setStaffReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filterRole, setFilterRole] = useState('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      return;
    }
    fetchStaffReports();
  }, [dateRange, filterRole, isAuthenticated, user]);

  const fetchStaffReports = async () => {
    try {
      setLoading(true);
      let data;
      
      if (filterRole === 'all') {
        data = await staffService.getAllStaffReports(dateRange.start, dateRange.end);
      } else {
        data = await staffService.getStaffReportsByRole(filterRole, dateRange.start, dateRange.end);
      }
      
      setStaffReports(data.reports || []);
      
    } catch (error) {
      console.error('Error fetching staff reports:', error);
      toast.error(error.response?.data?.message || 'Failed to load staff reports');
      setStaffReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format, staffId = null) => {
    try {
      setExporting(true);
      const data = await staffService.exportStaffReport(
        format, 
        staffId, 
        dateRange.start, 
        dateRange.end,
        filterRole !== 'all' ? filterRole : null
      );
      
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `staff-report-${staffId || 'all'}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'cook':
        return '👨‍🍳';
      case 'delivery':
        return '🚚';
      case 'cashier':
        return '💰';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'cook':
        return '#e74c3c';
      case 'delivery':
        return '#3498db';
      case 'cashier':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push('★');
      } else if (i - 0.5 <= rating) {
        stars.push('½');
      } else {
        stars.push('☆');
      }
    }
    return stars.join('');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading staff reports...</p>
      </div>
    );
  }

  return (
    <div className="staff-reports-tab">
      <h1 className="page-title">Staff Performance Reports</h1>
      
      <div className="report-filters">
        <div className="filter-group">
          <label>Date Range:</label>
          <div className="date-range-inputs">
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
        </div>

        <div className="filter-group">
          <label>Staff Role:</label>
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="role-filter-select"
          >
            <option value="all">All Staff</option>
            <option value="cook">Chefs</option>
            <option value="delivery">Delivery Personnel</option>
            <option value="cashier">Cashiers</option>
          </select>
        </div>

        <div className="export-actions">
          <button 
            className="btn-export-all"
            onClick={() => handleExportReport('csv')}
            disabled={exporting || staffReports.length === 0}
          >
            {exporting ? 'Exporting...' : '📊 Export All (CSV)'}
          </button>
          <button 
            className="btn-export-all"
            onClick={() => handleExportReport('pdf')}
            disabled={exporting || staffReports.length === 0}
          >
            {exporting ? 'Exporting...' : '📄 Export All (PDF)'}
          </button>
        </div>
      </div>

      <div className="staff-reports-summary">
        <div className="summary-card">
          <span className="summary-icon">👥</span>
          <div className="summary-info">
            <span className="summary-label">Total Staff</span>
            <span className="summary-value">{staffReports.length}</span>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-icon">📦</span>
          <div className="summary-info">
            <span className="summary-label">Total Orders</span>
            <span className="summary-value">
              {staffReports.reduce((sum, report) => sum + report.totalOrders, 0)}
            </span>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-icon">💰</span>
          <div className="summary-info">
            <span className="summary-label">Total Revenue</span>
            <span className="summary-value">
              ETB {staffReports.reduce((sum, report) => sum + report.totalRevenue, 0).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-icon">⭐</span>
          <div className="summary-info">
            <span className="summary-label">Avg Rating</span>
            <span className="summary-value">
              {(staffReports.reduce((sum, report) => sum + (report.averageRating || 0), 0) / staffReports.length || 0).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="staff-reports-grid">
        {staffReports.length > 0 ? (
          staffReports.map(report => (
            <div key={report._id} className="staff-report-card">
              <div className="report-card-header" style={{ backgroundColor: getRoleColor(report.role) }}>
                <div className="staff-avatar-large">
                  {getRoleIcon(report.role)}
                </div>
                <div className="staff-info-header">
                  <h3>{report.name}</h3>
                  <span className="role-badge">{report.role}</span>
                </div>
              </div>

              <div className="report-card-body">
                <div className="performance-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Orders</span>
                    <span className="stat-value">{report.totalOrders}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Completed</span>
                    <span className="stat-value success">{report.completedOrders}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Cancelled</span>
                    <span className="stat-value danger">{report.cancelledOrders || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Revenue</span>
                    <span className="stat-value">ETB {report.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Rating</span>
                    <span className="stat-value rating">
                      {renderStars(report.averageRating || 4.5)} ({report.averageRating || 4.5})
                    </span>
                  </div>
                </div>

                <div className="performance-preview">
                  <h4>Recent Performance</h4>
                  <div className="preview-items">
                    {report.performance?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="preview-item">
                        <span className="preview-date">{item.date}</span>
                        <span className="preview-count">
                          {report.role === 'cook' ? `${item.orders} orders` : `${item.deliveries} deliveries`}
                        </span>
                        <span className="preview-amount">ETB {(item.revenue || item.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="report-card-footer">
                <button 
                  className="btn-view-details"
                  onClick={() => handleViewDetails(report)}
                >
                  📊 View Detailed Report
                </button>
                <button 
                  className="btn-export-staff"
                  onClick={() => handleExportReport('pdf', report.staffId)}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting...' : '📄 Export PDF'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-reports">
            <div className="empty-icon">📊</div>
            <h3>No Reports Found</h3>
            <p>No staff reports available for the selected date range and filters.</p>
          </div>
        )}
      </div>

      {/* Detailed Report Modal */}
      {showDetailsModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content detailed-report-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detailed Staff Report</h2>
              <button className="modal-close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>

            <div className="detailed-report-content">
              <div className="staff-header-info">
                <div className="staff-avatar-large" style={{ backgroundColor: getRoleColor(selectedReport.role) }}>
                  {getRoleIcon(selectedReport.role)}
                </div>
                <div className="staff-header-details">
                  <h3>{selectedReport.name}</h3>
                  <p className="staff-role">{selectedReport.role}</p>
                  <p className="staff-id">ID: {selectedReport.staffId}</p>
                </div>
              </div>

              <div className="report-summary-stats">
                <div className="summary-stat">
                  <span className="stat-label">Total Orders</span>
                  <span className="stat-number">{selectedReport.totalOrders}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Completed Orders</span>
                  <span className="stat-number success">{selectedReport.completedOrders}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Cancelled Orders</span>
                  <span className="stat-number danger">{selectedReport.cancelledOrders || 0}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Total Revenue</span>
                  <span className="stat-number">ETB {selectedReport.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Average Rating</span>
                  <span className="stat-number rating">
                    {renderStars(selectedReport.averageRating || 4.5)} ({selectedReport.averageRating || 4.5})
                  </span>
                </div>
              </div>

              <div className="detailed-performance">
                <h3>Daily Performance Breakdown</h3>
                <div className="table-responsive">
                  <table className="performance-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>{selectedReport.role === 'cook' ? 'Orders Cooked' : 'Deliveries'}</th>
                        <th>Revenue/Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReport.performance?.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.date}</td>
                          <td>{selectedReport.role === 'cook' ? item.orders : item.deliveries}</td>
                          <td>ETB {(item.revenue || item.amount || 0).toLocaleString()}</td>
                          <td>
                            <span className="status-badge completed">Completed</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button 
                  className="btn-export-detail"
                  onClick={() => handleExportReport('pdf', selectedReport.staffId)}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting...' : '📄 Export Full Report (PDF)'}
                </button>
                <button 
                  className="btn-close-detail"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffReportsTab;