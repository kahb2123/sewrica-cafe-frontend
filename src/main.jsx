import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { StripeProvider } from './context/StripeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>  {/* ✅ Single Router here */}
      <AuthProvider>
        <StripeProvider>
          <App />
        </StripeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);