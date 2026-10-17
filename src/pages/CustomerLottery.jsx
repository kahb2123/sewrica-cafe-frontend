// src/pages/CustomerLottery.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/useLanguage';
import api from '../services/api';
import './CustomerLottery.css';

const CustomerLottery = () => {
  const { language, t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/lottery/my-tickets');
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">{t('Loading your tickets...')}</div>;
  }

  return (
    <div className="customer-lottery">
      <h1>🎲 {t('My Lottery Tickets')}</h1>
      
      <div className="lottery-info">
        <p>{t('Every order gives you a chance to win monthly prizes!')}</p>
        <p>{t('Eligible orders (delivered and paid) are automatically entered.')}</p>
      </div>

      {tickets.length === 0 ? (
        <div className="no-tickets">
          <p>{t("You don't have any lottery tickets yet.")}</p>
          <p>{t('Place an order to get your first ticket!')}</p>
        </div>
      ) : (
        <div className="tickets-list">
          {tickets.map((ticket, index) => (
            <div key={index} className={`ticket-card ${ticket.eligible ? 'eligible' : ''} ${ticket.won ? 'winner' : ''}`}>
              <div className="ticket-number">{ticket.lotteryTicketNumber}</div>
              <div className="ticket-details">
                <div>{t('Order:')} #{ticket.orderNumber}</div>
                <div>{t('Date')}: {new Date(ticket.date).toLocaleDateString(language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : 'en-US')}</div>
                <div>{t('Amount')}: ETB {ticket.amount}</div>
                <div className="ticket-status">
                  {ticket.won ? (
                    <span className="winner-badge">🏆 {t('WINNER! Contact us to claim your prize!')}</span>
                  ) : ticket.eligible ? (
                    <span className="eligible-badge">✅ {t('Eligible for monthly draw')}</span>
                  ) : (
                    <span className="pending-badge">⏳ {t('Pending eligibility (order must be delivered)')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerLottery;