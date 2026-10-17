// src/pages/admin/tabs/StaffTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { adminService, ROLE_PERMISSIONS, PERMISSIONS } from '../../../services/api';
import { toast } from 'react-toastify';
import { useLanguage } from '../../../context/useLanguage';
import PermissionGate from '../../../components/PermissionGate';
import AddStaffModal from '../../../components/AddStaffModal';
import './StaffTab.css';

const PermissionDescriptions = {
  [PERMISSIONS.ORDERS_CREATE]: 'Create staff orders',
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
  waiter: 'Waiter',
  cashier: 'Cashier',
  admin: 'Admin',
  customer: 'Customer',
  supply_chain: 'Supply Chain',
};

const StaffTab = () => {
  const { t } = useLanguage();
  const [staff, setStaff] = useState({
    cooks: [],
    delivery: [],
    waiters: [],
    cashiers: [],
    supplyChain: [],
    admins: []
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('cooks');
   const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffPerformance, setStaffPerformance] = useState(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await adminService.getAllStaff();
      const members = Array.isArray(response?.staff) ? response.staff : [];
      setStaff({
        cooks: members.filter((member) => ['cook', 'chef'].includes(member.role?.toLowerCase())),
        delivery: members.filter((member) => member.role?.toLowerCase() === 'delivery'),
        waiters: members.filter((member) => member.role?.toLowerCase() === 'waiter'),
        cashiers: members.filter((member) => member.role?.toLowerCase() === 'cashier'),
        supplyChain: members.filter((member) => member.role?.toLowerCase() === 'supply_chain'),
        admins: members.filter((member) => member.role?.toLowerCase() === 'admin')
      });
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error(t('Failed to load staff data'));
      setStaff({
        cooks: [],
        delivery: [],
        waiters: [],
        cashiers: [],
        supplyChain: [],
        admins: []
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleStaffAdded = (role) => {
    if (role?.toLowerCase() === 'waiter') {
      setActiveSection('waiters');
    }
    fetchStaff();
  };

  const handleViewPerformance = async (staffId, role) => {
    try {
      setLoading(true);
      const response = await adminService.getUnifiedReport({ staffId });
      const detail = response?.data?.staffDetail;

      if (!detail) {
        toast.info(t('No activity recorded for this staff member yet'));
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
      toast.error(error.message || t('Failed to load performance'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm(t('Are you sure you want to remove this staff member?'))) return;
    
    try {
      await adminService.deleteStaff(staffId);
      toast.success(t('Staff member removed'));
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error(error.message || t('Failed to remove staff'));
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
      toast.error(error.message || t('Failed to load staff permissions'));
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
      label: t(PermissionDescriptions[perm] || perm),
    }));
  };

  const renderPermissionBadges = (role) => {
    const perms = getRolePermissionList(role);
    return (
      <div className="staff-permissions">
        <span className="permissions-label">{t('Permissions')} ({perms.length}):</span>
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
    const roleLabel = t(roleLabels[role] || role);

    return (
      <div key={staffMember._id} className="staff-card" data-role={role}>
        <div className="staff-card-header">
          <div className="staff-avatar">{roleLabel === 'Chef' ? 'Chef' : roleLabel}</div>
          <div className="staff-info">
            <h3>{staffMember.name}</h3>
            <span className="staff-status" style={{ backgroundColor: getStatusColor(staffMember.status || (staffMember.isActive ? 'active' : 'offline')) }}>
              {t(getStatusText(staffMember.status || (staffMember.isActive ? 'active' : 'offline')))}
            </span>
          </div>
        </div>

        <div className="staff-card-body">
          <div className="staff-detail">
            <span className="detail-label">{t('Email')}:</span>
            <span className="detail-value">{staffMember.email}</span>
          </div>
          <div className="staff-detail">
            <span className="detail-label">{t('Phone')}:</span>
            <span className="detail-value">{staffMember.phone}</span>
          </div>
          {staffMember.rating && (
            <div className="staff-detail">
              <span className="detail-label">{t('Performance')}:</span>
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
                {t('View Report')}
              </button>
            </PermissionGate>
          )}
          <PermissionGate permission={PERMISSIONS.STAFF_UPDATE} fallback={null}>
            <button className="btn-edit" onClick={() => handleEditStaff(staffMember)}>
              {t('Edit')}
            </button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.STAFF_DELETE} fallback={null}>
            <button className="btn-delete" onClick={() => handleDeleteStaff(staffMember._id)}>
              {t('Delete')}
            </button>
          </PermissionGate>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container staff-tab-loading">
        <div className="loading-spinner"></div>
        <p>{t('Loading staff data...')}</p>
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
              <h2>{t('Staff Performance Report')}</h2>
              <button className="modal-close-btn" onClick={() => setShowPerformanceModal(false)}>x</button>
            </div>
            
            {selectedStaff?.role === 'cook' && (
              <div className="performance-data">
                <div className="summary-cards">
                  <div className="summary-card">
                    <span className="label">{t('Total Orders')}</span>
                    <span className="value">{staffPerformance.summary?.totalOrders || 0}</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">{t('Items Cooked')}</span>
                    <span className="value">{staffPerformance.summary?.totalItemsCooked || 0}</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">{t('Total Time')}</span>
                    <span className="value">{staffPerformance.summary?.totalCookingTime || 0} min</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">{t('Avg. Time')}</span>
                    <span className="value">{staffPerformance.summary?.averageCookingTime || 0} min</span>
                  </div>
                </div>

                <h3 className="section-title">{t('Items Cooked Breakdown')}</h3>
                <div className="table-responsive">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>{t('Menu Item')}</th>
                        <th>{t('Quantity')}</th>
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
                    <span className="label">{t('Total Deliveries')}</span>
                    <span className="value">{staffPerformance.summary?.totalDeliveries || 0}</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">{t('Total Amount')}</span>
                    <span className="value">ETB {staffPerformance.summary?.totalAmount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">{t('Total Time')}</span>
                    <span className="value">{staffPerformance.summary?.totalDeliveryTime || 0} min</span>
                  </div>
                  <div className="summary-card">
                    <span className="label">{t('Avg. Time')}</span>
                    <span className="value">{staffPerformance.summary?.averageDeliveryTime || 0} min</span>
                  </div>
                </div>

                <h3 className="section-title">{t('Daily Performance')}</h3>
                <div className="table-responsive">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>{t('Date')}</th>
                        <th>{t('Deliveries')}</th>
                        <th>{t('Total Amount')}</th>
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
        <h1 className="page-title">{t('Staff Management')}</h1>
        <PermissionGate permission={PERMISSIONS.STAFF_CREATE} fallback={null}>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            + {t('Add New Staff')}
          </button>
        </PermissionGate>
      </div>

      <div className="staff-tabs">
        <button 
          className={`staff-tab-btn ${activeSection === 'cooks' ? 'active' : ''}`}
          onClick={() => setActiveSection('cooks')}
        >
          {t('Chefs')} ({staff.cooks.length})
        </button>
        <button 
          className={`staff-tab-btn ${activeSection === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveSection('delivery')}
        >
          {t('Delivery')} ({staff.delivery.length})
        </button>
        <button 
          className={`staff-tab-btn ${activeSection === 'cashiers' ? 'active' : ''}`}
          onClick={() => setActiveSection('cashiers')}
        >
          {t('Cashiers')} ({staff.cashiers.length})
        </button>
        <button
          className={`staff-tab-btn ${activeSection === 'waiters' ? 'active' : ''}`}
          onClick={() => setActiveSection('waiters')}
        >
          {t('Waiters')} ({staff.waiters.length})
        </button>
        <button
          className={`staff-tab-btn ${activeSection === 'supplyChain' ? 'active' : ''}`}
          onClick={() => setActiveSection('supplyChain')}
        >
          {t('Supply Chain')} ({staff.supplyChain.length})
        </button>
        <button
          className={`staff-tab-btn ${activeSection === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveSection('admins')}
        >
          {t('Admins')} ({staff.admins.length})
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

        {activeSection === 'waiters' && staff.waiters.map(member =>
          renderStaffCard(member, 'waiter')
        )}

        {activeSection === 'supplyChain' && staff.supplyChain.map(member =>
          renderStaffCard(member, 'supply_chain')
        )}

        {activeSection === 'admins' && staff.admins.map(member =>
          renderStaffCard(member, 'admin')
        )}
      </div>

      {staff[activeSection].length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            {activeSection === 'cooks' ? 'Chef'
              : activeSection === 'delivery' ? 'Delivery'
                : activeSection === 'cashiers' ? 'Cashier'
                  : activeSection === 'waiters' ? 'Waiter'
                    : activeSection === 'supplyChain' ? 'Supply Chain'
                      : 'Admin'}
          </div>
          <h3>{t('No staff members found')}</h3>
          <p>{t('Click "Add New Staff" to add a staff member.')}</p>
        </div>
      )}
    </div>
  );
};

export default StaffTab;
