import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Menu from './pages/Menu';
import Login from './pages/Login';
import StaffLogin from './pages/StaffLogin'; // ✅ ADD THIS IMPORT
import StaffDashboard from './pages/StaffDashboard'; // ✅ ADD THIS IMPORT
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import PaymentConfirmation from './pages/PaymentConfirmation';
import StaffReports from './pages/StaffReports';
import PrivateRoute from './components/PrivateRoute';
import StaffPrivateRoute from './components/StaffPrivateRoute'; // ✅ ADD THIS IMPORT
import './App.css';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/order-confirmation/:orderId" element={<PaymentConfirmation />} />
        
        {/* Staff Login Portal */}
        <Route path="/staff/login" element={<StaffLogin />} />
        
        {/* Customer Profile (Protected) */}
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        
        {/* Staff Dashboard Routes (Protected - Staff Only) */}
        <Route path="/staff/dashboard" element={
          <StaffPrivateRoute>
            <StaffDashboard />
          </StaffPrivateRoute>
        } />
        
        {/* Role-specific Staff Dashboards */}
        <Route path="/staff/kitchen" element={
          <StaffPrivateRoute allowedRoles={['cook', 'admin']}>
            <StaffDashboard />
          </StaffPrivateRoute>
        } />
        
        <Route path="/staff/delivery" element={
          <StaffPrivateRoute allowedRoles={['delivery', 'admin']}>
            <StaffDashboard />
          </StaffPrivateRoute>
        } />
        
        <Route path="/staff/cashier" element={
          <StaffPrivateRoute allowedRoles={['cashier', 'admin']}>
            <StaffDashboard />
          </StaffPrivateRoute>
        } />
        
        {/* Admin Routes (Protected - Admin Only) */}
        <Route path="/admin" element={
          <PrivateRoute adminOnly={true}>
            <AdminDashboard />
          </PrivateRoute>
        } />
        
        <Route path="/admin/reports/staff" element={
          <PrivateRoute adminOnly={true}>
            <StaffReports />
          </PrivateRoute>
        } />
      </Routes>
      <Footer />
    </>
  );
}

export default App;