// src/pages/admin/tabs/PermissionsTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { adminService, PERMISSIONS, PAGE_ACCESS, hasPermission } from '../../services/api';
import { toast } from 'react-toastify';
import './PermissionsTab.css';

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

const RoleLabels = {
  customer: 'Customer',
  supply_chain: 'Supply Chain',
  cashier: 'Cashier',
  delivery: 'Delivery Person',
  cook: 'Cook',
  chef: 'Chef',
  admin: 'Administrator',
};

const PageLabels = {
  staffDashboard: 'Staff Dashboard',
  staffOrdersCooking: 'Staff - Cooking Orders',
  staffOrdersDelivery: 'Staff - Delivery Orders',
  staffStats: 'Staff - Statistics',
  staffProfile: 'Staff - Profile',
  adminDashboard: 'Admin Dashboard',
  adminOrders: 'Admin - Orders',
  adminStaff: 'Admin - Staff',
  adminMenu: 'Admin - Menu',
  adminReports: 'Admin - Reports',
  adminIngredients: 'Admin - Ingredients',
  adminExpenses: 'Admin - Expenses',
  adminUsers: 'Admin - Users',
};

const PermissionsTab = () => {
  const [roleMap, setRoleMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    fetchRoleMap();
  }, [fetchRoleMap]);

  const fetchRoleMap = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getRoleMap();
      setRoleMap(data);
      if (!selectedRole && data?.roles?.length > 0) {
        setSelectedRole(data.roles[0]);
      }
    } catch (error) {
      console.error('Error fetching role map:', error);
      toast.error(error.message || 'Failed to load role map');
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  const handlePageAccessToggle = async (page, type) => {
    if (!selectedRole) return;

    const current = selectedRole.pageAccess[page];
    const isCurrently = type === 'read' ? current?.canRead : current?.canWrite;

    const actionMap = {
      read: isCurrently ? 'revoke_read' : 'grant_read',
      write: isCurrently ? 'revoke_write' : 'grant_write',
    };

    setSaving(true);
    try {
      const result = await adminService.updatePageAccess(selectedRole.role, page, actionMap[type]);
      if (result.success) {
        const updatedPageAccess = {
          ...selectedRole.pageAccess,
          [page]: {
            canRead: result.pageAccess.read.includes(selectedRole.role),
            canWrite: result.pageAccess.write.includes(selectedRole.role),
          },
        };
        setSelectedRole({ ...selectedRole, pageAccess: updatedPageAccess });

        if (roleMap) {
          setRoleMap({
            ...roleMap,
            roles: roleMap.roles.map(r =>
              r.role === selectedRole.role ? { ...r, pageAccess: updatedPageAccess } : r
            ),
          });
        }

        toast.success(`Page access updated`);
      } else {
        toast.error(result.message || 'Failed to update page access');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update page access');
    } finally {
      setSaving(false);
    }
  };

  const getRolePermissions = (role) => {
    if (!role || !role.permissions) return [];
    return role.permissions.map(perm => ({
      key: perm,
      label: PermissionLabels[perm] || perm,
    }));
  };

  const getPageAccessRows = (role) => {
    if (!role || !role.pageAccess) return [];
    return Object.entries(role.pageAccess);
  };

  const renderPermissionMatrix = () => {
    if (!roleMap) return null;

    const allPermissionKeys = Object.values(PERMISSIONS);
    const roles = roleMap.roles;

    return (
      <div className="permission-matrix">
        <h3>Role Permission Matrix</h3>
        <div className="matrix-table">
          <table>
            <thead>
              <tr>
                <th className="sticky-col">Role</th>
                {allPermissionKeys.map(perm => (
                  <th key={perm}>{PermissionLabels[perm] || perm}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map(roleInfo => (
                <tr key={roleInfo.role}>
                  <td className="sticky-col">{RoleLabels[roleInfo.role] || roleInfo.role}</td>
                  {allPermissionKeys.map(perm => (
                    <td key={perm} className="matrix-cell">
                      {hasPermission(roleInfo.role, perm) ? (
                        <span className="check-icon">Yes</span>
                      ) : (
                        <span className="x-icon">No</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRoleDetail = () => {
    if (!selectedRole) return null;

    const rolePermissions = getRolePermissions(selectedRole);
    const pageAccessRows = getPageAccessRows(selectedRole);

    return (
      <div className="role-detail">
        <h3>{RoleLabels[selectedRole.role] || selectedRole.role} Role</h3>
        <div className="role-level">
          <span className="level-badge">Level {selectedRole.level}</span>
        </div>

        <div className="role-section">
          <h4>Action Permissions ({rolePermissions.length})</h4>
          <div className="permissions-grid">
            {rolePermissions.map(p => (
              <span key={p.key} className="permission-item granted">
                {p.label}
              </span>
            ))}
          </div>
        </div>

        <div className="role-section">
          <h4>Page Access</h4>
          <table className="page-access-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Read</th>
                <th>Write</th>
              </tr>
            </thead>
            <tbody>
              {pageAccessRows.map(([page, access]) => (
                <tr key={page}>
                  <td>{PageLabels[page] || page}</td>
                  <td>
                    <button
                      className={`page-access-toggle ${access.canRead ? 'granted' : 'revoked'}`}
                      onClick={() => handlePageAccessToggle(page, 'read')}
                      disabled={saving}
                    >
                      {access.canRead ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`page-access-toggle ${access.canWrite ? 'granted' : 'revoked'}`}
                      onClick={() => handlePageAccessToggle(page, 'write')}
                      disabled={saving}
                    >
                      {access.canWrite ? 'Yes' : 'No'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading role map...</p>
      </div>
    );
  }

  return (
    <div className="permissions-tab">
      <div className="permissions-header">
        <h1 className="page-title">Role Permissions</h1>
        <p className="page-subtitle">View and manage role-based access control (RBAC) for all staff roles</p>
      </div>

      <div className="permissions-layout">
        <div className="permissions-sidebar">
          <h3>Roles</h3>
          <div className="role-list">
            {roleMap?.roles?.map(roleInfo => (
              <button
                key={roleInfo.role}
                className={`role-item ${selectedRole?.role === roleInfo.role ? 'active' : ''}`}
                onClick={() => setSelectedRole(roleInfo)}
              >
                <span className="role-name">{RoleLabels[roleInfo.role] || roleInfo.role}</span>
                <span className="role-permissions-count">{roleInfo.permissions?.length || 0} permissions</span>
              </button>
            ))}
          </div>
        </div>

        <div className="permissions-main">
          {selectedRole ? renderRoleDetail() : (
            <div className="empty-state">
              <p>Select a role to view its permissions</p>
            </div>
          )}
        </div>
      </div>

      <div className="permission-matrix-section">
        {renderPermissionMatrix()}
      </div>
    </div>
  );
};

export default PermissionsTab;
