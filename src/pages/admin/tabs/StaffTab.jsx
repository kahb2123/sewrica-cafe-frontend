// src/pages/admin/tabs/StaffTab.jsx
import React, { useState, useEffect } from 'react';
import { adminService, staffService, ROLE_PERMISSIONS, PERMISSIONS } from '../../../services/api';
import { toast } from 'react-toastify';
import PermissionGate from '../../../components/PermissionGate';
import AddStaffModal from '../../../components/AddStaffModal';
import './StaffTab.css';

const PermissionDescriptions = {
  [PERMISSIONS.ORDERS_ACCEPT]: 'Accept orders',
  [PERMISSIONS.ORDERS_REJECT]: 'Reject orders',
  [PERMISSIONS.ORDERS_START_COOKING]: 'Start cooking',
  [PERMISSIONS.ORDERS_COMPLETE_COOKING]: 'Mark cooking complete',
  [PERMISSIONS.ORDERS_START_DELIVERY]: 'Start delivery',
  [PERMISSIONS.ORDERS_COMPLETE_DELIVERY]: 'Complete delivery',
  [PERMISSIONS.ORDERS_VIEW_ASSIGNED]: 'View assigned orders',
  [PERMISSIONS.ORDERS_VIEW]: 'View all orders',
  [PERMISSIONS.ORDERS_ALL]: 'Manage all orders',
  [PERMISSIONS.ORDERS_ASSIGN_CHEF]: 'Assign chef',
  [PERMISSIONS.ORDERS_ASSIGN_DELIVERY]: 'Assign delivery',
  [PERMISSIONS.ORDERS_UPDATE_STATUS]: 'Update order status',
  [PERMISSIONS.STAFF_VIEW]: 'View staff',
  [PERMISSIONS.STAFF_CREATE]: 'Create staff',
  [PERMISSIONS.STAFF_UPDATE]: 'Update staff',
  [PERMISSIONS.STAFF_DELETE]: 'Delete staff',
  [PERMISSIONS.MENU_MANAGE]: 'Manage menu',
  [PERMISSIONS.INGREDIENTS_MANAGE]: 'Manage ingredients',
  [PERMISSIONS.EXPENSES_MANAGE]: 'Manage expenses',
  [PERMISSIONS.REPORTS_VIEW]: 'View reports',
  [PERMISSIONS.REPORTS_EXPORT]: 'Export reports',
  [PERMISSIONS.PAYMENTS_PROCESS]: 'Process payments',
  [PERMISSIONS.PAYMENTS_VIEW]: 'View payments',
};

const roleLabels = {
  cook: 'Chef',
  chef: 'Chef',
  delivery: 'Delivery',
  cashier: 'Cashier',
  admin: 'Admin',
  customer: 'Customer',
  supply_chain: 'Supply Chain',
};

