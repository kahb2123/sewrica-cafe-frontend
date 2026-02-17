import React, { useState } from 'react';
import { 
  FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, 
  FaFacebook, FaInstagram, FaTelegram, FaTiktok,
  FaLinkedin, FaWhatsapp, FaStar, FaPaperPlane,
  FaCheckCircle
} from 'react-icons/fa';
import { MdDeliveryDining, MdRestaurantMenu } from 'react-icons/md';
import { toast } from 'react-toastify';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Business Information
  const businessInfo = {
    name: 'SEWRICA Cafe',
    address: 'Megenagna, Metebaber Building, 2nd Floor',
    city: 'Addis Ababa, Ethiopia',
    phone: '+251 911 234 567',
    phone2: '+251 922 345 678',
    email: 'info@sewricacafe.com',
    email2: 'reservations@sewricacafe.com',
    hours: [
      { day: 'Monday - Friday', hours: '8:00 AM - 10:00 PM' },
      { day: 'Saturday', hours: '9:00 AM - 11:00 PM' },
      { day: 'Sunday', hours: '9:00 AM - 9:00 PM' },
      { day: 'Holidays', hours: '10:00 AM - 8:00 PM' }
    ]
  };

  // Social Media Links
  const socialLinks = [
    { icon: <FaFacebook />, name: 'Facebook', link: 'https://facebook.com/sewricacafe', color: '#1877f2', username: '@sewricacafe' },
    { icon: <FaInstagram />, name: 'Instagram', link: 'https://instagram.com/sewricacafe', color: '#e4405f', username: '@sewricacafe' },
    { icon: <FaTelegram />, name: 'Telegram', link: 'https://t.me/sewricacafe', color: '#0088cc', username: '@sewricacafe' },
    { icon: <FaTiktok />, name: 'TikTok', link: 'https://tiktok.com/@sewricacafe', color: '#000000', username: '@sewricacafe' },
    { icon: <FaLinkedin />, name: 'LinkedIn', link: 'https://linkedin.com/company/sewricacafe', color: '#0077b5', username: 'SEWRICA Cafe' },
    { icon: <FaWhatsapp />, name: 'WhatsApp', link: 'https://wa.me/251911234567', color: '#25D366', username: '+251 911 234 567' }
  ];

  // FAQ Questions
  const faqs = [
    {
      question: 'Do you take reservations?',
      answer: 'Yes, we accept reservations for parties of 4 or more. You can call us or use the contact form below to make a reservation.'
    },
    {
      question: 'Do you offer delivery?',
      answer: 'Yes, we offer free delivery within Megenagna area. Delivery fees apply for other areas.'
    },
    {
      question: 'Are you open on holidays?',
      answer: 'Yes, we are open on most holidays with reduced hours. Check our hours section for holiday schedules.'
    },
    {
      question: 'Do you have vegetarian options?',
      answer: 'Absolutely! We have a wide variety of vegetarian and vegan options, including our famous Beyaynet and Yetsom Agelgil.'
    }
  ];

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
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

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Phone number is invalid';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill in all required fields correctly');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    }, 1500);
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="container">
          <h1 className="contact-hero-title">Contact Us</h1>
          <p className="contact-hero-subtitle">
            We'd love to hear from you! Reach out with any questions, feedback, or special requests.
          </p>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="info-cards-section">
        <div className="container">
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">
                <FaMapMarkerAlt />
              </div>
              <h3 className="info-title">Visit Us</h3>
              <p className="info-text">{businessInfo.address}</p>
              <p className="info-text">{businessInfo.city}</p>
              <a 
                href="https://maps.google.com/?q=Megenagna+Metebaber+Building+Addis+Ababa" 
                target="_blank" 
                rel="noopener noreferrer"
                className="info-link"
              >
                Get Directions
              </a>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaPhone />
              </div>
              <h3 className="info-title">Call Us</h3>
              <p className="info-text">
                <a href={`tel:${businessInfo.phone}`} className="phone-link">
                  {businessInfo.phone}
                </a>
              </p>
              <p className="info-text">
                <a href={`tel:${businessInfo.phone2}`} className="phone-link">
                  {businessInfo.phone2}
                </a>
              </p>
              <p className="info-note">Available 8:00 AM - 10:00 PM</p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <FaEnvelope />
              </div>
              <h3 className="info-title">Email Us</h3>
              <p className="info-text">
                <a href={`mailto:${businessInfo.email}`} className="email-link">
                  {businessInfo.email}
                </a>
              </p>
              <p className="info-text">
                <a href={`mailto:${businessInfo.email2}`} className="email-link">
                  {businessInfo.email2}
                </a>
              </p>
              <p className="info-note">We reply within 24 hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* Map and Hours Section */}
      <section className="map-hours-section">
        <div className="container">
          <div className="map-hours-grid">
            {/* Google Map */}
            <div className="map-container">
              <h2 className="section-title">Find Us Here</h2>
              <div className="map-wrapper">
                <iframe
                  title="SEWRICA Cafe Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.7634!2d38.80108!3d9.02024!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b9a7b3c5b3c5b%3A0x3c5b3c5b3c5b3c5b!2sMetebaber%20Building!5e0!3m2!1sen!2set!4v1700000000000!5m2!1sen!2set"
                  allowFullScreen=""
                  loading="lazy"
                  className="google-map"
                  title="Google Maps"
                ></iframe>
              </div>
              <div className="map-address">
                <FaMapMarkerAlt className="map-marker" />
                <span>{businessInfo.address}, {businessInfo.city}</span>
              </div>
            </div>

            {/* Business Hours */}
            <div className="hours-container">
              <h2 className="section-title">Business Hours</h2>
              <div className="hours-card">
                <div className="hours-header">
                  <FaClock className="hours-icon" />
                  <span>Opening Hours</span>
                </div>
                <ul className="hours-list">
                  {businessInfo.hours.map((item, index) => (
                    <li key={index} className="hours-item">
                      <span className="hours-day">{item.day}</span>
                      <span className="hours-time">{item.hours}</span>
                    </li>
                  ))}
                </ul>
                <div className="hours-note">
                  <FaStar className="note-icon" />
                  <p>We accept walk-ins and reservations. Call ahead for large groups!</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <a href="tel:+251911234567" className="quick-action-btn">
                  <FaPhone /> Call Now
                </a>
                <a href="https://wa.me/251911234567" target="_blank" rel="noopener noreferrer" className="quick-action-btn whatsapp">
                  <FaWhatsapp /> WhatsApp
                </a>
                <a href="/menu" className="quick-action-btn">
                  <MdRestaurantMenu /> View Menu
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form and Social Section */}
      <section className="form-social-section">
        <div className="container">
          <div className="form-social-grid">
            {/* Contact Form */}
            <div className="form-container">
              <h2 className="section-title">Send Us a Message</h2>
              <p className="form-description">
                Have a question, feedback, or special request? Fill out the form below and we'll get back to you as soon as possible.
              </p>

              {submitSuccess && (
                <div className="success-message">
                  <FaCheckCircle className="success-icon" />
                  <div>
                    <h4>Message Sent Successfully!</h4>
                    <p>Thank you for contacting us. We'll respond within 24 hours.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Your Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={formErrors.name ? 'error' : ''}
                      placeholder="Enter your full name"
                    />
                    {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={formErrors.email ? 'error' : ''}
                      placeholder="Enter your email"
                    />
                    {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={formErrors.phone ? 'error' : ''}
                      placeholder="+251 911 234 567"
                    />
                    {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What is this about?"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={formErrors.message ? 'error' : ''}
                    placeholder="Type your message here..."
                  ></textarea>
                  {formErrors.message && <span className="error-message">{formErrors.message}</span>}
                </div>

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <FaPaperPlane /> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Social Media and FAQ */}
            <div className="social-amenities-container">
              {/* Social Media */}
              <div className="social-section">
                <h2 className="section-title">Connect With Us</h2>
                <p className="social-description">
                  Follow us on social media for the latest updates, special offers, and mouth-watering photos!
                </p>
                <div className="social-grid">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-card"
                      style={{ '--social-color': social.color }}
                    >
                      <div className="social-icon">{social.icon}</div>
                      <div className="social-info">
                        <span className="social-name">{social.name}</span>
                        <span className="social-username">{social.username}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* FAQ Preview */}
              <div className="faq-preview">
                <h2 className="section-title">Quick Questions</h2>
                <div className="faq-list">
                  {faqs.map((faq, index) => (
                    <div key={index} className="faq-item">
                      <details>
                        <summary className="faq-question">{faq.question}</summary>
                        <p className="faq-answer">{faq.answer}</p>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="contact-cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Visit SEWRICA Cafe?</h2>
            <p className="cta-description">
              Experience the best city view and delicious food at Megenagna, Metebaber Building, 2nd Floor
            </p>
            <div className="cta-buttons">
              <a href="/menu" className="cta-btn primary">
                <MdRestaurantMenu /> View Menu
              </a>
              <a href="https://maps.google.com/?q=Megenagna+Metebaber+Building+Addis+Ababa" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="cta-btn secondary"
              >
                <FaMapMarkerAlt /> Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;