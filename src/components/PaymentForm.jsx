import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { orderService } from '../services/api';
import { toast } from 'react-toastify';
import './PaymentForm.css';

// Initialize Stripe (replace with your publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key_here');

const PaymentForm = ({ 
  orderId, 
  amount, 
  customerInfo, // Added customer info for billing details
  onPaymentSuccess, 
  onPaymentError 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    // Create payment intent when component mounts
    if (orderId) {
      createPaymentIntent();
    }
  }, [orderId]);

  const createPaymentIntent = async () => {
    try {
      setIsProcessing(true);
      const response = await orderService.createPaymentIntent(orderId);
      console.log('Payment intent created:', response);
      setClientSecret(response.clientSecret);
      setPaymentError('');
    } catch (error) {
      console.error('Error creating payment intent:', error);
      const errorMessage = error.message || 'Failed to initialize payment';
      setPaymentError(errorMessage);
      toast.error(errorMessage);
      onPaymentError && onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error('Payment system not initialized');
      return;
    }

    if (!clientSecret) {
      toast.error('Payment not initialized. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    const cardElement = elements.getElement(CardElement);

    try {
      // Prepare billing details if customer info is provided
      const billingDetails = customerInfo ? {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address ? {
          line1: customerInfo.address,
          city: customerInfo.city,
          country: 'ET',
        } : undefined
      } : {};

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: billingDetails
        }
      });

      if (error) {
        console.error('Payment failed:', error);
        const errorMessage = error.message || 'Payment failed';
        setPaymentError(errorMessage);
        toast.error(errorMessage);
        onPaymentError && onPaymentError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm order with backend
        try {
          await orderService.confirmOrderPayment(orderId, paymentIntent.id);
          toast.success('Payment successful! Order confirmed.');
          onPaymentSuccess && onPaymentSuccess(paymentIntent);
        } catch (confirmError) {
          console.error('Error confirming order:', confirmError);
          toast.error('Payment succeeded but order confirmation failed. Please contact support.');
          onPaymentError && onPaymentError(confirmError);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Payment failed';
      setPaymentError(errorMessage);
      toast.error(errorMessage);
      onPaymentError && onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  // Format amount to ETB
  const formattedAmount = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2
  }).format(amount);

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-amount">
        <h3>Total Amount: {formattedAmount}</h3>
      </div>

      {paymentError && (
        <div className="payment-error-message">
          <p>❌ {paymentError}</p>
        </div>
      )}

      <div className="card-element-container">
        <label htmlFor="card-element">Card Information</label>
        <div className="card-element-wrapper">
          <CardElement
            id="card-element"
            options={cardStyle}
            className="card-element"
          />
        </div>
      </div>

      {/* Test card hint */}
      <div className="test-card-hint">
        <p>Test Card: 4242 4242 4242 4242 | Any future date | Any CVC</p>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || !clientSecret}
        className={`payment-button ${isProcessing ? 'processing' : ''}`}
      >
        {isProcessing ? (
          <>
            <span className="spinner"></span>
            Processing...
          </>
        ) : (
          `Pay ${formattedAmount}`
        )}
      </button>

      <div className="payment-security">
        <p>🔒 Your payment information is secure and encrypted by Stripe</p>
      </div>

      {/* Accepted cards */}
      <div className="accepted-cards">
        <p>Accepted Cards:</p>
        <div className="card-icons">
          <span className="card-icon">Visa</span>
          <span className="card-icon">Mastercard</span>
          <span className="card-icon">Amex</span>
          <span className="card-icon">Discover</span>
        </div>
      </div>
    </form>
  );
};

// Main wrapper component with props validation
const StripePaymentWrapper = ({ 
  orderId, 
  amount, 
  customerInfo = {}, // Default to empty object
  onPaymentSuccess, 
  onPaymentError 
}) => {
  // Validate required props
  if (!orderId) {
    console.error('PaymentForm: orderId is required');
    return (
      <div className="payment-error">
        <p>❌ Order ID is missing. Cannot initialize payment.</p>
      </div>
    );
  }

  if (!amount || amount <= 0) {
    console.error('PaymentForm: valid amount is required');
    return (
      <div className="payment-error">
        <p>❌ Invalid amount. Please check your order total.</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        orderId={orderId}
        amount={amount}
        customerInfo={customerInfo}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
};

export default StripePaymentWrapper;