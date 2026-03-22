// src/pages/admin/tabs/LotteryTab.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import './LotteryTab.css';

const LotteryTab = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [winners, setWinners] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [stats, setStats] = useState({
    totalTickets: 0,
    eligibleTickets: 0,
    winners: 0,
    claimedPrizes: 0
  });
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [error, setError] = useState(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = [2024, 2025, 2026];

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Log the full URL being called
      const url = `/lottery/admin/tickets?month=${selectedMonth}&year=${selectedYear}`;
      console.log('🔧 API baseURL:', api.defaults.baseURL);
      console.log('🔧 Request URL:', url);
      console.log('🔧 Full URL:', api.defaults.baseURL + url);
      
      const response = await api.get(url);
      console.log('📊 Tickets response:', response.data);
      
      if (response.data && response.data.tickets) {
        setTickets(response.data.tickets);
        console.log(`✅ Loaded ${response.data.tickets.length} tickets`);
      } else {
        console.warn('No tickets found in response');
        setTickets([]);
      }
    } catch (error) {
      console.error('❌ Error fetching tickets:', error);
      setError(error.message);
      toast.error('Failed to fetch lottery tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching lottery stats...');
      const response = await api.get('/lottery/admin/stats');
      console.log('📊 Stats response:', response.data);
      
      if (response.data && response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  };

  const runLotteryDraw = async () => {
    setDrawing(true);
    try {
      console.log('🎲 Running lottery draw for month:', selectedMonth, 'year:', selectedYear);
      const response = await api.post('/lottery/admin/draw', {
        month: selectedMonth,
        year: selectedYear,
        prizeCount: 3
      });
      
      console.log('🎲 Draw response:', response.data);
      
      if (response.data.success) {
        toast.success(response.data.message);
        setWinners(response.data.winners || []);
        fetchTickets();
        fetchStats();
      }
    } catch (error) {
      console.error('❌ Error running draw:', error);
      toast.error('Failed to run lottery draw');
    } finally {
      setDrawing(false);
    }
  };

  const claimPrize = async (ticketNumber) => {
    try {
      console.log('🎁 Claiming prize for ticket:', ticketNumber);
      const response = await api.post(`/lottery/admin/claim-prize/${ticketNumber}`);
      if (response.data.success) {
        toast.success('Prize claimed successfully!');
        fetchTickets();
        fetchStats();
      }
    } catch (error) {
      console.error('❌ Error claiming prize:', error);
      toast.error('Failed to claim prize');
    }
  };

  const viewCertificate = (winner) => {
    console.log('📜 Viewing certificate for winner:', winner);
    setSelectedWinner(winner);
    setShowCertificateModal(true);
  };

  const eligibleTickets = tickets.filter(t => t.eligible);
  const wonTickets = tickets.filter(t => t.won);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading lottery tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error Loading Tickets</h3>
        <p>{error}</p>
        <button onClick={() => fetchTickets()} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="lottery-tab">
      <h1 className="page-title">🎲 Lottery Management</h1>
      
      <div className="lottery-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎫</div>
          <div className="stat-info">
            <h3>Total Tickets</h3>
            <p className="stat-number">{stats.totalTickets || tickets.length || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Eligible Tickets</h3>
            <p className="stat-number">{stats.eligibleTickets || eligibleTickets.length || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-info">
            <h3>Winners</h3>
            <p className="stat-number">{stats.winners || wonTickets.length || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎁</div>
          <div className="stat-info">
            <h3>Prizes Claimed</h3>
            <p className="stat-number">{stats.claimedPrizes || 0}</p>
          </div>
        </div>
      </div>

      <div className="lottery-filters">
        <div className="filter-group">
          <label>Month:</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label>Year:</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <button 
          className="btn-draw" 
          onClick={runLotteryDraw} 
          disabled={drawing || eligibleTickets.length === 0}
        >
          {drawing ? '🎲 Drawing...' : '🎲 Run Monthly Draw'}
        </button>
      </div>

      {winners.length > 0 && (
        <div className="winners-section">
          <h2>🏆 This Month's Winners</h2>
          <div className="winners-grid">
            {winners.map((winner, index) => (
              <div key={index} className="winner-card">
                <div className="winner-rank">#{index + 1}</div>
                <div className="winner-ticket">🎫 {winner.lotteryTicketNumber}</div>
                <div className="winner-customer">{winner.customer?.name || 'Customer'}</div>
                <div className="winner-amount">Order: ETB {winner.amount}</div>
                <div className="winner-order">Order #{winner.orderNumber}</div>
                <button 
                  className="btn-view-certificate"
                  onClick={() => viewCertificate(winner)}
                >
                  📜 View Certificate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tickets-section">
        <h2>All Lottery Tickets - {months[selectedMonth]} {selectedYear}</h2>
        {tickets.length === 0 ? (
          <div className="no-tickets">
            <div className="empty-icon">🎫</div>
            <h3>No Tickets Found</h3>
            <p>No lottery tickets available for {months[selectedMonth]} {selectedYear}.</p>
            <p className="small-text">Tickets are generated when customers place orders.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket Number</th>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, index) => (
                  <tr key={index} className={ticket.won ? 'winner-row' : ''}>
                    <td className="ticket-number">{ticket.lotteryTicketNumber}</td>
                    <td>{ticket.orderNumber}</td>
                    <td>{ticket.customer?.name || 'Guest'}</td>
                    <td>ETB {ticket.amount}</td>
                    <td>{new Date(ticket.date).toLocaleDateString()}</td>
                    <td>
                      {ticket.won ? (
                        <span className="status-badge winner">🏆 Winner!</span>
                      ) : ticket.eligible ? (
                        <span className="status-badge eligible">✅ Eligible</span>
                      ) : (
                        <span className="status-badge ineligible">⏳ Pending Delivery</span>
                      )}
                    </td>
                    <td>
                      {ticket.won && !ticket.prizeClaimed && (
                        <button 
                          className="btn-claim"
                          onClick={() => claimPrize(ticket.lotteryTicketNumber)}
                        >
                          Claim Prize
                        </button>
                      )}
                      {ticket.won && ticket.prizeClaimed && (
                        <span className="claimed-badge">✓ Claimed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {showCertificateModal && selectedWinner && (
        <div className="modal-overlay" onClick={() => setShowCertificateModal(false)}>
          <div className="modal-content certificate-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏆 Lottery Winner Certificate</h2>
              <button className="modal-close-btn" onClick={() => setShowCertificateModal(false)}>×</button>
            </div>
            <div className="certificate-content">
              <pre className="certificate-text">
                {selectedWinner.certificate || `
╔══════════════════════════════════════════════════════════════════════╗
║                    SEWRICA CAFE LOTTERY WINNER                       ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  🏆  CONGRATULATIONS!  🏆                                            ║
║                                                                      ║
║  Ticket Number: ${selectedWinner.lotteryTicketNumber || 'N/A'}
║  Order Number:  ${selectedWinner.orderNumber || 'N/A'}
║  Customer:      ${selectedWinner.customer?.name || 'Customer'}
║  Order Amount:  ETB ${selectedWinner.amount || 0}
║  Winning Date:  ${new Date().toLocaleDateString()}
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  You have won a special prize from Sewrica Cafe!                     ║
║  Please visit our restaurant or contact us to claim your prize.     ║
║                                                                      ║
║  Prize must be claimed within 30 days.                               ║
║                                                                      ║
║  Thank you for being a valued customer!                              ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
                `}
              </pre>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-print-certificate"
                onClick={() => window.print()}
              >
                🖨️ Print Certificate
              </button>
              <button 
                className="btn-close"
                onClick={() => setShowCertificateModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LotteryTab;