// src/components/GiveawayBanner.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import './GiveawayBanner.css';

const GiveawayBanner = () => {
  const [giveaway, setGiveaway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const location = useLocation();

  useEffect(() => {
    fetchActiveGiveaway();
  }, []);

  useEffect(() => {
    // Trigger animation after component mounts
    if (!loading && giveaway && !isClosed) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [loading, giveaway, isClosed]);

  useEffect(() => {
    if (!giveaway?.endDate) return undefined;

    const updateCountdown = () => {
      const distance = new Date(giveaway.endDate).getTime() - Date.now();

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [giveaway]);

  const fetchActiveGiveaway = async () => {
    try {
      const response = await api.get('/giveaway/active');
      const activeGiveaway = response.data.giveaway;
      setGiveaway(activeGiveaway);
      setIsClosed(false);
    } catch (error) {
      console.error('Error fetching giveaway:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBanner = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsClosed(true);
    }, 300);
  };

  if (loading) return null;
  if (location.pathname !== '/' || !giveaway || isClosed) return null;

  return (
    <div className={`giveaway-banner-wrapper ${isVisible ? 'visible' : ''}`}>
      <div className="giveaway-banner-container">
        <button 
          className="giveaway-close-btn"
          onClick={handleCloseBanner}
          title="Close popup"
          aria-label="Close giveaway popup"
        >
          ✕
        </button>
        <div className="giveaway-banner-image" style={{ backgroundImage: `url(${giveaway.imageUrl})` }}>
          <div className="giveaway-banner-overlay">
            <div className="giveaway-banner-content">
              <div className="giveaway-badge">
                <span className="badge-icon">🎁</span>
                <span className="badge-text">LIMITED TIME OFFER</span>
              </div>
              <h2 className="giveaway-title">{giveaway.title}</h2>
              <p className="giveaway-description">{giveaway.description}</p>
              <div className="giveaway-prize-card">
                <div className="prize-icon">🏆</div>
                <div className="prize-info">
                  <span className="prize-label">Grand Prize</span>
                  <span className="prize-value">{giveaway.prize}</span>
                </div>
              </div>
              <div className="giveaway-timer">
                <div className="timer-block">
                  <span className="timer-number">{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="timer-label">Days</span>
                </div>
                <div className="timer-block">
                  <span className="timer-number">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="timer-label">Hours</span>
                </div>
                <div className="timer-block">
                  <span className="timer-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="timer-label">Mins</span>
                </div>
                <div className="timer-block">
                  <span className="timer-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="timer-label">Secs</span>
                </div>
              </div>
              <div className="giveaway-actions">
                <Link to="/menu" className="giveaway-btn">
                  <span>Participate Now</span>
                  <svg className="btn-arrow" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <p className="giveaway-terms">*Every order automatically enters you into the draw</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiveawayBanner;