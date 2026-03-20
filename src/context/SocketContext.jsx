// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const { user } = useAuth();

  // Get socket URL from environment
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
    (import.meta.env.DEV ? 'http://localhost:5000' : 'https://sewrica-cafe-backend.onrender.com');

  useEffect(() => {
    console.log('🔌 Attempting to connect to socket at:', SOCKET_URL);

    // Check if backend is reachable first
    fetch(`${SOCKET_URL}/api/health`)
      .then(res => res.json())
      .then(data => {
        console.log('✅ Backend health check passed:', data);
      })
      .catch(err => {
        console.warn('⚠️ Backend health check failed:', err.message);
        toast.warning('Connecting to backend...');
      });

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      setConnected(true);
      setReconnecting(false);

      if (user && user._id) {
        const userRole = user.role?.toLowerCase();
        console.log('Registering user with role:', userRole);
        
        if (userRole === 'admin') {
          newSocket.emit('register-admin', user._id);
          console.log('👑 Admin registered');
        } else if (userRole === 'cook' || userRole === 'chef') {
          newSocket.emit('register-chef', user._id);
          console.log('👨‍🍳 Chef registered');
        } else if (userRole === 'delivery') {
          newSocket.emit('register-delivery', user._id);
          console.log('🚚 Delivery registered');
        } else if (userRole === 'cashier') {
          newSocket.emit('register-cashier', user._id);
          console.log('💰 Cashier registered');
        } else if (userRole === 'customer') {
          newSocket.emit('register-customer', user._id);
          console.log('👤 Customer registered');
        }
      }
      
      toast.success('🔌 Connected to real-time server');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setConnected(false);
      
      if (error.message === 'websocket error') {
        console.log('WebSocket failed, falling back to polling...');
        // Socket.IO will automatically fall back to polling
      }
    });

    newSocket.on('reconnecting', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      setReconnecting(true);
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      setReconnecting(false);
      toast.success('🔌 Reconnected to server');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect after all attempts');
      setReconnecting(false);
      toast.error('Connection lost. Please refresh the page.');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  const registerOrder = (orderId) => {
    if (socket && connected) {
      socket.emit('register-order', orderId);
      console.log(`📦 Registered for order updates: ${orderId}`);
    } else {
      console.warn('Cannot register order - socket not connected');
    }
  };

  const onOrderStatusUpdate = (callback) => {
    if (socket) {
      socket.on('order-status-updated', (data) => {
        console.log('📢 Order status update received:', data);
        
        if (data.status === 'confirmed') {
          toast.success('✅ Your order has been accepted!');
        } else if (data.status === 'cancelled') {
          toast.error('❌ Your order has been cancelled');
        } else if (data.status === 'ready') {
          toast.success('🍽️ Your order is ready!');
        } else if (data.status === 'delivered') {
          toast.success('🚚 Your order has been delivered!');
        } else if (data.status === 'preparing') {
          toast.info('👨‍🍳 Your order is being prepared!');
        } else if (data.status === 'out-for-delivery') {
          toast.info('🛵 Your order is out for delivery!');
        } else {
          toast.info(`Order status: ${data.status}`);
        }
        
        callback(data);
      });
    }
  };

  const onNewOrder = (callback) => {
    if (socket) {
      socket.on('new-order', (data) => {
        console.log('📢 New order received:', data);
        toast.info(`🆕 New order #${data.orderNumber} received!`);
        callback(data);
      });
    }
  };

  const onOrderAssigned = (callback) => {
    if (socket) {
      socket.on('order-assigned', (data) => {
        console.log('📢 Order assigned:', data);
        toast.info(`🔔 New task: Order #${data.orderNumber} assigned to you`);
        callback(data);
      });
    }
  };

  const onChefAccepted = (callback) => {
    if (socket) {
      socket.on('chef-accepted', (data) => {
        console.log('👨‍🍳 Chef accepted order:', data);
        toast.success(`Chef ${data.chefName} accepted order #${data.orderNumber}`);
        callback(data);
      });
    }
  };

  const onOrderReady = (callback) => {
    if (socket) {
      socket.on('order-ready', (data) => {
        console.log('✅ Order ready:', data);
        toast.success(`Order #${data.orderNumber} is ready for delivery!`);
        callback(data);
      });
    }
  };

  const onDeliveryAccepted = (callback) => {
    if (socket) {
      socket.on('delivery-accepted', (data) => {
        console.log('🚚 Delivery accepted:', data);
        toast.success(`${data.deliveryName} accepted delivery for order #${data.orderNumber}`);
        callback(data);
      });
    }
  };

  const onOrderDelivered = (callback) => {
    if (socket) {
      socket.on('order-delivered', (data) => {
        console.log('🎉 Order delivered:', data);
        toast.success(`Order #${data.orderNumber} has been delivered!`);
        callback(data);
      });
    }
  };

  const onPaymentCompleted = (callback) => {
    if (socket) {
      socket.on('payment-completed', (data) => {
        console.log('💰 Payment completed:', data);
        toast.success(`✅ Payment received for order #${data.orderNumber}`);
        callback(data);
      });
    }
  };

  const removeListeners = () => {
    if (socket) {
      socket.off('order-status-updated');
      socket.off('new-order');
      socket.off('order-assigned');
      socket.off('chef-accepted');
      socket.off('order-ready');
      socket.off('delivery-accepted');
      socket.off('order-delivered');
      socket.off('payment-completed');
    }
  };

  const value = {
    socket,
    connected,
    reconnecting,
    registerOrder,
    onOrderStatusUpdate,
    onNewOrder,
    onOrderAssigned,
    onChefAccepted,
    onOrderReady,
    onDeliveryAccepted,
    onOrderDelivered,
    onPaymentCompleted,
    removeListeners
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};