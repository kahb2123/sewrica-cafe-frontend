// src/pages/StaffDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { staffService, PERMISSIONS } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/useLanguage';
import StaffTaskCard from '../components/StaffTaskCard';
import KitchenDisplayTab from './admin/tabs/KitchenDisplayTab';
import StockTab from './admin/tabs/StockTab';
import ExpenseTab from './admin/tabs/ExpenseTab';
import ReportsTab from './admin/tabs/ReportsTab';
import StaffOrderEntry from './staff/StaffOrderEntry';
import { toast } from 'react-toastify';
import scrollToPageTop from '../utils/scrollToPageTop';
import './StaffDashboard.css';

const extractArray = (response, defaultArray = []) => {
  if (!response) return defaultArray;
  if (Array.isArray(response)) return response;
  if (response.orders && Array.isArray(response.orders)) return response.orders;
  if (response.deliveries && Array.isArray(response.deliveries)) return response.deliveries;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.tasks && Array.isArray(response.tasks)) return response.tasks;
  return defaultArray;
};

const normalizeLocation = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const getTaskLocationKey = (order) => {
  if (order.tableNumber) return `table:${normalizeLocation(order.tableNumber)}`;

  if (order.deliveryMethod === 'delivery' && order.deliveryAddress) {
    const address = typeof order.deliveryAddress === 'string'
      ? order.deliveryAddress
      : [
          order.deliveryAddress.street,
          order.deliveryAddress.area,
          order.deliveryAddress.building,
          order.deliveryAddress.floor,
          order.deliveryAddress.city,
          order.deliveryAddress.additionalInfo
        ].filter(Boolean).join(', ');
    const normalizedAddress = normalizeLocation(address);
    if (normalizedAddress) return `address:${normalizedAddress}`;
  }

  if (order.deliveryMethod === 'pickup') return 'pickup';
  return `order:${order._id}`;
};

const groupOrdersByLocation = (orders, role, completed = false) => {
  const groups = new Map();
  orders.forEach((order) => {
    const locationKey = getTaskLocationKey(order);
    const completedAt = role === 'waiter' ? order.waiterCompletedAt : order.deliveryCompletedAt;
    const cycleKey = completed
      ? `${locationKey}:completed:${completedAt ? new Date(completedAt).toISOString() : order._id}`
      : locationKey;
    const group = groups.get(cycleKey) || [];
    group.push(order);
    groups.set(cycleKey, group);
  });

  return [...groups.entries()].map(([key, sourceOrders]) => {
    const itemMap = new Map();
    sourceOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const itemKey = `${item.name || item.menuItem}:${Number(item.price) || 0}`;
        const existing = itemMap.get(itemKey);
        if (existing) existing.quantity += Number(item.quantity) || 0;
        else itemMap.set(itemKey, { ...item, quantity: Number(item.quantity) || 0 });
      });
    });
    const statuses = [...new Set(sourceOrders.map((order) => order.status))];
    const orderNumbers = sourceOrders.map((order) => order.dailyOrderNumber || order.orderNumber);
    const oldestCreatedAt = sourceOrders.reduce((oldest, order) => (
      !oldest || new Date(order.createdAt) < new Date(oldest) ? order.createdAt : oldest
    ), null);

    return {
      ...sourceOrders[0],
      _id: `location-group:${key}`,
      orderNumber: orderNumbers.join(', '),
      orderCount: sourceOrders.length,
      sourceOrders,
      items: [...itemMap.values()],
      totalAmount: sourceOrders.reduce((total, order) => total + (Number(order.totalAmount) || 0), 0),
      customerPhone: [...new Set(sourceOrders.map((order) => order.customerPhone).filter(Boolean))].join(', ') || '',
      status: statuses.length === 1 ? statuses[0] : 'multiple',
      createdAt: oldestCreatedAt,
      deliveryAccepted: sourceOrders.every((order) => order.deliveryAccepted),
      waiterCompletedAt: completed && role === 'waiter' ? sourceOrders[0].waiterCompletedAt : null,
      deliveryCompletedAt: completed && role === 'delivery' ? sourceOrders[0].deliveryCompletedAt : null
    };
  }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

