// src/pages/admin/tabs/StaffTab.jsx
import React, { useState, useEffect } from 'react';
import { staffService } from '../../../services/api';
import { toast } from 'react-toastify';
import AddStaffModal from '../../../components/AddStaffModal';
import './StaffTab.css';

const StaffTab = () => {
  const [staff, setStaff] = useState({ cooks: [], delivery: [], cashiers: [] });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('cooks');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffPerformance, setStaffPerformance] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      
      const [cooks, delivery, cashiers] = await Promise.all([
        staffService.getStaffByRole('cook'),
        staffService.getStaffByRole('delivery'),
        staffService.getStaffByRole('cashier')
      ]);
      
      setStaff({
        cooks: cooks.staff || [],
        delivery: delivery.staff || [],
        cashiers: cashiers.staff || []
      });
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
      
      setStaff({
        cooks: [
          { _id: 'chef1', name: 'Chef Berhanu', email: 'berhanu@sewrica.com', phone: '0923456789', status: 'active', assignedOrders: 5, completedOrders: 45, rating: 4.8 },
          { _id: 'chef2', name: 'Chef Tigist', email: 'tigist@sewrica.com', phone: '0934567890', status: 'active', assignedOrders: 3, completedOrders: 38, rating: 4.9 },
          { _id: 'chef3', name: 'Chef Solomon', email: 'solomon@sewrica.com', phone: '0945678901', status: 'busy', assignedOrders: 7, completedOrders: 52, rating: 4.7 },
        ],
        delivery: [
          { _id: 'del1', name: 'Abebe Kebede', email: 'abebe@sewrica.com', phone: '0956789012', status: 'active', assignedOrders: 4, completedOrders: 67, rating: 4.6 },
          { _id: 'del2', name: 'Almaz Worku', email: 'almaz@sewrica.com', phone: '0967890123', status: 'active', assignedOrders: 2, completedOrders: 43, rating: 4.9 },
          { _id: 'del3', name: 'Kebede Alemu', email: 'kebede@sewrica.com', phone: '0978901234', status: 'on_delivery', assignedOrders: 6, completedOrders: 58, rating: 4.5 },
        ],
        cashiers: [
          { _id: 'cash1', name: 'Meron Tadesse', email: 'meron@sewrica.com', phone: '0989012345', status: 'active' },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStaffAdded = () => {
    fetchStaff();
  };

  const handleViewPerformance = async (staffId, role) => {
    try {
      setLoading(true);
      let data;
      
      if (role === 'cook') {
        data = await staffService.getChefReport(staffId);
      } else if (role === 'delivery') {
        data = await staffService.getDeliveryReport(staffId);
      }
      
      setStaffPerformance(data);
      setSelectedStaff({ id: staffId, role });
      setShowPerformanceModal(true);
    } catch (error) {
      console.error('Error fetching performance:', error);
      
      const mockData = role === 'cook' ? {
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
      } : {
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
      
      setStaffPerformance(mockData);
      setSelectedStaff({ id: staffId, role });
      setShowPerformanceModal(true);
      toast.info('Using sample performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, role) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    
    try {
      const response = await fetch(`/api/admin/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        toast.success('Staff member removed');
        fetchStaff();
      } else {
        toast.error('Failed to remove staff');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Network error');
    }
  };

  const handleEditStaff = (staffMember) => {
    toast.info('Edit functionality coming soon');
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#27ae60',
      busy: '#f39c12',
      on_delivery: '#3498db',
      offline: '#95a5a6'
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusText = (status) => {
    const texts = {
      active: 'Available',
      busy: 'Busy',
      on_delivery: 'On Delivery',
      offline: 'Offline'
    };
    return texts[status] || status;
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
        <p>Loading staff data...</p>
      </div>
    );
  }

  return (
    <div className="staff-tab">
      <AddStaffModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onStaffAdded={handleStaffAdded}
      />

      {showPerformanceModal && staffPerformance && (
        <div className="modal-overlay" onClick={() => setShowPerformanceModal(false)}>
          <div className="modal-content performance-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Staff Performance Report</h2>
              <button className="modal-close-btn" onClick={() => setShowPerformanceModal(false)}>×</button>
            </div>
            
            {selectedStaff?.role === 'cook' && (
              <div className="performance-data">
                <div className="summary-cards">
                  <div className="summary-card">
                    <span className="label">Total Orders</span>
                    <span className="value">{staffPerformance.summary?.totalOrders || 0}</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">Items Cooked</span>
                    <span className="value">{staffPerformance.summary?.totalItemsCooked || 0}</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">Total Time</span>
                    <span className="value">{staffPerformance.summary?.totalCookingTime || 0} min</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">Avg. Time</span>
                    <span className="value">{staffPerformance.summary?.averageCookingTime || 0} min</span>
                  </div>
                </div>

                <h3 className="section-title">Items Cooked Breakdown</h3>
                <div className="table-responsive">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Menu Item</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(staffPerformance.itemsBreakdown || {}).map(([item, qty]) => (
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

            {selectedStaff?.role === 'delivery' && (
              <div className="performance-data">
                <div className="summary-cards">
                  <div className="summary-card">
                    <span className="label">Total Deliveries</span>
                    <span className="value">{staffPerformance.summary?.totalDeliveries || 0}</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">Total Amount</span>
                    <span className="value">ETB {staffPerformance.summary?.totalAmount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">Total Time</span>
                    <span className="value">{staffPerformance.summary?.totalDeliveryTime || 0} min</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">Avg. Time</span>
                    <span className="value">{staffPerformance.summary?.averageDeliveryTime || 0} min</span>
                  </div>
                </div>

                <h3 className="section-title">Daily Performance</h3>
                <div className="table-responsive">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Deliveries</th>
                        <th>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(staffPerformance.dailyBreakdown || {}).map(([date, data]) => (
                        <tr key={date}>
                          <td>{date}</td>
                          <td>{data.count}</td>
                          <td>ETB {data.totalAmount?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="staff-tab-header">
        <h1 className="page-title">Staff Management</h1>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Add New Staff
        </button>
      </div>

      <div className="staff-tabs">
        <button 
          className={`staff-tab-btn ${activeSection === 'cooks' ? 'active' : ''}`}
          onClick={() => setActiveSection('cooks')}
        >
          👨‍🍳 Chefs ({staff.cooks.length})
        </button>
        <button 
          className={`staff-tab-btn ${activeSection === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveSection('delivery')}
        >
          🚚 Delivery ({staff.delivery.length})
        </button>
        <button 
          className={`staff-tab-btn ${activeSection === 'cashiers' ? 'active' : ''}`}
          onClick={() => setActiveSection('cashiers')}
        >
          💰 Cashiers ({staff.cashiers.length})
        </button>
      </div>

      <div className="staff-grid">
        {activeSection === 'cooks' && staff.cooks.map(cook => (
          <div key={cook._id} className="staff-card" data-role="cook">
            <div className="staff-card-header">
              <div className="staff-avatar">👨‍🍳</div>
              <div className="staff-info">
                <h3>{cook.name}</h3>
                <span className="staff-status" style={{ backgroundColor: getStatusColor(cook.status) }}>
                  {getStatusText(cook.status)}
                </span>
              </div>
            </div>

            <div className="staff-card-body">
              <div className="staff-detail">
                <span className="detail-label">📧 Email:</span>
                <span className="detail-value">{cook.email}</span>
              </div>
              <div className="staff-detail">
                <span className="detail-label">📱 Phone:</span>
                <span className="detail-value">{cook.phone}</span>
              </div>
              <div className="staff-detail">
                <span className="detail-label">📊 Performance:</span>
                <span className="detail-value rating">
                  {renderStars(cook.rating || 4.5)} ({cook.rating || 4.5})
                </span>
              </div>
              <div className="staff-stats">
                <div className="stat">
                  <span className="stat-value">{cook.assignedOrders || 0}</span>
                  <span className="stat-label">Active</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{cook.completedOrders || 0}</span>
                  <span className="stat-label">Completed</span>
                </div>
              </div>
            </div>

            <div className="staff-card-footer">
              <button className="btn-view" onClick={() => handleViewPerformance(cook._id, 'cook')}>
                📊 View Report
              </button>
              <button className="btn-edit" onClick={() => handleEditStaff(cook)}>
                ✏️ Edit
              </button>
              <button className="btn-delete" onClick={() => handleDeleteStaff(cook._id, 'cook')}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}

        {activeSection === 'delivery' && staff.delivery.map(delivery => (
          <div key={delivery._id} className="staff-card" data-role="delivery">
            <div className="staff-card-header">
              <div className="staff-avatar">🚚</div>
              <div className="staff-info">
                <h3>{delivery.name}</h3>
                <span className="staff-status" style={{ backgroundColor: getStatusColor(delivery.status) }}>
                  {getStatusText(delivery.status)}
                </span>
              </div>
            </div>

            <div className="staff-card-body">
              <div className="staff-detail">
                <span className="detail-label">📧 Email:</span>
                <span className="detail-value">{delivery.email}</span>
              </div>
              <div className="staff-detail">
                <span className="detail-label">📱 Phone:</span>
                <span className="detail-value">{delivery.phone}</span>
              </div>
              <div className="staff-detail">
                <span className="detail-label">📊 Performance:</span>
                <span className="detail-value rating">
                  {renderStars(delivery.rating || 4.5)} ({delivery.rating || 4.5})
                </span>
              </div>
              <div className="staff-stats">
                <div className="stat">
                  <span className="stat-value">{delivery.assignedOrders || 0}</span>
                  <span className="stat-label">Active</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{delivery.completedOrders || 0}</span>
                  <span className="stat-label">Delivered</span>
                </div>
              </div>
            </div>

            <div className="staff-card-footer">
              <button className="btn-view" onClick={() => handleViewPerformance(delivery._id, 'delivery')}>
                📊 View Report
              </button>
              <button className="btn-edit" onClick={() => handleEditStaff(delivery)}>
                ✏️ Edit
              </button>
              <button className="btn-delete" onClick={() => handleDeleteStaff(delivery._id, 'delivery')}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}

        {activeSection === 'cashiers' && staff.cashiers.map(cashier => (
          <div key={cashier._id} className="staff-card" data-role="cashier">
            <div className="staff-card-header">
              <div className="staff-avatar">💰</div>
              <div className="staff-info">
                <h3>{cashier.name}</h3>
                <span className="staff-status" style={{ backgroundColor: getStatusColor(cashier.status) }}>
                  {getStatusText(cashier.status)}
                </span>
              </div>
            </div>

            <div className="staff-card-body">
              <div className="staff-detail">
                <span className="detail-label">📧 Email:</span>
                <span className="detail-value">{cashier.email}</span>
              </div>
              <div className="staff-detail">
                <span className="detail-label">📱 Phone:</span>
                <span className="detail-value">{cashier.phone}</span>
              </div>
            </div>

            <div className="staff-card-footer">
              <button className="btn-edit" onClick={() => handleEditStaff(cashier)}>
                ✏️ Edit
              </button>
              <button className="btn-delete" onClick={() => handleDeleteStaff(cashier._id, 'cashier')}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {staff[activeSection].length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            {activeSection === 'cooks' ? '👨‍🍳' : activeSection === 'delivery' ? '🚚' : '💰'}
          </div>
          <h3>No {activeSection} found</h3>
          <p>Click "Add New Staff" to add a {activeSection.slice(0, -1)}.</p>
        </div>
      )}
    </div>
  );
};

export default StaffTab;