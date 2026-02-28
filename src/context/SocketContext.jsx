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
  const { user } = useAuth();

  useEffect(() => {
    // Get backend URL from env or use default
    const backendUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'https://sewrica-cafe-backend.onrender.com';

    // Create socket connection
    const newSocket = io(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      setConnected(true);

      // Register user if logged in
      if (user) {
        if (user.role === 'admin' || user.role === 'cashier' || user.role === 'cook' || user.role === 'delivery') {
          // Staff registration
          newSocket.emit('register-staff', user._id, user.role);
          console.log(`👨‍🍳 Staff registered as: ${user.role}`);
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Function to register order for updates
  const registerOrder = (orderId) => {
    if (socket && connected) {
      socket.emit('register-order', orderId);
      console.log(`📦 Registered for order updates: ${orderId}`);
    }
  };

  // Function to listen to order status updates
  const onOrderStatusUpdate = (callback) => {
    if (socket) {
      socket.on('order-status-updated', (data) => {
        console.log('📢 Order status update received:', data);
        
        // Show toast notification
        if (data.status === 'confirmed') {
          toast.success('✅ Your order has been accepted!');
        } else if (data.status === 'cancelled') {
          toast.error('❌ Your order has been cancelled');
        } else {
          toast.info(`Order status: ${data.status}`);
        }
        
        callback(data);
      });
    }
  };

  // Function to listen to new orders (for staff)
  const onNewOrder = (callback) => {
    if (socket) {
      socket.on('new-order', (data) => {
        console.log('📢 New order received:', data);
        toast.info(`New order #${data.orderNumber} received!`);
        callback(data);
      });
    }
  };

  // Function to listen to payment completed
  const onPaymentCompleted = (callback) => {
    if (socket) {
      socket.on('payment-completed', (data) => {
        console.log('💰 Payment completed:', data);
        toast.success(`Payment received for order #${data.orderNumber}`);
        callback(data);
      });
    }
  };

  // Remove listeners
  const removeListeners = () => {
    if (socket) {
      socket.off('order-status-updated');
      socket.off('new-order');
      socket.off('payment-completed');
    }
  };

  const value = {
    socket,
    connected,
    registerOrder,
    onOrderStatusUpdate,
    onNewOrder,
    onPaymentCompleted,
    removeListeners
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};