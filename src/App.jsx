import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import contexts
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Import components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import StaffPrivateRoute from './components/StaffPrivateRoute';

// Import pages
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import PaymentConfirmation from './pages/PaymentConfirmation';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import StaffLogin from './pages/StaffLogin';

// Import CSS
import './App.css';

function App() {
  return (
    <>
      <AuthProvider>
        <SocketProvider>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/order-confirmation/:orderId" element={<PaymentConfirmation />} />
                <Route path="/login" element={<Login />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Staff Login - Supporting both URLs for compatibility */}
                <Route path="/staff-login" element={<StaffLogin />} />
                <Route path="/staff/login" element={<StaffLogin />} /> {/* Added this line */}
                
                {/* Protected Routes */}
                <Route path="/profile" element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } />
                
                <Route path="/admin/*" element={
                  <PrivateRoute adminOnly>
                    <AdminDashboard />
                  </PrivateRoute>
                } />
                
                <Route path="/staff/*" element={
                  <StaffPrivateRoute>
                    <StaffDashboard />
                  </StaffPrivateRoute>
                } />
                
                {/* Catch-all route for 404 - Optional */}
                <Route path="*" element={<div className="not-found">Page Not Found</div>} />
              </Routes>
            </main>
            <Footer />
          </div>
        </SocketProvider>
      </AuthProvider>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;