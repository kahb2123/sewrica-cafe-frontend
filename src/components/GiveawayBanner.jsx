// src/components/GiveawayBanner.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './GiveawayBanner.css';

const GiveawayBanner = () => {
  const [giveaway, setGiveaway] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchActiveGiveaway();
  }, []);

  useEffect(() => {
    // Trigger animation after component mounts
    if (!loading && giveaway) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [loading, giveaway]);

  const fetchActiveGiveaway = async () => {
    try {
      const response = await api.get('/giveaway/active');
      setGiveaway(response.data.giveaway);
    } catch (error) {
      console.error('Error fetching giveaway:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!giveaway) return null;

  return (
    <div className={`giveaway-banner-wrapper ${isVisible ? 'visible' : ''}`}>
      <div className="giveaway-banner-container">
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
              <div className="giveaway-timer" id="giveaway-timer">
                <div className="timer-block">
                  <span className="timer-number" id="days">00</span>
                  <span className="timer-label">Days</span>
                </div>
                <div className="timer-block">
                  <span className="timer-number" id="hours">00</span>
                  <span className="timer-label">Hours</span>
                </div>
                <div className="timer-block">
                  <span className="timer-number" id="minutes">00</span>
                  <span className="timer-label">Mins</span>
                </div>
                <div className="timer-block">
                  <span className="timer-number" id="seconds">00</span>
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

// Timer function
const startTimer = (endDate) => {
  const countDownDate = new Date(endDate).getTime();

  const interval = setInterval(() => {
    const now = new Date().getTime();
    const distance = countDownDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');

    if (daysElement) daysElement.innerHTML = days.toString().padStart(2, '0');
    if (hoursElement) hoursElement.innerHTML = hours.toString().padStart(2, '0');
    if (minutesElement) minutesElement.innerHTML = minutes.toString().padStart(2, '0');
    if (secondsElement) secondsElement.innerHTML = seconds.toString().padStart(2, '0');

    if (distance < 0) {
      clearInterval(interval);
      if (daysElement) daysElement.innerHTML = '00';
      if (hoursElement) hoursElement.innerHTML = '00';
      if (minutesElement) minutesElement.innerHTML = '00';
      if (secondsElement) secondsElement.innerHTML = '00';
    }
  }, 1000);
};

// Start timer when component mounts
if (typeof window !== 'undefined') {
  window.startGiveawayTimer = startTimer;
}

export default GiveawayBanner;