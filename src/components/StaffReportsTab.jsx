import React, { useState, useEffect } from 'react';
import { staffService } from '../services/api';
import { toast } from 'react-toastify';
import './StaffReportsTab.css';

const StaffReportsTab = () => {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      const [chefs, delivery] = await Promise.all([
        staffService.getStaffByRole('cook'),
        staffService.getStaffByRole('delivery')
      ]);
      
      setStaffList([
        ...(chefs.staff || []).map(s => ({ ...s, role: 'cook' })),
        ...(delivery.staff || []).map(s => ({ ...s, role: 'delivery' }))
      ]);
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Mock data for testing
      setStaffList([
        { _id: 'chef1', name: 'Chef Berhanu', role: 'cook', email: 'berhanu@example.com' },
        { _id: 'chef2', name: 'Chef Tigist', role: 'cook', email: 'tigist@example.com' },
        { _id: 'del1', name: 'Abebe Kebede', role: 'delivery', email: 'abebe@example.com' },
        { _id: 'del2', name: 'Almaz Worku', role: 'delivery', email: 'almaz@example.com' },
      ]);
    }
  };

  const generateReport = async () => {
    if (!reportType) return;
    
    setLoading(true);
    try {
      let data;
      
      if (reportType === 'summary') {
        data = await staffService.getStaffSummary(dateRange.start, dateRange.end);
      } else if (reportType === 'chef' && selectedStaff) {
        data = await staffService.getChefReport(selectedStaff, dateRange.start, dateRange.end);
      } else if (reportType === 'delivery' && selectedStaff) {
        data = await staffService.getDeliveryReport(selectedStaff, dateRange.start, dateRange.end);
      }
      
      setReportData(data);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      
      // Generate mock data for demonstration
      const mockData = generateMockReport();
      setReportData(mockData);
      toast.info('Using sample data - backend not connected');
    } finally {
      setLoading(false);
    }
  };

  const generateMockReport = () => {
    if (reportType === 'summary') {
      return {
        chefPerformance: [
          { name: 'Chef Berhanu', totalOrders: 45, totalItemsCooked: 78, avgTime: '12 min' },
          { name: 'Chef Tigist', totalOrders: 38, totalItemsCooked: 65, avgTime: '15 min' },
          { name: 'Chef Solomon', totalOrders: 52, totalItemsCooked: 94, avgTime: '10 min' },
        ],
        deliveryPerformance: [
          { name: 'Abebe Kebede', totalDeliveries: 67, totalAmount: 24500, avgTime: '25 min' },
          { name: 'Almaz Worku', totalDeliveries: 43, totalAmount: 15800, avgTime: '22 min' },
          { name: 'Kebede Alemu', totalDeliveries: 58, totalAmount: 21200, avgTime: '28 min' },
        ]
      };
    } else if (reportType === 'chef') {
      return {
        summary: {
          totalOrders: 45,
          totalItemsCooked: 78,
          totalCookingTime: 540,
          averageCookingTime: 12
        },
        itemsBreakdown: {
          'Cheese Burger': 25,
          'Doro Wat': 18,
          'Pizza': 15,
          'Pasta': 12,
          'Salad': 8
        }
      };
    } else if (reportType === 'delivery') {
      return {
        summary: {
          totalDeliveries: 67,
          totalAmount: 24500,
          totalDeliveryTime: 1675,
          averageDeliveryTime: 25
        },
        dailyBreakdown: {
          '2024-03-01': { count: 12, totalAmount: 4500 },
          '2024-03-02': { count: 15, totalAmount: 5200 },
          '2024-03-03': { count: 10, totalAmount: 3800 },
        }
      };
    }
  };

  const exportReport = (format) => {
    if (!reportData) {
      toast.error('Generate a report first');
      return;
    }

    try {
      // Convert report data to CSV
      let csv = '';
      
      if (reportType === 'summary') {
        csv = 'Staff Report Summary\n\n';
        csv += 'Chef Performance\n';
        csv += 'Name,Orders,Items Cooked,Avg Time\n';
        reportData.chefPerformance?.forEach(c => {
          csv += `${c.name},${c.totalOrders},${c.totalItemsCooked},${c.avgTime}\n`;
        });
        csv += '\nDelivery Performance\n';
        csv += 'Name,Deliveries,Total Amount,Avg Time\n';
        reportData.deliveryPerformance?.forEach(d => {
          csv += `${d.name},${d.totalDeliveries},${d.totalAmount},${d.avgTime}\n`;
        });
      }

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `staff-report-${reportType}-${dateRange.start}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="staff-reports-tab">
      <div className="reports-header">
        <h1 className="page-title">Staff Performance Reports</h1>
      </div>

      <div className="report-controls">
        <div className="report-type-selector">
          <button 
            className={reportType === 'summary' ? 'active' : ''}
            onClick={() => {
              setReportType('summary');
              setSelectedStaff(null);
            }}
          >
            📊 Summary Report
          </button>
          <button 
            className={reportType === 'chef' ? 'active' : ''}
            onClick={() => setReportType('chef')}
          >
            👨‍🍳 Chef Report
          </button>
          <button 
            className={reportType === 'delivery' ? 'active' : ''}
            onClick={() => setReportType('delivery')}
          >
            🚚 Delivery Report
          </button>
        </div>

        <div className="filter-section">
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

          {reportType !== 'summary' && (
            <div className="staff-selector">
              <select
                value={selectedStaff || ''}
                onChange={(e) => setSelectedStaff(e.target.value)}
              >
                <option value="">Select Staff Member</option>
                {staffList
                  .filter(s => s.role === (reportType === 'chef' ? 'cook' : 'delivery'))
                  .map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.role})
                    </option>
                  ))
                }
              </select>
            </div>
          )}

          <div className="report-actions">
            <button 
              className="btn-generate"
              onClick={generateReport}
              disabled={loading || (reportType !== 'summary' && !selectedStaff)}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            
            {reportData && (
              <div className="export-buttons">
                <button className="btn-export" onClick={() => exportReport('csv')}>
                  📥 Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {reportData && (
        <div className="report-results">
          {reportType === 'summary' && (
            <>
              <h2>Staff Performance Summary</h2>
              
              <div className="report-section">
                <h3>👨‍🍳 Chef Performance</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Chef Name</th>
                      <th>Orders Completed</th>
                      <th>Items Cooked</th>
                      <th>Avg. Time/Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.chefPerformance?.map((chef, idx) => (
                      <tr key={idx}>
                        <td>{chef.name}</td>
                        <td>{chef.totalOrders}</td>
                        <td>{chef.totalItemsCooked}</td>
                        <td>{chef.avgTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="report-section">
                <h3>🚚 Delivery Performance</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Delivery Person</th>
                      <th>Deliveries</th>
                      <th>Total Amount</th>
                      <th>Avg. Delivery Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.deliveryPerformance?.map((del, idx) => (
                      <tr key={idx}>
                        <td>{del.name}</td>
                        <td>{del.totalDeliveries}</td>
                        <td>ETB {del.totalAmount.toLocaleString()}</td>
                        <td>{del.avgTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {reportType === 'chef' && (
            <>
              <h2>Chef Performance Report</h2>
              
              <div className="summary-cards">
                <div className="summary-card">
                  <span className="label">Total Orders</span>
                  <span className="value">{reportData.summary?.totalOrders}</span>
                </div>
                <div className="summary-card">
                  <span className="label">Items Cooked</span>
                  <span className="value">{reportData.summary?.totalItemsCooked}</span>
                </div>
                <div className="summary-card">
                  <span className="label">Avg. Cooking Time</span>
                  <span className="value">{reportData.summary?.averageCookingTime} min</span>
                </div>
              </div>

              <div className="report-section">
                <h3>Items Cooked Breakdown</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Menu Item</th>
                      <th>Quantity Cooked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reportData.itemsBreakdown || {}).map(([item, qty]) => (
                      <tr key={item}>
                        <td>{item}</td>
                        <td>{qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {reportType === 'delivery' && (
            <>
              <h2>Delivery Performance Report</h2>
              
              <div className="summary-cards">
                <div className="summary-card">
                  <span className="label">Total Deliveries</span>
                  <span className="value">{reportData.summary?.totalDeliveries}</span>
                </div>
                <div className="summary-card">
                  <span className="label">Total Amount</span>
                  <span className="value">ETB {reportData.summary?.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="summary-card">
                  <span className="label">Avg. Delivery Time</span>
                  <span className="value">{reportData.summary?.averageDeliveryTime} min</span>
                </div>
              </div>

              <div className="report-section">
                <h3>Daily Breakdown</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Deliveries</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reportData.dailyBreakdown || {}).map(([date, data]) => (
                      <tr key={date}>
                        <td>{date}</td>
                        <td>{data.count}</td>
                        <td>ETB {data.totalAmount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffReportsTab;