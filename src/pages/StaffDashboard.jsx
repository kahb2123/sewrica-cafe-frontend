// src/pages/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { staffService, PERMISSIONS } from '../services/api';
import { useSocket } from '../context/SocketContext';
import StaffTaskCard from '../components/StaffTaskCard';
import KitchenDisplayTab from './admin/tabs/KitchenDisplayTab';
import StockTab from './admin/tabs/StockTab';
import ExpenseTab from './admin/tabs/ExpenseTab';
import ReportsTab from './admin/tabs/ReportsTab';
import { toast } from 'react-toastify';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const { user, logout, hasRole, canReadPage, canWritePage } = useAuth();
  const navigate = useNavigate();
  const { connected, onOrderAssigned } = useSocket();
  const [activeTab, setActiveTab] = useState('tasks');
  const [activeSubTab, setActiveSubTab] = useState('tasks');
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
      navigate('/staff-login');
      return;
    }

    if (!canReadPage('staffDashboard')) {
      toast.error('Unauthorized access. Staff only.');
      navigate('/');
      return;
    }

    fetchTasks();
  }, [user]);

  useEffect(() => {
    if (connected && onOrderAssigned) {
      const unsubscribe = onOrderAssigned((data) => {
        toast.info(`New task assigned: Order #${data.orderNumber}`);
        fetchTasks();
      });
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [connected, onOrderAssigned]);

  const extractArray = (response, defaultArray = []) => {
    if (!response) return defaultArray;
    if (Array.isArray(response)) return response;
    if (response.orders && Array.isArray(response.orders)) return response.orders;
    if (response.deliveries && Array.isArray(response.deliveries)) return response.deliveries;
    if (response.data && Array.isArray(response.data)) return response.data;
    if (response.tasks && Array.isArray(response.tasks)) return response.tasks;
    return defaultArray;
  };

  // ========== CHEF ACTION HANDLERS ==========
  const handleChefAccept = async (orderId) => {
    try {
      await staffService.chefAcceptOrder(orderId);
      await fetchTasks();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error(error.response?.data?.message || 'Failed to accept order');
    }
  };

  const handleChefReject = async (orderId, reason) => {
    try {
      await staffService.chefRejectOrder(orderId, reason);
      await fetchTasks();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error(error.response?.data?.message || 'Failed to reject order');
    }
  };

  const handleStartPreparing = async (orderId) => {
    try {
      await staffService.startCooking(orderId);
      await fetchTasks();
    } catch (error) {
      console.error('Error starting preparation:', error);
      toast.error(error.response?.data?.message || 'Failed to start preparing');
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      await staffService.completeCooking(orderId);
      await fetchTasks();
    } catch (error) {
      console.error('Error marking ready:', error);
      toast.error(error.response?.data?.message || 'Failed to mark ready');
    }
  };

  // ========== DELIVERY ACTION HANDLERS ==========
  const handleDeliveryAccept = async (orderId) => {
    try {
      await staffService.deliveryAcceptOrder(orderId);
      await fetchTasks();
    } catch (error) {
      console.error('Error accepting delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to accept delivery');
    }
  };

  const handleDeliveryReject = async (orderId, reason) => {
    try {
      await staffService.deliveryRejectOrder(orderId, reason);
      await fetchTasks();
    } catch (error) {
      console.error('Error rejecting delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to reject delivery');
    }
  };

  const handleStartDelivery = async (orderId) => {
    try {
      await staffService.startDelivery(orderId);
      await fetchTasks();
    } catch (error) {
      console.error('Error starting delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to start delivery');
    }
  };

  const handleCompleteDelivery = async (orderId) => {
    try {
      await staffService.completeDelivery(orderId);
      await fetchTasks();
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error(error.response?.data?.message || 'Failed to complete delivery');
    }
  };

  // ========== CASHIER ACTION HANDLERS ==========
  const handleProcessPayment = async (orderId, amount) => {
    try {
      await staffService.processCashPayment(orderId, amount);
      await fetchTasks();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.message || 'Failed to process payment');
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const userRole = user?.role?.toLowerCase();
      console.log('Fetching tasks for role:', userRole);
      
      let activeTasks = [];
      let completed = [];
      
      if (canReadPage('staffOrdersCooking')) {
        const response = await staffService.getMyCookingOrders();
        const orders = extractArray(response, []);
        
        activeTasks = orders.filter(o => 
          o.status === 'confirmed' || o.status === 'preparing' || o.status === 'cooking'
        );
        completed = orders.filter(o => 
          o.status === 'ready' || o.status === 'delivered'
        );
        
      } else if (canReadPage('staffOrdersDelivery')) {
        const response = await staffService.getMyDeliveryOrders();
        const deliveries = extractArray(response, []);
        
        activeTasks = deliveries.filter(d => 
          d.status === 'ready' || d.status === 'out-for-delivery'
        );
        completed = deliveries.filter(d => 
          d.status === 'delivered'
        );
        
      } else if (userRole === 'cashier') {
        const response = await staffService.getCashierTasks();
        const tasksArray = extractArray(response, []);
        
        activeTasks = tasksArray.filter(t => 
          t.paymentStatus === 'pending' || t.status === 'pending'
        );
        completed = tasksArray.filter(t => 
          t.paymentStatus === 'completed' || t.status === 'completed'
        );
      }

      setTasks(activeTasks);
      setCompletedTasks(completed);

      const today = new Date().toDateString();
      const todayTasksCount = activeTasks.filter(t => {
        const date = new Date(t.createdAt || t.orderDate);
        return date.toDateString() === today;
      }).length;

      const completedTodayCount = completed.filter(t => {
        const date = new Date(t.updatedAt || t.completedAt || t.createdAt);
        return date.toDateString() === today;
      }).length;

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
      } else {
        toast.error(error.response?.data?.message || 'Failed to load tasks');
        setTasks([]);
        setCompletedTasks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = () => {
    fetchTasks();
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
    if (canReadPage('staffOrdersCooking')) {
      return 'Orders ready for preparation will appear here';
    }
    if (canReadPage('staffOrdersDelivery')) {
      return 'Orders ready for delivery will appear here';
    }
    if (hasRole('cashier')) {
      return 'Pending payments will appear here';
    }
    return 'Your tasks will appear here';
  };

  const getTaskType = () => {
    if (canReadPage('staffOrdersCooking')) return 'cook';
    if (canReadPage('staffOrdersDelivery')) return 'delivery';
    if (hasRole('cashier')) return 'cashier';
    return user?.role?.toLowerCase() || 'staff';
  };

  const getNavTabs = () => {
    const tabs = [];
    if (canReadPage('staffDashboard')) {
      tabs.push({ id: 'tasks', label: 'My Tasks', icon: '📋' });
    }
    if (canReadPage('staffOrdersCooking')) {
      tabs.push({ id: 'kitchen', label: 'Kitchen Display', icon: '🍳' });
    }
    if (canReadPage('adminIngredients')) {
      tabs.push({ id: 'stock', label: 'Stock In/Out', icon: '🔄' });
    }
    if (canReadPage('adminExpenses')) {
      tabs.push({ id: 'expenses', label: 'Expenses', icon: '💸' });
    }
    if (canReadPage('adminReports')) {
      tabs.push({ id: 'reports', label: 'Reports', icon: '📈' });
    }
    return tabs;
  };

  const navTabs = getNavTabs();
  const taskType = getTaskType();
  const canWriteTasks = canWritePage('staffDashboard') && (
    taskType === 'cook'
      ? canWritePage('staffOrdersCooking')
      : taskType === 'delivery'
        ? canWritePage('staffOrdersDelivery')
        : taskType === 'cashier'
  );

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

      {navTabs.length > 1 && (
        <div className="staff-nav">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="staff-content">
        {activeTab === 'tasks' && (
          <>
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
                className={`tab-btn ${activeSubTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('tasks')}
              >
                Active Tasks ({tasks.length})
              </button>
              <button 
                className={`tab-btn ${activeSubTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('completed')}
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
                  {activeSubTab === 'tasks' && (
                    <>
                      {tasks.length > 0 ? (
                        tasks.map(task => (
                          <StaffTaskCard
                            key={task._id}
                            task={task}
                            type={taskType}
                            canWrite={canWriteTasks}
                            onTaskUpdate={handleTaskUpdate}
                            onChefAccept={handleChefAccept}
                            onChefReject={handleChefReject}
                            onStartPreparing={handleStartPreparing}
                            onMarkReady={handleMarkReady}
                            onDeliveryAccept={handleDeliveryAccept}
                            onDeliveryReject={handleDeliveryReject}
                            onStartDelivery={handleStartDelivery}
                            onCompleteDelivery={handleCompleteDelivery}
                            onProcessPayment={handleProcessPayment}
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

                  {activeSubTab === 'completed' && (
                    <>
                      {completedTasks.length > 0 ? (
                        completedTasks.map(task => (
                          <StaffTaskCard
                            key={task._id}
                            task={task}
                            type={taskType}
                            canWrite={canWriteTasks}
                            onTaskUpdate={handleTaskUpdate}
                            onChefAccept={handleChefAccept}
                            onChefReject={handleChefReject}
                            onStartPreparing={handleStartPreparing}
                            onMarkReady={handleMarkReady}
                            onDeliveryAccept={handleDeliveryAccept}
                            onDeliveryReject={handleDeliveryReject}
                            onStartDelivery={handleStartDelivery}
                            onCompleteDelivery={handleCompleteDelivery}
                            onProcessPayment={handleProcessPayment}
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
          </>
        )}

        {activeTab === 'kitchen' && canReadPage('staffOrdersCooking') && (
          <div className="page-wrapper">
            <KitchenDisplayTab readOnly={!canWritePage('staffDashboard') || !canWritePage('staffOrdersCooking')} />
          </div>
        )}

        {activeTab === 'stock' && canReadPage('adminIngredients') && (
          <div className="page-wrapper">
            <StockTab readOnly={!canWritePage('adminIngredients')} />
          </div>
        )}

        {activeTab === 'expenses' && canReadPage('adminExpenses') && (
          <div className="page-wrapper">
            <ExpenseTab readOnly={!canWritePage('adminExpenses')} />
          </div>
        )}

        {activeTab === 'reports' && canReadPage('adminReports') && (
          <div className="page-wrapper">
            <ReportsTab readOnly={!canWritePage('adminReports')} />
          </div>
        )}
      </div>

      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        {connected ? '🟢 Connected' : '🔴 Reconnecting...'}
      </div>
    </div>
  );
};

export default StaffDashboard;