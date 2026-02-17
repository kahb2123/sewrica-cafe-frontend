import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaShoppingCart, FaTrash, FaPlus, FaMinus, 
  FaArrowLeft, FaArrowRight, FaCreditCard, 
  FaMoneyBill, FaMobile, FaCheckCircle,
  FaMapMarkerAlt, FaPhone, FaUser, FaEnvelope,
  FaClock, FaUtensils, FaRegSmile
} from 'react-icons/fa';
import { MdDeliveryDining, MdRestaurantMenu } from 'react-icons/md';
import { RiTakeawayLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: cart, 2: checkout, 3: payment, 4: confirmation
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Addis Ababa',
    area: 'Megenagna',
    building: 'Metebaber Building',
    floor: '2nd Floor',
    additionalInfo: '',
    deliveryMethod: 'delivery', // 'delivery' or 'pickup'
    paymentMethod: 'cash', // 'cash', 'tele_birr', 'bank'
    deliveryTime: 'asap'
  });

  const [formErrors, setFormErrors] = useState({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Load cart items from localStorage
  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = () => {
    setLoading(true);
    try {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(cart);
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Update quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Dispatch event for navbar update
    window.dispatchEvent(new Event('cartUpdated'));
    
    toast.info('Cart updated');
  };

  // Remove item from cart
  const removeItem = (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    window.dispatchEvent(new Event('cartUpdated'));
    
    toast.error('Item removed from cart');
  };

  // Clear entire cart
  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCartItems([]);
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      toast.info('Cart cleared');
    }
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate total (same as subtotal since delivery is free)
  const calculateTotal = () => {
    return calculateSubtotal();
  };

  // Calculate item count
  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Handle input change for customer info
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo({
      ...customerInfo,
      [name]: value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Validate checkout form
  const validateCheckoutForm = () => {
    const errors = {};
    
    if (!customerInfo.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!customerInfo.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(customerInfo.phone.replace(/\s/g, ''))) {
      errors.phone = 'Invalid phone number';
    }
    
    if (!customerInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      errors.email = 'Invalid email';
    }
    
    if (customerInfo.deliveryMethod === 'delivery') {
      if (!customerInfo.address.trim() && !customerInfo.area) {
        errors.address = 'Delivery address is required';
      }
    }
    
    return errors;
  };

  // Proceed to checkout
  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.warning('Your cart is empty');
      return;
    }
    setCheckoutStep(2);
    window.scrollTo(0, 0);
  };

  // Proceed to payment
  const proceedToPayment = () => {
    const errors = validateCheckoutForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill in all required information');
      return;
    }
    
    setCheckoutStep(3);
    window.scrollTo(0, 0);
  };

  // Go back to cart
  const backToCart = () => {
    setCheckoutStep(1);
    window.scrollTo(0, 0);
  };

  // Go back to checkout
  const backToCheckout = () => {
    setCheckoutStep(2);
    window.scrollTo(0, 0);
  };

  // Place order
  const placeOrder = () => {
    // Generate random order number
    const newOrderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    setOrderNumber(newOrderNumber);
    
    // Here you would typically send the order to your backend
    console.log('Order placed:', {
      orderNumber: newOrderNumber,
      items: cartItems,
      customer: customerInfo,
      subtotal: calculateSubtotal(),
      total: calculateTotal(),
      orderDate: new Date().toISOString()
    });
    
    // Clear cart
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
    
    setOrderPlaced(true);
    setCheckoutStep(4);
    window.scrollTo(0, 0);
    
    toast.success('Order placed successfully!');
  };

  // Continue shopping
  const continueShopping = () => {
    navigate('/menu');
  };

  // Render loading state
  if (loading) {
    return (
      <div className="cart-page loading">
        <div className="loader"></div>
        <p>Loading your cart...</p>
      </div>
    );
  }

  // Render order confirmation
  if (checkoutStep === 4) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="confirmation-container">
            <div className="confirmation-icon">
              <FaCheckCircle />
            </div>
            <h1 className="confirmation-title">Order Confirmed!</h1>
            <p className="confirmation-order-number">Order #{orderNumber}</p>
            <p className="confirmation-message">
              Thank you for your order! We've received your order and will start preparing it right away.
            </p>
            
            <div className="confirmation-details">
              <h3>Order Summary</h3>
              <div className="confirmation-info">
                <p><strong>Name:</strong> {customerInfo.name}</p>
                <p><strong>Phone:</strong> {customerInfo.phone}</p>
                <p><strong>Email:</strong> {customerInfo.email}</p>
                <p><strong>Method:</strong> {customerInfo.deliveryMethod === 'delivery' ? 'Free Delivery' : 'Pickup'}</p>
                {customerInfo.deliveryMethod === 'delivery' && (
                  <p><strong>Address:</strong> {customerInfo.area}, {customerInfo.building}, {customerInfo.floor}</p>
                )}
                <p><strong>Payment:</strong> {
                  customerInfo.paymentMethod === 'cash' ? 'Cash on Delivery' :
                  customerInfo.paymentMethod === 'tele_birr' ? 'Tele Birr' : 'Bank Transfer'
                }</p>
                <p><strong>Total:</strong> ETB {calculateTotal().toFixed(2)}</p>
              </div>
              
              <h3>What's Next?</h3>
              <div className="next-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <p>We'll confirm your order via SMS</p>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <p>Your food will be prepared</p>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <p>{customerInfo.deliveryMethod === 'delivery' ? 'Free delivery to your location' : 'Ready for pickup'}</p>
                </div>
                <div className="step">
                  <span className="step-number">4</span>
                  <p>Enjoy your meal!</p>
                </div>
              </div>
            </div>
            
            <div className="confirmation-actions">
              <button onClick={continueShopping} className="btn-primary">
                <MdRestaurantMenu /> Continue Shopping
              </button>
              <Link to="/" className="btn-secondary">
                <FaArrowLeft /> Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        {/* Header */}
        <div className="cart-header">
          <h1 className="cart-title">
            <FaShoppingCart /> Your Cart
          </h1>
          <div className="cart-steps">
            <div className={`step ${checkoutStep >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Cart</span>
            </div>
            <div className={`step-line ${checkoutStep >= 2 ? 'active' : ''}`}></div>
            <div className={`step ${checkoutStep >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Checkout</span>
            </div>
            <div className={`step-line ${checkoutStep >= 3 ? 'active' : ''}`}></div>
            <div className={`step ${checkoutStep >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Payment</span>
            </div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          // Empty Cart
          <div className="empty-cart">
            <FaShoppingCart className="empty-cart-icon" />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <div className="empty-cart-actions">
              <Link to="/menu" className="btn-primary">
                <MdRestaurantMenu /> Browse Menu
              </Link>
              <Link to="/" className="btn-secondary">
                <FaArrowLeft /> Go Home
              </Link>
            </div>
            <div className="popular-suggestions">
              <h3>Popular Items</h3>
              <div className="suggestion-items">
                <div className="suggestion-item" onClick={() => navigate('/menu')}>
                  <FaUtensils /> Sewrica Burger
                </div>
                <div className="suggestion-item" onClick={() => navigate('/menu')}>
                  <FaUtensils /> Beyaynet
                </div>
                <div className="suggestion-item" onClick={() => navigate('/menu')}>
                  <FaUtensils /> Sewrica Pizza
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Cart with items
          <div className="cart-content">
            {checkoutStep === 1 && (
              // Step 1: Cart Review
              <div className="cart-grid">
                <div className="cart-items">
                  <h2>Cart Items ({getItemCount()})</h2>
                  {cartItems.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-image">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="cart-item-details">
                        <div className="cart-item-header">
                          <h3 className="cart-item-name">{item.name}</h3>
                          <p className="cart-item-name-am">{item.nameAm}</p>
                        </div>
                        <p className="cart-item-price">ETB {item.price}</p>
                        <div className="cart-item-actions">
                          <div className="quantity-control">
                            <button 
                              className="quantity-btn"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <FaMinus />
                            </button>
                            <span className="quantity-value">{item.quantity}</span>
                            <button 
                              className="quantity-btn"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <FaPlus />
                            </button>
                          </div>
                          <button 
                            className="remove-btn"
                            onClick={() => removeItem(item.id)}
                          >
                            <FaTrash /> Remove
                          </button>
                        </div>
                      </div>
                      <div className="cart-item-total">
                        <span>Total:</span>
                        <strong>ETB {(item.price * item.quantity).toFixed(2)}</strong>
                      </div>
                    </div>
                  ))}
                  
                  <div className="cart-actions">
                    <button onClick={clearCart} className="clear-cart-btn">
                      <FaTrash /> Clear Cart
                    </button>
                    <Link to="/menu" className="continue-shopping">
                      <FaArrowLeft /> Continue Shopping
                    </Link>
                  </div>
                </div>

                <div className="cart-summary">
                  <h2>Order Summary</h2>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Subtotal ({getItemCount()} items)</span>
                      <span>ETB {calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Delivery Fee</span>
                      <span className="free-delivery">FREE</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total</span>
                      <span>ETB {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="delivery-note">
                    <FaClock className="note-icon" />
                    <p>Free delivery • Estimated time: 30-45 minutes</p>
                  </div>
                  
                  <button 
                    className="checkout-btn"
                    onClick={proceedToCheckout}
                  >
                    Proceed to Checkout <FaArrowRight />
                  </button>
                  
                  <div className="payment-methods-preview">
                    <p>We accept:</p>
                    <div className="payment-icons">
                      <span className="payment-icon">Cash</span>
                      <span className="payment-icon">Tele Birr</span>
                      <span className="payment-icon">Bank</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {checkoutStep === 2 && (
              // Step 2: Checkout Information
              <div className="checkout-grid">
                <div className="checkout-form">
                  <h2>Contact Information</h2>
                  
                  <div className="delivery-method">
                    <label className={`method-option ${customerInfo.deliveryMethod === 'delivery' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="delivery"
                        checked={customerInfo.deliveryMethod === 'delivery'}
                        onChange={handleInputChange}
                      />
                      <MdDeliveryDining /> Free Delivery
                    </label>
                    <label className={`method-option ${customerInfo.deliveryMethod === 'pickup' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="pickup"
                        checked={customerInfo.deliveryMethod === 'pickup'}
                        onChange={handleInputChange}
                      />
                      <RiTakeawayLine /> Pickup
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      <FaUser /> Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      className={formErrors.name ? 'error' : ''}
                      placeholder="Enter your full name"
                    />
                    {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>
                      <FaPhone /> Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      className={formErrors.phone ? 'error' : ''}
                      placeholder="+251 911 234 567"
                    />
                    {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label>
                      <FaEnvelope /> Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={customerInfo.email}
                      onChange={handleInputChange}
                      className={formErrors.email ? 'error' : ''}
                      placeholder="your@email.com"
                    />
                    {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                  </div>

                  {customerInfo.deliveryMethod === 'delivery' && (
                    <>
                      <h2 style={{ marginTop: '30px' }}>Delivery Address</h2>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Area *</label>
                          <input
                            type="text"
                            name="area"
                            value={customerInfo.area}
                            onChange={handleInputChange}
                            placeholder="e.g., Megenagna"
                          />
                        </div>
                        <div className="form-group">
                          <label>Building</label>
                          <input
                            type="text"
                            name="building"
                            value={customerInfo.building}
                            onChange={handleInputChange}
                            placeholder="Building name"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Floor/Office</label>
                          <input
                            type="text"
                            name="floor"
                            value={customerInfo.floor}
                            onChange={handleInputChange}
                            placeholder="e.g., 2nd Floor"
                          />
                        </div>
                        <div className="form-group">
                          <label>City</label>
                          <input
                            type="text"
                            name="city"
                            value={customerInfo.city}
                            onChange={handleInputChange}
                            placeholder="Addis Ababa"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Additional Information</label>
                        <textarea
                          name="additionalInfo"
                          value={customerInfo.additionalInfo}
                          onChange={handleInputChange}
                          placeholder="Landmarks, gate number, special instructions..."
                          rows="3"
                        ></textarea>
                      </div>
                    </>
                  )}

                  {customerInfo.deliveryMethod === 'pickup' && (
                    <div className="pickup-info">
                      <h3>Pickup Location</h3>
                      <p>
                        <FaMapMarkerAlt /> Megenagna, Metebaber Building, 2nd Floor
                      </p>
                      <p>Please bring your ID when picking up your order.</p>
                    </div>
                  )}
                </div>

                <div className="checkout-summary">
                  <h2>Order Summary</h2>
                  <div className="checkout-items">
                    {cartItems.map(item => (
                      <div key={item.id} className="checkout-item">
                        <span className="checkout-item-name">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="checkout-item-price">
                          ETB {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>ETB {calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Delivery Fee</span>
                      <span className="free-delivery">FREE</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total</span>
                      <span>ETB {calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="checkout-actions">
                    <button onClick={backToCart} className="back-btn">
                      <FaArrowLeft /> Back to Cart
                    </button>
                    <button onClick={proceedToPayment} className="continue-btn">
                      Continue to Payment <FaArrowRight />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {checkoutStep === 3 && (
              // Step 3: Payment
              <div className="payment-grid">
                <div className="payment-methods">
                  <h2>Payment Method</h2>
                  
                  <div className="payment-options">
                    <label className={`payment-option ${customerInfo.paymentMethod === 'cash' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={customerInfo.paymentMethod === 'cash'}
                        onChange={handleInputChange}
                      />
                      <FaMoneyBill className="payment-icon" />
                      <div className="payment-info">
                        <strong>Cash on Delivery</strong>
                        <small>Pay when you receive your order</small>
                      </div>
                    </label>

                    <label className={`payment-option ${customerInfo.paymentMethod === 'tele_birr' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="tele_birr"
                        checked={customerInfo.paymentMethod === 'tele_birr'}
                        onChange={handleInputChange}
                      />
                      <FaMobile className="payment-icon" />
                      <div className="payment-info">
                        <strong>Tele Birr</strong>
                        <small>Pay using Tele Birr mobile money</small>
                      </div>
                    </label>

                    <label className={`payment-option ${customerInfo.paymentMethod === 'bank' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={customerInfo.paymentMethod === 'bank'}
                        onChange={handleInputChange}
                      />
                      <FaCreditCard className="payment-icon" />
                      <div className="payment-info">
                        <strong>Bank Transfer</strong>
                        <small>Transfer to our business account</small>
                      </div>
                    </label>
                  </div>

                  {customerInfo.paymentMethod === 'tele_birr' && (
                    <div className="payment-instructions">
                      <h3>Tele Birr Payment Instructions:</h3>
                      <ol>
                        <li>Dial *127# on your mobile</li>
                        <li>Select "Payment"</li>
                        <li>Enter business number: <strong>+251911234567</strong></li>
                        <li>Enter amount: <strong>ETB {calculateTotal().toFixed(2)}</strong></li>
                        <li>Enter your PIN to confirm</li>
                        <li>You'll receive a confirmation SMS</li>
                      </ol>
                      <p className="note">After payment, we'll confirm your order via SMS</p>
                    </div>
                  )}

                  {customerInfo.paymentMethod === 'bank' && (
                    <div className="payment-instructions">
                      <h3>Bank Transfer Details:</h3>
                      <p><strong>Bank:</strong> Commercial Bank of Ethiopia</p>
                      <p><strong>Account Name:</strong> SEWRICA Cafe</p>
                      <p><strong>Account Number:</strong> 1000123456789</p>
                      <p><strong>Amount:</strong> ETB {calculateTotal().toFixed(2)}</p>
                      <p className="note">Please include your order number as reference</p>
                    </div>
                  )}

                  <div className="order-review">
                    <h3>Review Your Order</h3>
                    <div className="review-items">
                      {cartItems.map(item => (
                        <div key={item.id} className="review-item">
                          <span>{item.name} x{item.quantity}</span>
                          <span>ETB {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="review-total">
                      <span>Total:</span>
                      <strong>ETB {calculateTotal().toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="payment-actions">
                    <button onClick={backToCheckout} className="back-btn">
                      <FaArrowLeft /> Back
                    </button>
                    <button onClick={placeOrder} className="place-order-btn">
                      Place Order <FaRegSmile />
                    </button>
                  </div>
                </div>

                <div className="payment-summary">
                  <h2>Delivery Information</h2>
                  <div className="info-card">
                    <p><strong>Name:</strong> {customerInfo.name}</p>
                    <p><strong>Phone:</strong> {customerInfo.phone}</p>
                    <p><strong>Email:</strong> {customerInfo.email}</p>
                    {customerInfo.deliveryMethod === 'delivery' ? (
                      <>
                        <p><strong>Address:</strong> {customerInfo.area}, {customerInfo.building}, {customerInfo.floor}</p>
                        {customerInfo.additionalInfo && (
                          <p><strong>Note:</strong> {customerInfo.additionalInfo}</p>
                        )}
                      </>
                    ) : (
                      <p><strong>Pickup:</strong> Megenagna, Metebaber Building, 2nd Floor</p>
                    )}
                  </div>

                  <h2 style={{ marginTop: '20px' }}>Estimated Time</h2>
                  <div className="time-card">
                    <FaClock className="time-icon" />
                    <div>
                      <p><strong>Preparation:</strong> 10-15 minutes</p>
                      <p><strong>Delivery:</strong> 5-10 minutes</p>
                      <p><strong>Total:</strong> 15-25 minutes</p>
                    </div>
                  </div>

                  <div className="guarantee">
                    <FaCheckCircle className="guarantee-icon" />
                    <p>Free delivery • Your satisfaction is guaranteed. If you're not happy with your order, let us know!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;