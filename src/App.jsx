import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Menu from './pages/Menu';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import PaymentConfirmation from './pages/PaymentConfirmation';
import StaffReports from './pages/StaffReports'; // ✅ ADD THIS IMPORT
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/order-confirmation/:orderId" element={<PaymentConfirmation />} />
        <Route path="/admin" element={
          <PrivateRoute adminOnly={true}>
            <AdminDashboard />
          </PrivateRoute>
        } />
        {/* ✅ ADD THIS ROUTE */}
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