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

const PaymentForm = ({ orderId, amount, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, [orderId]);

  const createPaymentIntent = async () => {
    try {
      const response = await orderService.createPaymentIntent(orderId);
      setClientSecret(response.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment');
      onPaymentError && onPaymentError(error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        console.error('Payment failed:', error);
        toast.error(error.message || 'Payment failed');
        onPaymentError && onPaymentError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onPaymentSuccess && onPaymentSuccess(paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed');
      onPaymentError && onPaymentError(error);
    }

    setIsProcessing(false);
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

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-amount">
        <h3>Total Amount: ${amount}</h3>
      </div>

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

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="payment-button"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount}`}
      </button>

      <div className="payment-security">
        <p>🔒 Your payment information is secure and encrypted</p>
      </div>
    </form>
  );
};

const StripePaymentWrapper = ({ orderId, amount, onPaymentSuccess, onPaymentError }) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        orderId={orderId}
        amount={amount}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
      />
    </Elements>
  );
};

export default StripePaymentWrapper;