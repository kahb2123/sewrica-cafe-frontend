// src/pages/admin/tabs/StaffPermissionsTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { adminService, PERMISSIONS } from '../../../services/api';
import { toast } from 'react-toastify';
import './StaffPermissionsTab.css';

const RoleLabels = {
  customer: 'Customer',
  admin: 'Administrator',
  cashier: 'Cashier',
  delivery: 'Delivery Person',
  cook: 'Cook',
  supply_chain: 'Supply Chain',
};

const PermissionLabels = {
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

const StaffPermissionsTab = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchStaffPermissions = async (staff) => {
    try {
      setLoading(true);
      const result = await adminService.getUserPermissions(staff._id);
      setSelectedStaff(result);
    } catch (error) {
      toast.error(error.message || 'Failed to load staff permissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      const staff = Array.isArray(data) ? data : (data.staff || data.users || []);
      setStaffList(staff);
      if (staff.length > 0) {
        await fetchStaffPermissions(staff[0]);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleTogglePermission = async (permission) => {
    if (!selectedStaff) return;

     const isInRole = selectedStaff.rolePermissions?.includes(permission);
    const isGranted = selectedStaff.extraPermissions?.includes(permission);
    const isDenied = selectedStaff.deniedPermissions?.includes(permission);

    let action;

    if (isInRole) {
      action = 'revoke';
    } else if (isDenied) {
      action = 'unrevoke';
    } else if (isGranted) {
      action = 'revoke';
    } else {
      action = 'grant';
    }

    setSaving(true);
    try {
      const result = await adminService.updateUserPermission(selectedStaff.user._id, action, permission);
      setSelectedStaff({
        ...selectedStaff,
        permissions: result.permissions,
        extraPermissions: result.extraPermissions,
        deniedPermissions: result.deniedPermissions,
      });
      toast.success(`Permission ${action === 'grant' ? 'granted' : action === 'revoke' ? 'revoked' : 'unrevoked'}`);
    } catch (error) {
      toast.error(error.message || 'Failed to update permission');
    } finally {
      setSaving(false);
    }
  };

  const getEffectivePermissionStatus = (permission) => {
    if (!selectedStaff) return 'none';
    const isInRole = selectedStaff.rolePermissions?.includes(permission);
    const isGranted = selectedStaff.extraPermissions?.includes(permission);
    const isDenied = selectedStaff.deniedPermissions?.includes(permission);

    if (isInRole && !isDenied) return 'role';
    if (isGranted) return 'granted';
    if (isDenied) return 'denied';
    return 'none';
  };

  const getPermissionStatusLabel = (status) => {
    switch (status) {
      case 'role': return 'From Role';
      case 'granted': return 'Granted';
      case 'denied': return 'Denied';
      default: return 'Not Granted';
    }
  };

  const getPermissionStatusClass = (status) => {
    switch (status) {
      case 'role': return 'status-role';
      case 'granted': return 'status-granted';
      case 'denied': return 'status-denied';
      default: return 'status-none';
    }
  };

  const allPermissionKeys = Object.values(PERMISSIONS);

  if (loading && !selectedStaff) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading staff permissions...</p>
      </div>
    );
  }

  return (
    <div className="staff-permissions-tab">
      <div className="permissions-header">
        <h1 className="page-title">Staff Permissions</h1>
        <p className="page-subtitle">Grant or revoke individual permissions for each staff member</p>
      </div>

      <div className="staff-permissions-layout">
        <div className="staff-sidebar">
          <h3>Staff Members</h3>
          <div className="staff-list">
            {staffList.map(staff => (
              <button
                key={staff._id}
                className={`staff-item ${selectedStaff?.user?._id === staff._id ? 'active' : ''}`}
                onClick={() => fetchStaffPermissions(staff)}
              >
                <span className="staff-name">{staff.name || staff.email}</span>
                <span className={`staff-role-badge role-${staff.role}`}>{RoleLabels[staff.role] || staff.role}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="staff-detail">
          {selectedStaff ? (
            <>
              <h3>{selectedStaff.user.name || selectedStaff.user.email}</h3>
              <div className="staff-info-row">
                <span className="info-label">Role:</span>
                <span className={`staff-role-badge role-${selectedStaff.user.role}`}>{RoleLabels[selectedStaff.user.role] || selectedStaff.user.role}</span>
              </div>
              <div className="staff-info-row">
                <span className="info-label">Email:</span>
                <span>{selectedStaff.user.email}</span>
              </div>

              <div className="staff-permissions-section">
                <h4>Action Permissions</h4>
                <table className="staff-permissions-table">
                  <thead>
                    <tr>
                      <th>Permission</th>
                      <th>Status</th>
                      <th>Grant</th>
                      <th>Revoke</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPermissionKeys.map(perm => {
                      const status = getEffectivePermissionStatus(perm);
                      const isGranted = status === 'granted' || status === 'role';
                      return (
                        <tr key={perm}>
                          <td>{PermissionLabels[perm] || perm}</td>
                          <td>
                            <span className={`status-pill ${getPermissionStatusClass(status)}`}>
                              {getPermissionStatusLabel(status)}
                            </span>
                          </td>
                          <td>
                            {!isGranted && (
                              <button
                                className="action-btn grant-btn"
                                onClick={() => handleTogglePermission(perm)}
                                disabled={saving || status === 'role' || status === 'granted'}
                              >
                                Grant
                              </button>
                            )}
                            {isGranted && <span className="status-dash">—</span>}
                          </td>
                          <td>
                            {status !== 'none' && status !== 'role' && (
                              <button
                                className="action-btn revoke-btn"
                                onClick={() => handleTogglePermission(perm)}
                                disabled={saving || status === 'role'}
                              >
                                Revoke
                              </button>
                            )}
                            {(status === 'none' || status === 'role') && <span className="status-dash">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Select a staff member to view their permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPermissionsTab;
