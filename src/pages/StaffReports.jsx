import React, { useState, useEffect } from 'react';
import { staffService } from '../services/api';
import { toast } from 'react-toastify';
import './StaffReports.css';

const StaffReports = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
    end: new Date().toISOString().split('T')[0] // Today
  });
  
  // Data states
  const [staffSummary, setStaffSummary] = useState(null);
  const [chefs, setChefs] = useState([]);
  const [delivery, setDelivery] = useState([]);
  const [selectedChef, setSelectedChef] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [chefReport, setChefReport] = useState(null);
  const [deliveryReport, setDeliveryReport] = useState(null);

  // Load staff lists on mount
  useEffect(() => {
    fetchStaffLists();
  }, []);

  const fetchStaffLists = async () => {
    try {
      const [chefsData, deliveryData] = await Promise.all([
        staffService.getStaffByRole('cook'),
        staffService.getStaffByRole('delivery')
      ]);
      
      setChefs(chefsData.staff || []);
      setDelivery(deliveryData.staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff lists');
    }
  };

  const loadStaffSummary = async () => {
    try {
      setLoading(true);
      const data = await staffService.getStaffSummary(dateRange.start, dateRange.end);
      setStaffSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
      toast.error('Failed to load staff summary');
    } finally {
      setLoading(false);
    }
  };

  const loadChefReport = async (chefId) => {
    try {
      setLoading(true);
      const data = await staffService.getChefReport(chefId, dateRange.start, dateRange.end);
      setChefReport(data);
    } catch (error) {
      console.error('Error loading chef report:', error);
      toast.error('Failed to load chef report');
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryReport = async (deliveryId) => {
    try {
      setLoading(true);
      const data = await staffService.getDeliveryReport(deliveryId, dateRange.start, dateRange.end);
      setDeliveryReport(data);
    } catch (error) {
      console.error('Error loading delivery report:', error);
      toast.error('Failed to load delivery report');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  return (
    <div className="staff-reports-page">
      <div className="container">
        <h1 className="page-title">Staff Performance Reports</h1>

        {/* Date Range Selector */}
        <div className="date-range-card">
          <h3>Select Period</h3>
          <div className="date-inputs">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="form-control"
              />
            </div>
            <button 
              className="btn-primary"
              onClick={loadStaffSummary}
              disabled={loading}
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="report-tabs">
          <button
            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('summary');
              loadStaffSummary();
            }}
          >
            📊 Staff Summary
          </button>
          <button
            className={`tab-btn ${activeTab === 'chefs' ? 'active' : ''}`}
            onClick={() => setActiveTab('chefs')}
          >
            👨‍🍳 Chef Reports
          </button>
          <button
            className={`tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivery')}
          >
            🚚 Delivery Reports
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading reports...</p>
            </div>
          )}

          {!loading && activeTab === 'summary' && staffSummary && (
            <div className="summary-reports">
              {/* Chef Summary */}
              <div className="report-section">
                <h2>👨‍🍳 Chef Performance</h2>
                <div className="staff-grid">
                  {staffSummary.chefPerformance?.map(chef => (
                    <div key={chef.chefId} className="staff-card">
                      <h3>{chef.name}</h3>
                      <div className="stats">
                        <div className="stat">
                          <span className="label">Orders Cooked:</span>
                          <span className="value">{chef.totalOrders}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Items Cooked:</span>
                          <span className="value">{chef.totalItemsCooked}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Summary */}
              <div className="report-section">
                <h2>🚚 Delivery Performance</h2>
                <div className="staff-grid">
                  {staffSummary.deliveryPerformance?.map(person => (
                    <div key={person.deliveryId} className="staff-card">
                      <h3>{person.name}</h3>
                      <div className="stats">
                        <div className="stat">
                          <span className="label">Deliveries:</span>
                          <span className="value">{person.totalDeliveries}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Amount:</span>
                          <span className="value">{formatNumber(person.totalAmount)} ETB</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'chefs' && (
            <div className="chef-reports">
              <div className="selector-panel">
                <h3>Select Chef</h3>
                <select 
                  className="form-control"
                  onChange={(e) => {
                    const chef = chefs.find(c => c._id === e.target.value);
                    setSelectedChef(chef);
                    if (e.target.value) {
                      loadChefReport(e.target.value);
                    }
                  }}
                >
                  <option value="">Choose a chef...</option>
                  {chefs.map(chef => (
                    <option key={chef._id} value={chef._id}>{chef.name}</option>
                  ))}
                </select>
              </div>

              {chefReport && (
                <div className="report-details">
                  <h2>{selectedChef?.name}'s Performance</h2>
                  
                  <div className="summary-cards">
                    <div className="summary-card">
                      <span className="label">Total Orders</span>
                      <span className="value">{chefReport.summary.totalOrders}</span>
                    </div>
                    <div className="summary-card">
                      <span className="label">Items Cooked</span>
                      <span className="value">{chefReport.summary.totalItemsCooked}</span>
                    </div>
                    <div className="summary-card">
                      <span className="label">Avg Cooking Time</span>
                      <span className="value">{chefReport.summary.averageCookingTime} min</span>
                    </div>
                  </div>

                  <div className="items-breakdown">
                    <h3>Items Cooked</h3>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(chefReport.itemsBreakdown).map(([item, qty]) => (
                          <tr key={item}>
                            <td>{item}</td>
                            <td>{qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && activeTab === 'delivery' && (
            <div className="delivery-reports">
              <div className="selector-panel">
                <h3>Select Delivery Person</h3>
                <select 
                  className="form-control"
                  onChange={(e) => {
                    const person = delivery.find(d => d._id === e.target.value);
                    setSelectedDelivery(person);
                    if (e.target.value) {
                      loadDeliveryReport(e.target.value);
                    }
                  }}
                >
                  <option value="">Choose a person...</option>
                  {delivery.map(person => (
                    <option key={person._id} value={person._id}>{person.name}</option>
                  ))}
                </select>
              </div>

              {deliveryReport && (
                <div className="report-details">
                  <h2>{selectedDelivery?.name}'s Performance</h2>
                  
                  <div className="summary-cards">
                    <div className="summary-card">
                      <span className="label">Total Deliveries</span>
                      <span className="value">{deliveryReport.summary.totalDeliveries}</span>
                    </div>
                    <div className="summary-card">
                      <span className="label">Total Amount</span>
                      <span className="value">{formatNumber(deliveryReport.summary.totalAmount)} ETB</span>
                    </div>
                    <div className="summary-card">
                      <span className="label">Avg Delivery Time</span>
                      <span className="value">{deliveryReport.summary.averageDeliveryTime} min</span>
                    </div>
                  </div>

                  <div className="daily-breakdown">
                    <h3>Daily Breakdown</h3>
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Deliveries</th>
                          <th>Total Amount</th>
                          <th>Total Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(deliveryReport.dailyBreakdown).map(([date, data]) => (
                          <tr key={date}>
                            <td>{new Date(date).toLocaleDateString()}</td>
                            <td>{data.count}</td>
                            <td>{formatNumber(data.totalAmount)} ETB</td>
                            <td>{data.totalTime} min</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffReports;