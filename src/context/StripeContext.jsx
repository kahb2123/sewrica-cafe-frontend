/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Create context
const StripeContext = createContext();

// Custom hook to use stripe context
export const useStripe = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
};

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const StripeProvider = ({ children }) => {
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const value = {
    stripePromise,
    paymentIntent,
    setPaymentIntent,
    processing,
    setProcessing,
    paymentError,
    setPaymentError,
    resetPayment: () => {
      setPaymentIntent(null);
      setProcessing(false);
      setPaymentError(null);
    }
  };

  return (
    <StripeContext.Provider value={value}>
      <Elements stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
};