const StaffTab = () => {
  const [staff, setStaff] = useState({ cooks: [], delivery: [], cashiers: [] });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('cooks');
   const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
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
          { _id: 'cash1', name: 'Meron Tadesse', email: 'meron@sewrica.com', phone: '0989012345', status: 'active', rating: 4.7 },
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
      const response = await adminService.getUnifiedReport({ staffId });
      const detail = response?.data?.staffDetail;

      if (!detail) {
        toast.info('No activity recorded for this staff member yet');
        setStaffPerformance(null);
        setSelectedStaff({ id: staffId, role });
        setShowPerformanceModal(true);
        return;
      }

      setStaffPerformance(detail);
      setSelectedStaff({ id: staffId, role });
      setShowPerformanceModal(true);
    } catch (error) {
      console.error('Error fetching performance:', error);
      toast.error(error.message || 'Failed to load performance');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, role) => {
    if (!window.confirm(`Are you sure you want to remove this ${role}?`)) return;
    
    try {
      await adminService.deleteStaff(staffId);
      toast.success('Staff member removed');
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error(error.message || 'Failed to remove staff');
    }
  };

  const handleEditStaff = async (staffMember) => {
    try {
      const data = await adminService.getStaffPermissions(staffMember._id);
      setEditingStaff({
        ...staffMember,
        extraPermissions: data.extraPermissions || [],
        deniedPermissions: data.deniedPermissions || [],
        pageAccessOverrides: data.pageAccessOverrides || {}
      });
      setShowEditModal(true);
    } catch (error) {
      toast.error(error.message || 'Failed to load staff permissions');
    }
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

  const getRolePermissionList = (role) => {
    const perms = ROLE_PERMISSIONS[role] || [];
    return perms.map(perm => ({
      key: perm,
      label: PermissionDescriptions[perm] || perm,
    }));
  };

  const renderPermissionBadges = (role) => {
    const perms = getRolePermissionList(role);
    return (
      <div className="staff-permissions">
        <span className="permissions-label">Permissions ({perms.length}):</span>
        <div className="permission-badges">
          {perms.map(p => (
            <span key={p.key} className="permission-badge" title={p.label}>
              {p.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderStaffCard = (staffMember, role, statsConfig) => {
    const roleLabel = roleLabels[role] || role;

    return (
      <div key={staffMember._id} className="staff-card" data-role={role}>
        <div className="staff-card-header">
          <div className="staff-avatar">{roleLabel === 'Chef' ? 'Chef' : roleLabel}</div>
          <div className="staff-info">
            <h3>{staffMember.name}</h3>
            <span className="staff-status" style={{ backgroundColor: getStatusColor(staffMember.status) }}>
              {getStatusText(staffMember.status)}
            </span>
          </div>
        </div>

        <div className="staff-card-body">
          <div className="staff-detail">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{staffMember.email}</span>
          </div>
          <div className="staff-detail">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{staffMember.phone}</span>
          </div>
          {staffMember.rating && (
            <div className="staff-detail">
              <span className="detail-label">Performance:</span>
              <span className="detail-value rating">
                {renderStars(staffMember.rating)} ({staffMember.rating})
              </span>
            </div>
          )}
          {statsConfig && (
            <div className="staff-stats">
              {statsConfig.map(stat => (
                <div key={stat.label} className="stat">
                  <span className="stat-value">{staffMember[stat.field] || 0}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="role-badge-container">
            <span className="role-badge">{roleLabel}</span>
          </div>
        </div>

        {renderPermissionBadges(role)}

        <div className="staff-card-footer">
          {statsConfig && (
            <PermissionGate permission={PERMISSIONS.REPORTS_VIEW} fallback={null}>
              <button className="btn-view" onClick={() => handleViewPerformance(staffMember._id, role)}>
                View Report
              </button>
            </PermissionGate>
          )}
          <PermissionGate permission={PERMISSIONS.STAFF_UPDATE} fallback={null}>
            <button className="btn-edit" onClick={() => handleEditStaff(staffMember)}>
              Edit
            </button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.STAFF_DELETE} fallback={null}>
            <button className="btn-delete" onClick={() => handleDeleteStaff(staffMember._id, role)}>
              Delete
            </button>
          </PermissionGate>
        </div>
      </div>
    );
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

      {showEditModal && editingStaff && (
        <AddStaffModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onStaffAdded={handleStaffAdded}
          editMode={true}
          staffData={editingStaff}
        />
      )}

      {showPerformanceModal && staffPerformance && (
        <div className="modal-overlay" onClick={() => setShowPerformanceModal(false)}>
          <div className="modal-content performance-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Staff Performance Report</h2>
              <button className="modal-close-btn" onClick={() => setShowPerformanceModal(false)}>x</button>
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
        <PermissionGate permission={PERMISSIONS.STAFF_CREATE} fallback={null}>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            + Add New Staff
          </button>
        </PermissionGate>
      </div>

      <div className="staff-tabs">
        <button 
          className={`staff-tab-btn ${activeSection === 'cooks' ? 'active' : ''}`}
          onClick={() => setActiveSection('cooks')}
        >
          Chefs ({staff.cooks.length})
        </button>
        <button 
          className={`staff-tab-btn ${activeSection === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveSection('delivery')}
        >
          Delivery ({staff.delivery.length})
        </button>
        <button 
          className={`staff-tab-btn ${activeSection === 'cashiers' ? 'active' : ''}`}
          onClick={() => setActiveSection('cashiers')}
        >
          Cashiers ({staff.cashiers.length})
        </button>
      </div>

      <div className="staff-grid">
        {activeSection === 'cooks' && staff.cooks.map(member =>
          renderStaffCard(member, 'cook', [
            { field: 'assignedOrders', label: 'Active' },
            { field: 'completedOrders', label: 'Completed' },
          ])
        )}

        {activeSection === 'delivery' && staff.delivery.map(member =>
          renderStaffCard(member, 'delivery', [
            { field: 'assignedOrders', label: 'Active' },
            { field: 'completedOrders', label: 'Delivered' },
          ])
        )}

        {activeSection === 'cashiers' && staff.cashiers.map(member =>
          renderStaffCard(member, 'cashier')
        )}
      </div>

      {staff[activeSection].length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            {activeSection === 'cooks' ? 'Chef' : activeSection === 'delivery' ? 'Delivery' : 'Cashier'}
          </div>
          <h3>No {activeSection} found</h3>
          <p>Click "Add New Staff" to add a {activeSection.slice(0, -1)}.</p>
        </div>
      )}
    </div>
  );
};

export default StaffTab;
