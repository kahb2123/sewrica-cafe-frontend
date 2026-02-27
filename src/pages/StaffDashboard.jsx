import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { staffService, orderService } from '../services/api';
import StaffTaskCard from '../components/StaffTaskCard';
import { toast } from 'react-toastify';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayTasks: 0,
    completedToday: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/staff/login');
      return;
    }

    // Redirect if not staff
    if (!['cook', 'delivery', 'cashier', 'admin'].includes(user.role)) {
      toast.error('Unauthorized access');
      navigate('/');
      return;
    }

    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let response;
      
      if (user.role === 'cook') {
        response = await staffService.getMyCookingOrders();
        setTasks(response.filter(o => o.status === 'confirmed' || o.status === 'preparing'));
        setCompletedTasks(response.filter(o => o.status === 'ready' || o.status === 'delivered'));
      } else if (user.role === 'delivery') {
        response = await staffService.getMyDeliveryOrders();
        setTasks(response.filter(o => o.status === 'ready' || o.status === 'out-for-delivery'));
        setCompletedTasks(response.filter(o => o.status === 'delivered'));
      } else if (user.role === 'cashier') {
        // For cashiers, show pending payments
        response = await orderService.getUserOrders(); // Modify this as needed
        setTasks(response.filter(o => o.paymentStatus === 'pending'));
        setCompletedTasks(response.filter(o => o.paymentStatus === 'completed'));
      }

      // Calculate stats
      const today = new Date().toDateString();
      const todayTasks = response?.filter(t => 
        new Date(t.createdAt).toDateString() === today
      ).length || 0;

      setStats({
        todayTasks,
        completedToday: completedTasks.filter(t => 
          new Date(t.updatedAt).toDateString() === today
        ).length,
        pendingTasks: tasks.length
      });

    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      
      // Mock data for testing
      const mockTasks = [
        {
          _id: '1',
          orderNumber: 'ORD001',
          customerName: 'John Doe',
          items: [{ name: 'Cheese Burger', quantity: 2 }],
          status: user.role === 'cook' ? 'confirmed' : 'ready',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          orderNumber: 'ORD002',
          customerName: 'Jane Smith',
          items: [{ name: 'Doro Wat', quantity: 1 }],
          status: user.role === 'cook' ? 'preparing' : 'out-for-delivery',
          createdAt: new Date().toISOString()
        }
      ];
      setTasks(mockTasks);
      setCompletedTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (updatedOrder) => {
    // Refresh tasks after update
    fetchTasks();
    toast.success('Task updated successfully');
  };

  const getRoleIcon = () => {
    switch(user?.role) {
      case 'cook': return '👨‍🍳';
      case 'delivery': return '🚚';
      case 'cashier': return '💰';
      default: return '👤';
    }
  };

  const getRoleTitle = () => {
    switch(user?.role) {
      case 'cook': return 'Kitchen Staff';
      case 'delivery': return 'Delivery Personnel';
      case 'cashier': return 'Cashier';
      default: return 'Staff';
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
            <h1>Welcome, {user?.name}!</h1>
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
                      type={user.role}
                      onTaskUpdate={handleTaskUpdate}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🎉</div>
                    <h3>No Active Tasks</h3>
                    <p>You're all caught up! Take a break or check back later.</p>
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
                      type={user.role}
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
    </div>
  );
};

export default StaffDashboard;