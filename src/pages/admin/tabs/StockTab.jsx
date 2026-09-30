import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ingredientService } from '../../../services/api';
import './StockTab.css';

const currency = new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const REASONS = [
  { value: 'consumption', label: 'Used in cooking' },
  { value: 'waste', label: 'Wasted / spoiled' },
  { value: 'damage', label: 'Damaged' },
  { value: 'correction', label: 'Stock correction' },
  { value: 'other', label: 'Other' }
];

const REASON_LABELS = Object.fromEntries(REASONS.map((reason) => [reason.value, reason.label]));

const emptyPurchase = { ingredientId: '', quantity: '', unitCost: '', supplier: '' };
const emptyWithdrawal = { ingredientId: '', quantity: '', reason: 'consumption', note: '' };

const lineValue = (item) => (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);

const formatDateTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
};

const StockTab = () => {
  const [ingredients, setIngredients] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [purchase, setPurchase] = useState(emptyPurchase);
  const [withdrawal, setWithdrawal] = useState(emptyWithdrawal);

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [ingredientResponse, withdrawalResponse] = await Promise.all([
        ingredientService.getAll(),
        ingredientService.getWithdrawals(50)
      ]);
      setIngredients(ingredientResponse.data || []);
      setWithdrawals(withdrawalResponse.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load stock data');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const ingredientById = useMemo(
    () => Object.fromEntries(ingredients.map((item) => [item._id, item])),
    [ingredients]
  );

  const purchaseIngredient = purchase.ingredientId ? ingredientById[purchase.ingredientId] : null;
  const withdrawalIngredient = withdrawal.ingredientId ? ingredientById[withdrawal.ingredientId] : null;

  const stats = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return {
      total: ingredients.length,
      value: ingredients.reduce((sum, item) => sum + lineValue(item), 0),
      low: ingredients.filter((item) => Number(item.quantity) <= Number(item.reorderLevel)).length,
      todayOut: withdrawals.filter((item) => new Date(item.createdAt) >= startOfDay).length
    };
  }, [ingredients, withdrawals]);

  const recordStockIn = async (event) => {
    event.preventDefault();
    const quantity = Number(purchase.quantity);

    if (!purchase.ingredientId) {
      toast.error('Select an ingredient');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Enter an amount greater than 0');
      return;
    }

    const unitCost = Number(purchase.unitCost);
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      toast.error('Unit cost must be 0 or more');
      return;
    }

    try {
      setSubmitting(true);
      const response = await ingredientService.recordPurchase(purchase.ingredientId, {
        quantity,
        unitCost,
        supplier: purchase.supplier
      });
      setIngredients((current) => current.map((item) => (item._id === response.data._id ? response.data : item)));
      setPurchase((current) => ({ ...emptyPurchase, ingredientId: current.ingredientId, supplier: current.supplier }));
      toast.success(`${response.data.name} stock increased by ${quantity} ${response.data.unit}`);
      loadData(false);
    } catch (error) {
      toast.error(error.message || 'Failed to record stock in');
    } finally {
      setSubmitting(false);
    }
  };

  const recordStockOut = async (event) => {
    event.preventDefault();
    const quantity = Number(withdrawal.quantity);

    if (!withdrawal.ingredientId) {
      toast.error('Select an ingredient');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Enter an amount greater than 0');
      return;
    }
    if (withdrawalIngredient && quantity > Number(withdrawalIngredient.quantity)) {
      toast.error(`Only ${withdrawalIngredient.quantity} ${withdrawalIngredient.unit} is available`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await ingredientService.withdraw({
        ingredientId: withdrawal.ingredientId,
        quantity,
        reason: withdrawal.reason,
        note: withdrawal.note
      });
      setWithdrawal((current) => ({ ...emptyWithdrawal, ingredientId: current.ingredientId }));
      toast.success(`${quantity} ${response.data.unit} of ${response.data.ingredientName} taken out of stock`);
      loadData(false);
    } catch (error) {
      toast.error(error.message || 'Failed to record stock out');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="stock-tab stock-loading">Loading stock...</div>;
  }

  return (
    <section className="stock-tab">
      <div className="stock-header">
        <div>
          <p className="stock-eyebrow">Supply chain</p>
          <h1>Stock in and stock out</h1>
          <p>Record deliveries going into stock and ingredients taken out for cooking or waste.</p>
        </div>
        <button className="stock-refresh" onClick={() => loadData(false)} type="button">Refresh</button>
      </div>

      <div className="stock-stats">
        <div><span>Ingredients</span><strong>{stats.total}</strong></div>
        <div><span>Stock value</span><strong>ETB {currency.format(stats.value)}</strong></div>
        <div className="stock-stat-warning"><span>Reorder soon</span><strong>{stats.low}</strong></div>
        <div><span>Withdrawn today</span><strong>{stats.todayOut}</strong></div>
      </div>

      <div className="stock-forms">
        <div className="stock-form-card">
          <h2>Stock in</h2>
          <p>Adds purchased stock. The unit cost becomes the new unit price.</p>
          <form onSubmit={recordStockIn}>
            <label htmlFor="stock-in-ingredient">Ingredient</label>
            <select
              id="stock-in-ingredient"
              value={purchase.ingredientId}
              onChange={(e) => setPurchase({ ...purchase, ingredientId: e.target.value })}
            >
              <option value="">Select ingredient</option>
              {ingredients.map((item) => (
                <option key={item._id} value={item._id}>{item.name} ({item.unit})</option>
              ))}
            </select>

            {purchaseIngredient && (
              <div className="stock-available">
                <span>Currently in stock</span>
                <strong>{purchaseIngredient.quantity} {purchaseIngredient.unit}</strong>
              </div>
            )}

            <label htmlFor="stock-in-quantity">Amount received</label>
            <input
              id="stock-in-quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={purchase.quantity}
              onChange={(e) => setPurchase({ ...purchase, quantity: e.target.value })}
            />

            <label htmlFor="stock-in-cost">Unit cost (ETB)</label>
            <input
              id="stock-in-cost"
              type="number"
              min="0"
              step="0.01"
              value={purchase.unitCost}
              onChange={(e) => setPurchase({ ...purchase, unitCost: e.target.value })}
            />

            <label htmlFor="stock-in-supplier">Supplier</label>
            <input
              id="stock-in-supplier"
              value={purchase.supplier}
              onChange={(e) => setPurchase({ ...purchase, supplier: e.target.value })}
            />

            <button type="submit" disabled={submitting}>Add to stock</button>
          </form>
        </div>

        <div className="stock-form-card stock-out-card">
          <h2>Stock out</h2>
          <p>Write the amount taken from stock. It is removed from the available quantity.</p>
          <form onSubmit={recordStockOut}>
            <label htmlFor="stock-out-ingredient">Ingredient</label>
            <select
              id="stock-out-ingredient"
              value={withdrawal.ingredientId}
              onChange={(e) => setWithdrawal({ ...withdrawal, ingredientId: e.target.value })}
            >
              <option value="">Select ingredient</option>
              {ingredients.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.unit}) — {item.quantity} available
                </option>
              ))}
            </select>

            {withdrawalIngredient && (
              <div className="stock-available">
                <span>Available now</span>
                <strong>{withdrawalIngredient.quantity} {withdrawalIngredient.unit}</strong>
              </div>
            )}

            <label htmlFor="stock-out-quantity">Amount to take out</label>
            <input
              id="stock-out-quantity"
              type="number"
              min="0.01"
              step="0.01"
              max={withdrawalIngredient ? Number(withdrawalIngredient.quantity) : undefined}
              value={withdrawal.quantity}
              onChange={(e) => setWithdrawal({ ...withdrawal, quantity: e.target.value })}
            />

            <label htmlFor="stock-out-reason">Reason</label>
            <select
              id="stock-out-reason"
              value={withdrawal.reason}
              onChange={(e) => setWithdrawal({ ...withdrawal, reason: e.target.value })}
            >
              {REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>{reason.label}</option>
              ))}
            </select>

            <label htmlFor="stock-out-note">Note (optional)</label>
            <input
              id="stock-out-note"
              value={withdrawal.note}
              onChange={(e) => setWithdrawal({ ...withdrawal, note: e.target.value })}
            />

            <button type="submit" disabled={submitting}>Take out of stock</button>
          </form>
        </div>
      </div>

      <div className="stock-section-title">
        <h2>Available stock</h2>
        <p>What is currently in the store room.</p>
      </div>
      <div className="stock-table-wrap">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Available</th>
              <th>Reorder at</th>
              <th>Unit price</th>
              <th>Stock value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((item) => {
              const low = Number(item.quantity) <= Number(item.reorderLevel);
              return (
                <tr key={item._id} className={low ? 'low-stock' : ''}>
                  <td><strong>{item.name}</strong></td>
                  <td><span className="stock-quantity">{item.quantity} {item.unit}</span></td>
                  <td>{item.reorderLevel} {item.unit}</td>
                  <td>ETB {currency.format(Number(item.unitPrice) || 0)}</td>
                  <td><span className="stock-line-total">ETB {currency.format(lineValue(item))}</span></td>
                  <td><span className={`stock-status ${low ? 'low' : 'healthy'}`}>{low ? 'Reorder soon' : 'Healthy'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {ingredients.length === 0 && <div className="stock-empty">No ingredients yet. Add them from the Inventory page.</div>}
      </div>

      <div className="stock-section-title">
        <h2>Recent stock out</h2>
        <p>Latest ingredients taken out of stock.</p>
      </div>
      <div className="stock-table-wrap">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Ingredient</th>
              <th>Amount</th>
              <th>Reason</th>
              <th>Value</th>
              <th>Left after</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((item) => (
              <tr key={item._id}>
                <td>{formatDateTime(item.createdAt)}</td>
                <td>
                  <strong>{item.ingredientName}</strong>
                  {item.note && <small className="stock-note">{item.note}</small>}
                </td>
                <td><span className="stock-quantity out">-{item.quantity} {item.unit}</span></td>
                <td>{REASON_LABELS[item.reason] || item.reason}</td>
                <td>ETB {currency.format(Number(item.totalValue) || 0)}</td>
                <td>{item.remainingAfter} {item.unit}</td>
                <td>{item.performedByName || 'Unknown'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {withdrawals.length === 0 && <div className="stock-empty">Nothing has been taken out of stock yet.</div>}
      </div>
    </section>
  );
};

export default StockTab;
