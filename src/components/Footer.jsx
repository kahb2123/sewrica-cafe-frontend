import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUtensils, FaPhone, FaEnvelope, FaMapMarkerAlt, 
  FaLinkedin, FaWhatsapp, FaTelegram, FaTiktok,
  FaClock, FaHeart
} from 'react-icons/fa';
import { useLanguage } from '../context/useLanguage';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: t('Home'), path: '/' },
    { name: t('Menu'), path: '/menu' },
    { name: t('Contact'), path: '/contact' },
    { name: t('Cart'), path: '/cart' },
  ];

  const workingHours = [
    { day: t('Monday - Friday'), hours: '8:00 AM - 10:00 PM' },
    { day: t('Saturday'), hours: '9:00 AM - 11:00 PM' },
    { day: t('Sunday'), hours: '9:00 AM - 9:00 PM' },
  ];

  const contactInfo = [
    { icon: <FaMapMarkerAlt />, text: 'Megenagna, Metebaber Building, 2nd Floor', link: 'https://maps.google.com/?q=Megenagna+Addis+Ababa' },
    { icon: <FaPhone />, text: '+251 911060930', link: 'tel:+251911060930' },
    { icon: <FaEnvelope />, text: 'info@sewricacafe.com', link: 'mailto:info@sewricacafe.com' },
  ];

  const socialLinks = [
    { icon: <FaLinkedin />, name: 'LinkedIn', link: 'https://linkedin.com/company/megenagnarestaurant', color: '#0077b5' },
    { icon: <FaWhatsapp />, name: 'WhatsApp', link: 'https://wa.me/251911234567', color: '#25D366' },
    { icon: <FaTelegram />, name: 'Telegram', link: 'https://t.me/sewrica', color: '#0088cc' },
    { icon: <FaTiktok />, name: 'TikTok', link: 'https://tiktok.com/@sewrica', color: '#000000' },
  ];

  return (
    <footer className="footer">
      {/* Main Footer */}
      <div className="footer-main">
        <div className="footer-container">
          {/* Restaurant Info */}
          <div className="footer-section">
            <div className="footer-logo">
              <div className="footer-logo-circle">
                <FaUtensils className="footer-logo-icon" />
              </div>
              <div className="footer-logo-text">
                                <span className="footer-restaurant-name">Sewrica</span>
                <span className="footer-restaurant-cuisine">{t('Cafe & Restaurant')}</span>
              </div>
            </div>
                        <p className="footer-description">
                          {t('Experience the authentic taste of Ethiopia at Sewrica Cafe. Our restaurant brings you traditional flavors passed down through generations, prepared with love and served with a smile.')}
                        </p>
            <div className="footer-social">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  style={{ '--social-color': social.color }}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">{t('Quick Links')}</h3>
            <ul className="footer-links">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="footer-link">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Working Hours */}
          <div className="footer-section">
            <h3 className="footer-title">{t('Working Hours')}</h3>
            <ul className="footer-hours">
              {workingHours.map((item, index) => (
                <li key={index} className="hour-item">
                  <span className="hour-day">{item.day}</span>
                  <span className="hour-time">{item.hours}</span>
                </li>
              ))}
              <li className="hour-note">
                <FaClock className="hour-note-icon" />
                <span>{t('Open on holidays')}</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">{t('Contact Us')}</h3>
            <ul className="footer-contact">
              {contactInfo.map((item, index) => (
                <li key={index}>
                  <a 
                    href={item.link} 
                    className="contact-link"
                    target={item.link.startsWith('http') ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                  >
                    <span className="contact-icon">{item.icon}</span>
                    <span className="contact-text">{item.text}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Map Section */}
      {/* Map Section - Megenagna Metebaber Building Exact Location */}
<div className="footer-map">
    <iframe
    title="Sewrica Cafe & Restaurant Location"
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.7634!2d38.80108!3d9.02024!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b9a7b3c5b3c5b%3A0x3c5b3c5b3c5b3c5b!2sMetebaber%20Building!5e0!3m2!1sen!2set!4v1700000000000!5m2!1sen!2set"
    allowFullScreen=""
    loading="lazy"
    className="map-iframe"
  ></iframe>
</div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
                    <div className="copyright">
            © {currentYear} Sewrica Cafe & Restaurant. {t('All rights reserved.')}
          </div>
          <div className="made-with">
            Made with <FaHeart className="heart-icon" /> in Addis Ababa
          </div>
          <div className="footer-bottom-links">
            <Link to="/privacy" className="bottom-link">{t('Privacy Policy')}</Link>
            <span className="separator">|</span>
            <Link to="/terms" className="bottom-link">{t('Terms of Service')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;