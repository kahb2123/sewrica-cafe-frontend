import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../services/api';

const PermissionGate = ({ permission, role, roleOrHigher, roles, children, fallback = null }) => {
  const { hasPermission, hasRole, hasRoleOrHigher } = useAuth();

  let allowed = true;

  if (permission) {
    allowed = hasPermission(permission);
  }

  if (allowed && role) {
    allowed = hasRole(role);
  }

  if (allowed && roles) {
    allowed = hasRole(...roles);
  }

  if (allowed && roleOrHigher) {
    allowed = hasRoleOrHigher(roleOrHigher);
  }

  if (!allowed) {
    return fallback;
  }

  return <>{children}</>;
};

export const PermissionRequired = ({ permission, children, fallback = null }) => (
  <PermissionGate permission={permission} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const RoleRequired = ({ role, children, fallback = null }) => (
  <PermissionGate role={role} fallback={fallback}>
    {children}
  </PermissionGate>
);

export { PERMISSIONS };
export default PermissionGate;