const StaffDashboard = () => {
  const { user, logout, hasRole, canReadPage, canWritePage } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { connected, onOrderAssigned, onOrderReady } = useSocket();
  const [activeTab, setActiveTab] = useState(user?.role?.toLowerCase() === 'waiter' ? 'order-entry' : 'tasks');
  const [activeSubTab, setActiveSubTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayTasks: 0,
    completedToday: 0,
    pendingTasks: 0
  });
  const [dailySummary, setDailySummary] = useState(null);

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      scrollToPageTop();
    }
    setActiveTab(tab);
    if (tab === 'tasks') fetchTasks();
  };

  const handleSubTabChange = (tab) => {
    if (tab !== activeSubTab) {
      scrollToPageTop();
      setActiveSubTab(tab);
    }
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

  const handleDeliveryGroupAction = async (action, orderIds, reason) => {
    const actionMethods = {
      accept: (id) => staffService.deliveryAcceptOrder(id),
      reject: (id) => staffService.deliveryRejectOrder(id, reason),
      start: (id) => staffService.startDelivery(id)
    };
    const runAction = actionMethods[action];
    if (!runAction || !orderIds.length) return;
    try {
      await Promise.all(orderIds.map(runAction));
      await fetchTasks();
    } catch (error) {
      console.error(`Error applying ${action} to delivery group:`, error);
      await fetchTasks();
      throw error;
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
      if (Array.isArray(orderId)) await staffService.completeDeliveryGroup(orderId);
      else await staffService.completeDelivery(orderId);
      await fetchTasks();
    } catch (error) {
      console.error('Error completing delivery:', error);
      throw error;
    }
  };

  const handleCompleteWaiterTask = async (orderId) => {
    if (Array.isArray(orderId)) await staffService.completeWaiterTasks(orderId);
    else await staffService.completeWaiterTask(orderId);
    await fetchTasks();
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

  const fetchTasks = useCallback(async () => {
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
        const completedResponse = await staffService.getMyCompletedDeliveryOrders();

        const activeOrders = deliveries.filter(d => 
          d.status === 'ready' || d.status === 'out-for-delivery'
        );
        const completedOrders = extractArray(completedResponse, []).filter(d => 
          d.status === 'delivered'
        );
        activeTasks = groupOrdersByLocation(activeOrders, 'delivery');
        completed = groupOrdersByLocation(completedOrders, 'delivery', true);
        
      } else if (userRole === 'waiter') {
        const response = await staffService.getMyWaiterOrders();
        const orders = extractArray(response, []);

        const activeOrders = orders.filter(order =>
          !order.waiterCompletedAt &&
          ['pending', 'confirmed', 'preparing', 'cooking', 'ready', 'out-for-delivery', 'delivered'].includes(order.status)
        );
        const completedOrders = orders.filter(order =>
          order.waiterCompletedAt || order.status === 'cancelled'
        );
        activeTasks = groupOrdersByLocation(activeOrders, 'waiter');
        completed = groupOrdersByLocation(completedOrders, 'waiter', true);

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

      if (userRole === 'waiter' || userRole === 'delivery') {
        try {
          const response = await staffService.getDailyTaskSummary();
          setDailySummary(response.summary || null);
        } catch (summaryError) {
          console.error('Error fetching daily task summary:', summaryError);
          setDailySummary(null);
          toast.warning(summaryError.message || 'Failed to load today’s completed order totals');
        }
      } else {
        setDailySummary(null);
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
  }, [user, canReadPage, logout, navigate]);

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
  }, [user, canReadPage, fetchTasks, navigate]);

  useEffect(() => {
    if (connected) {
      const unsubscribeAssigned = onOrderAssigned?.(() => fetchTasks());
      const unsubscribeReady = onOrderReady?.(() => fetchTasks());
      return () => {
        unsubscribeAssigned?.();
        unsubscribeReady?.();
      };
    }
  }, [connected, onOrderAssigned, onOrderReady, fetchTasks]);

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
      case 'waiter':
        return '🧑‍🍽️';
      default:
        return '👤';
    }
  };

  const getRoleTitle = () => {
    const role = user?.role?.toLowerCase();
    switch(role) {
      case 'cook':
      case 'chef':
        return t('Kitchen Staff');
      case 'delivery':
        return t('Delivery Personnel');
      case 'cashier':
        return t('Cashier');
      case 'waiter':
        return t('Waiter');
      default:
        return t('Staff');
    }
  };

  const getRoleSpecificMessage = () => {
    if (canReadPage('staffOrdersCooking')) {
      return t('Orders ready for preparation will appear here');
    }
    if (canReadPage('staffOrdersDelivery')) {
      return t('Orders ready for delivery will appear here');
    }
    if (hasRole('cashier')) {
      return t('Pending payments will appear here');
    }
    return t('Your tasks will appear here');
  };

  const getTaskType = () => {
    if (canReadPage('staffOrdersCooking')) return 'cook';
    if (canReadPage('staffOrdersDelivery')) return 'delivery';
    if (hasRole('cashier')) return 'cashier';
    return user?.role?.toLowerCase() || 'staff';
  };

  const getNavTabs = () => {
    const tabs = [];
    if (canReadPage('staffOrderEntry')) {
      tabs.push({ id: 'order-entry', label: t('New Order'), icon: '🧾' });
    }
    if (canReadPage('staffDashboard')) {
      tabs.push({ id: 'tasks', label: t('My Tasks'), icon: '📋' });
    }
    if (canReadPage('staffOrdersCooking')) {
      tabs.push({ id: 'kitchen', label: t('Kitchen Display'), icon: '🍳' });
    }
    if (canReadPage('adminIngredients')) {
      tabs.push({ id: 'stock', label: t('Stock In/Out'), icon: '🔄' });
    }
    if (canReadPage('adminExpenses')) {
      tabs.push({ id: 'expenses', label: t('Expenses'), icon: '💸' });
    }
    if (canReadPage('adminReports')) {
      tabs.push({ id: 'reports', label: t('Reports'), icon: '📈' });
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
        : taskType === 'waiter' || taskType === 'cashier'
  );

  return (
    <div className="staff-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="staff-avatar-large">
            {getRoleIcon()}
          </div>
          <div className="staff-info">
            <h1>{t('Welcome')}, {user?.name || t('Staff')}!</h1>
            <p className="role-badge">{getRoleTitle()}</p>
            <p className="staff-email">{user?.email}</p>
          </div>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={logout}>
            🚪 {t('Logout')}
          </button>
        </div>
      </div>

      {navTabs.length > 1 && (
        <div className="staff-nav">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="staff-content">
        {activeTab === 'order-entry' && canReadPage('staffOrderEntry') && (
          <StaffOrderEntry />
        )}

        {activeTab === 'tasks' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-details">
                  <h3>{t("Today's Tasks")}</h3>
                  <p className="stat-number">{stats.todayTasks}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-details">
                  <h3>{t('Completed Today')}</h3>
                  <p className="stat-number">{stats.completedToday}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-details">
                  <h3>{t('Pending')}</h3>
                  <p className="stat-number">{stats.pendingTasks}</p>
                </div>
              </div>
              {(user?.role?.toLowerCase() === 'waiter' || user?.role?.toLowerCase() === 'delivery') && (
                <>
                  <div className="stat-card">
                    <div className="stat-icon">🧾</div>
                    <div className="stat-details">
                      <h3>{t('Completed orders today')}</h3>
                      <p className="stat-number">{dailySummary?.completedOrders || 0}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💵</div>
                    <div className="stat-details">
                      <h3>{t('Order revenue today')}</h3>
                      <p className="stat-number">ETB {Number(dailySummary?.totalRevenue || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="tasks-tabs">
              <button 
                className={`tab-btn ${activeSubTab === 'tasks' ? 'active' : ''}`}
                onClick={() => handleSubTabChange('tasks')}
              >
                {t('Active Tasks')} ({tasks.length})
              </button>
              <button 
                className={`tab-btn ${activeSubTab === 'completed' ? 'active' : ''}`}
                onClick={() => handleSubTabChange('completed')}
              >
                {t('Completed')} ({completedTasks.length})
              </button>
            </div>

            <div className="tasks-container">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>{t('Loading your tasks...')}</p>
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
                            onCompleteWaiterTask={handleCompleteWaiterTask}
                            onGroupDeliveryAction={handleDeliveryGroupAction}
                            onProcessPayment={handleProcessPayment}
                          />
                        ))
                      ) : (
                        <div className="empty-state">
                          <div className="empty-icon">🎉</div>
                          <h3>{t('No Active Tasks')}</h3>
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
                            onCompleteWaiterTask={handleCompleteWaiterTask}
                            onGroupDeliveryAction={handleDeliveryGroupAction}
                            onProcessPayment={handleProcessPayment}
                          />
                        ))
                      ) : (
                        <div className="empty-state">
                          <div className="empty-icon">📭</div>
                          <h3>{t('No Completed Tasks')}</h3>
                          <p>{t('Your completed tasks will appear here')}</p>
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