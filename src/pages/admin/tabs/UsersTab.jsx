// src/pages/admin/tabs/UsersTab.jsx
import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/api';
import { toast } from 'react-toastify';
import './UsersTab.css';

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const roles = ['customer', 'chef', 'delivery', 'cashier', 'admin'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([
        { _id: '1', name: 'John Doe', email: 'john@example.com', phone: '0912345678', role: 'customer', status: 'active', createdAt: new Date().toISOString() },
        { _id: '2', name: 'Chef Berhanu', email: 'berhanu@sewrica.com', phone: '0923456789', role: 'chef', status: 'active', createdAt: new Date().toISOString() },
        { _id: '3', name: 'Abebe Delivery', email: 'abebe@sewrica.com', phone: '0934567890', role: 'delivery', status: 'active', createdAt: new Date().toISOString() },
        { _id: '4', name: 'Admin User', email: 'admin@sewrica.com', phone: '0945678901', role: 'admin', status: 'active', createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      toast.success('User status toggled successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle user status');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading users...</p>
    </div>
  );

  return (
    <div className="users-tab">
      <h1 className="page-title">User Management</h1>
      
      <div className="table-responsive">
        <table className="data-table users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || 'N/A'}</td>
                  <td>
                    <select 
                      value={user.role} 
                      onChange={(e) => updateUserRole(user._id, e.target.value)}
                      className="role-select"
                    >
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className={`btn-status ${user.status === 'active' ? 'btn-disable' : 'btn-enable'}`}
                        onClick={() => toggleUserStatus(user._id)}
                      >
                        {user.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn-edit-user">Edit</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTab;