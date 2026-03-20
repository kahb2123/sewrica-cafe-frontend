// src/pages/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { staffService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import StaffTaskCard from '../components/StaffTaskCard';
import { toast } from 'react-toastify';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { connected, onOrderAssigned } = useSocket();
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayTasks: 0,
    completedToday: 0,
    pendingTasks: 0
  });

  // Check authentication and role
  useEffect(() => {
    if (!user) {
      navigate('/staff-login');
      return;
    }

    const userRole = user.role?.toLowerCase();
    const validRoles = ['cook', 'chef', 'delivery', 'cashier', 'admin'];
    
    if (!validRoles.includes(userRole)) {
      toast.error('Unauthorized access. Staff only.');
      navigate('/');
      return;
    }

    fetchTasks();
  }, [user]);

  // Listen for socket events
  useEffect(() => {
    if (connected && onOrderAssigned) {
      const unsubscribe = onOrderAssigned((data) => {
        toast.info(`🔔 New task assigned: Order #${data.orderNumber}`);
        fetchTasks();
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [connected, onOrderAssigned]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const userRole = user?.role?.toLowerCase();
      console.log('Fetching tasks for role:', userRole);
      
      let response;
      let activeTasks = [];
      let completed = [];
      
      if (userRole === 'cook' || userRole === 'chef') {
        response = await staffService.getMyCookingOrders();
        console.log('Cooking orders response:', response);
        
        const orders = response?.orders || response || [];
        activeTasks = orders.filter(o => 
          o.status === 'confirmed' || o.status === 'preparing'
        );
        completed = orders.filter(o => 
          o.status === 'ready' || o.status === 'delivered'
        );
      } else if (userRole === 'delivery') {
        response = await staffService.getMyDeliveryOrders();
        console.log('Delivery orders response:', response);
        
        const deliveries = response?.deliveries || response || [];
        activeTasks = deliveries.filter(d => 
          d.status === 'ready' || d.status === 'out-for-delivery'
        );
        completed = deliveries.filter(d => 
          d.status === 'delivered'
        );
      } else if (userRole === 'cashier') {
        // Cashier specific endpoint
        response = await staffService.getCashierTasks();
        const tasks = response?.tasks || response || [];
        activeTasks = tasks.filter(t => t.status === 'pending');
        completed = tasks.filter(t => t.status === 'completed');
      }

      setTasks(activeTasks);
      setCompletedTasks(completed);

      // Calculate stats
      const today = new Date().toDateString();
      const todayTasksCount = activeTasks.filter(t => 
        new Date(t.createdAt).toDateString() === today
      ).length;

      const completedTodayCount = completed.filter(t => 
        new Date(t.updatedAt || t.completedAt).toDateString() === today
      ).length;

      setStats({
        todayTasks: todayTasksCount,
        completedToday: completedTodayCount,
        pendingTasks: activeTasks.length
      });

    } catch (error) {
      console.error('Error fetching tasks:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        navigate('/staff-login');
      } else if (error.response?.status === 404) {
        toast.warning('No tasks found');
        setTasks([]);
        setCompletedTasks([]);
      } else {
        toast.error(error.response?.data?.message || 'Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (updatedOrder) => {
    fetchTasks();
    toast.success('Task updated successfully');
  };

  const getRoleIcon = () => {
    const role = user?.role?.toLowerCase();
    switch(role) {
      case 'cook':
      case 'chef':
        return '👨‍🍳';
      case 'delivery':
        return '🚚';
      case 'cashier':
        return '💰';
      default:
        return '👤';
    }
  };

  const getRoleTitle = () => {
    const role = user?.role?.toLowerCase();
    switch(role) {
      case 'cook':
      case 'chef':
        return 'Kitchen Staff';
      case 'delivery':
        return 'Delivery Personnel';
      case 'cashier':
        return 'Cashier';
      default:
        return 'Staff';
    }
  };

  const getRoleSpecificMessage = () => {
    const role = user?.role?.toLowerCase();
    switch(role) {
      case 'cook':
      case 'chef':
        return 'Orders ready for preparation will appear here';
      case 'delivery':
        return 'Orders ready for delivery will appear here';
      case 'cashier':
        return 'Pending payments will appear here';
      default:
        return 'Your tasks will appear here';
    }
  };

  return (
    <div className="staff-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="staff-avatar-large">
            {getRoleIcon()}
          </div>
          <div className="staff-info">
            <h1>Welcome, {user?.name || 'Staff'}!</h1>
            <p className="role-badge">{getRoleTitle()}</p>
            <p className="staff-email">{user?.email}</p>
          </div>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-details">
            <h3>Today's Tasks</h3>
            <p className="stat-number">{stats.todayTasks}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-details">
            <h3>Completed Today</h3>
            <p className="stat-number">{stats.completedToday}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-details">
            <h3>Pending</h3>
            <p className="stat-number">{stats.pendingTasks}</p>
          </div>
        </div>
      </div>

      <div className="tasks-tabs">
        <button 
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Active Tasks ({tasks.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      <div className="tasks-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your tasks...</p>
          </div>
        ) : (
          <>
            {activeTab === 'tasks' && (
              <>
                {tasks.length > 0 ? (
                  tasks.map(task => (
                    <StaffTaskCard
                      key={task._id}
                      task={task}
                      type={user?.role?.toLowerCase() === 'chef' ? 'cook' : user?.role?.toLowerCase()}
                      onTaskUpdate={handleTaskUpdate}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🎉</div>
                    <h3>No Active Tasks</h3>
                    <p>{getRoleSpecificMessage()}</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'completed' && (
              <>
                {completedTasks.length > 0 ? (
                  completedTasks.map(task => (
                    <StaffTaskCard
                      key={task._id}
                      task={task}
                      type={user?.role?.toLowerCase() === 'chef' ? 'cook' : user?.role?.toLowerCase()}
                      onTaskUpdate={handleTaskUpdate}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No Completed Tasks</h3>
                    <p>Your completed tasks will appear here.</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        {connected ? '🟢 Connected' : '🔴 Reconnecting...'}
      </div>
    </div>
  );
};

export default StaffDashboard;