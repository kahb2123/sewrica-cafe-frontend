// src/components/StaffPermissionEditor.jsx
import React, { useState } from 'react';
import { adminService, PERMISSIONS, PAGE_ACCESS, ROLE_PERMISSIONS } from '../services/api';
import { toast } from 'react-toastify';
import './StaffPermissionEditor.css';

const PAGE_ACCESS_LABELS = {
  staffDashboard: 'Staff Dashboard',
  staffOrdersCooking: 'Cooking Orders',
  staffOrdersDelivery: 'Delivery Orders',
  staffStats: 'Statistics',
  staffProfile: 'Profile',
  adminDashboard: 'Admin Dashboard',
  adminOrders: 'Admin Orders',
  adminStaff: 'Admin Staff',
  adminMenu: 'Menu Management',
  adminReports: 'Reports',
  adminIngredients: 'Ingredients Management',
  adminExpenses: 'Expense Management',
  adminUsers: 'User Management',
};

const PERMISSION_LABELS = {
  [PERMISSIONS.ORDERS_VIEW]: 'View All Orders',
  [PERMISSIONS.ORDERS_ALL]: 'Manage All Orders',
  [PERMISSIONS.ORDERS_ASSIGN_CHEF]: 'Assign Chef',
  [PERMISSIONS.ORDERS_ASSIGN_DELIVERY]: 'Assign Delivery',
  [PERMISSIONS.ORDERS_UPDATE_STATUS]: 'Update Order Status',
  [PERMISSIONS.ORDERS_ACCEPT]: 'Accept Orders',
  [PERMISSIONS.ORDERS_REJECT]: 'Reject Orders',
  [PERMISSIONS.ORDERS_START_COOKING]: 'Start Cooking',
  [PERMISSIONS.ORDERS_COMPLETE_COOKING]: 'Complete Cooking',
  [PERMISSIONS.ORDERS_START_DELIVERY]: 'Start Delivery',
  [PERMISSIONS.ORDERS_COMPLETE_DELIVERY]: 'Complete Delivery',
  [PERMISSIONS.ORDERS_VIEW_ASSIGNED]: 'View Assigned Orders',
  [PERMISSIONS.STAFF_VIEW]: 'View Staff',
  [PERMISSIONS.STAFF_CREATE]: 'Create Staff',
  [PERMISSIONS.STAFF_UPDATE]: 'Update Staff',
  [PERMISSIONS.STAFF_DELETE]: 'Delete Staff',
  [PERMISSIONS.MENU_MANAGE]: 'Manage Menu',
  [PERMISSIONS.INGREDIENTS_MANAGE]: 'Manage Ingredients',
  [PERMISSIONS.EXPENSES_MANAGE]: 'Manage Expenses',
  [PERMISSIONS.REPORTS_VIEW]: 'View Reports',
  [PERMISSIONS.REPORTS_EXPORT]: 'Export Reports',
  [PERMISSIONS.PAYMENTS_PROCESS]: 'Process Payments',
  [PERMISSIONS.PAYMENTS_VIEW]: 'View Payments',
};

const StaffPermissionEditor = ({ staff, onSave, onClose }) => {
  const [extraPermissions, setExtraPermissions] = useState(staff.extraPermissions || []);
  const [deniedPermissions, setDeniedPermissions] = useState(staff.deniedPermissions || []);
  const [pageAccessOverrides, setPageAccessOverrides] = useState(staff.pageAccessOverrides || {});
  const [saving, setSaving] = useState(false);

  const rolePerms = ROLE_PERMISSIONS[staff.staff?.role?.toLowerCase()] || [];
  const allPermissionKeys = Object.values(PERMISSIONS);

  const getPermissionStatus = (permission) => {
    if (deniedPermissions.includes(permission)) return 'denied';
    if (extraPermissions.includes(permission)) return 'granted';
    if (rolePerms.includes(permission)) return 'role';
    return 'none';
  };

  const togglePermission = (permission) => {
    const status = getPermissionStatus(permission);
    if (status === 'role' || status === 'none') {
      setExtraPermissions([...extraPermissions.filter(p => p !== permission), permission]);
      setDeniedPermissions(deniedPermissions.filter(p => p !== permission));
    } else if (status === 'granted') {
      setExtraPermissions(extraPermissions.filter(p => p !== permission));
      setDeniedPermissions([...deniedPermissions.filter(p => p !== permission), permission]);
    } else if (status === 'denied') {
      setDeniedPermissions(deniedPermissions.filter(p => p !== permission));
      setExtraPermissions(extraPermissions.filter(p => p !== permission));
    }
  };

  const togglePageAccess = (page) => {
    const current = pageAccessOverrides[page];
    let newValue;

    if (!current) {
      newValue = { canRead: true, canWrite: true };
    } else if (current.canWrite) {
      newValue = { canRead: true, canWrite: false };
    } else if (current.canRead) {
      newValue = { canRead: false, canWrite: false };
    } else {
      newValue = { canRead: true, canWrite: true };
    }

    setPageAccessOverrides({ ...pageAccessOverrides, [page]: newValue });
  };

  const getPageAccessLabel = (page) => {
    const override = pageAccessOverrides[page];
    if (!override) return 'Inherit';
    if (override.canWrite) return 'Read & Write';
    if (override.canRead) return 'Read Only';
    return 'No Access';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminService.updateStaffPermissions(staff.staff._id, {
        extraPermissions,
        deniedPermissions,
        pageAccessOverrides,
      });
      toast.success(`Permissions updated for ${staff.staff.name}`);
      onSave();
    } catch (error) {
      toast.error(error.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="staff-permission-editor">
      <div className="editor-section">
        <h3>Role: {staff.staff.role}</h3>
        <p className="role-help">
          Permissions with <span className="status-role">Role</span> status come from the user's role definition.
          Toggle to grant, deny, or reset individual permissions.
        </p>
      </div>

      <div className="editor-section">
        <h3>Action Permissions</h3>
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Permission</th>
              <th>In Role</th>
              <th>Override</th>
              <th>Effective</th>
            </tr>
          </thead>
          <tbody>
            {allPermissionKeys.map(perm => {
              const status = getPermissionStatus(perm);
              const inRole = rolePerms.includes(perm);
              return (
                <tr key={perm}>
                  <td>{PERMISSION_LABELS[perm] || perm}</td>
                  <td>{inRole ? 'Yes' : 'No'}</td>
                  <td>
                    <button
                      className={`toggle-btn ${status === 'granted' || status === 'denied' ? 'active' : ''}`}
                      onClick={() => togglePermission(perm)}
                      disabled={saving}
                    >
                      {status === 'granted' ? 'Granted' : status === 'denied' ? 'Denied' : status === 'role' ? 'From Role' : 'Not Granted'}
                    </button>
                  </td>
                  <td>
                    <span className={`status-pill ${status === 'role' ? 'status-role' : status === 'granted' ? 'status-granted' : status === 'denied' ? 'status-denied' : 'status-none'}`}>
                      {status === 'role' ? 'From Role' : status === 'granted' ? 'Granted' : status === 'denied' ? 'Denied' : 'None'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="editor-section">
        <h3>Page Access</h3>
        <p className="page-help">Click to cycle: Read & Write → Read Only → No Access → Inherit</p>
        <div className="page-access-grid">
          {Object.keys(PAGE_ACCESS).map(page => {
            const label = getPageAccessLabel(page);
            const hasOverride = !!pageAccessOverrides[page];
            return (
              <div key={page} className="page-access-item">
                <span className="page-name">{PAGE_ACCESS_LABELS[page] || page}</span>
                <button
                  className={`page-access-btn ${hasOverride ? 'overridden' : ''}`}
                  onClick={() => togglePageAccess(page)}
                  disabled={saving}
                >
                  {label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="editor-actions">
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Permissions'}
        </button>
        <button className="btn-cancel" onClick={onClose} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StaffPermissionEditor;
