import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ingredientService } from '../../../services/api';
import './StockTab.css';

const currency = new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const UNITS = ['piece', 'kg', 'g', 'liter', 'ml', 'pack', 'box'];
const NEW_INGREDIENT = '__new__';

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
const emptyNewIngredient = { name: '', unit: 'piece', quantity: '', unitPrice: '', reorderLevel: '0', supplier: '' };

const lineValue = (item) => (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
const isValidAmount = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;

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
  const [savingId, setSavingId] = useState(null);
  const [purchase, setPurchase] = useState(emptyPurchase);
  const [withdrawal, setWithdrawal] = useState(emptyWithdrawal);
  const [newIngredient, setNewIngredient] = useState(emptyNewIngredient);

  const creatingNew = purchase.ingredientId === NEW_INGREDIENT;

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

  const purchaseIngredient = creatingNew ? null : ingredientById[purchase.ingredientId] || null;
  const withdrawalIngredient = withdrawal.ingredientId ? ingredientById[withdrawal.ingredientId] : null;

  const stats = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return {
      total: ingredients.length,
      totalPrice: ingredients.reduce((sum, item) => sum + lineValue(item), 0),
      low: ingredients.filter((item) => Number(item.quantity) <= Number(item.reorderLevel)).length,
      todayOut: withdrawals.filter((item) => new Date(item.createdAt) >= startOfDay).length
    };
  }, [ingredients, withdrawals]);

  const recordStockIn = async (event) => {
    event.preventDefault();

    if (creatingNew) {
      if (!newIngredient.name.trim()) {
        toast.error('Enter a name for the new ingredient');
        return;
      }
      if (!isValidAmount(newIngredient.quantity) || !isValidAmount(newIngredient.unitPrice) || !isValidAmount(newIngredient.reorderLevel)) {
        toast.error('Enter valid quantity, price and reorder level values');
        return;
      }
      try {
        setSubmitting(true);
        const response = await ingredientService.create({
          name: newIngredient.name.trim(),
          unit: newIngredient.unit,
          quantity: Number(newIngredient.quantity || 0),
          unitPrice: Number(newIngredient.unitPrice || 0),
          reorderLevel: Number(newIngredient.reorderLevel || 0),
          supplier: newIngredient.supplier
        });
        setIngredients((current) => [...current, response.data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewIngredient(emptyNewIngredient);
        setPurchase(emptyPurchase);
        toast.success(`${response.data.name} added to stock`);
        loadData(false);
      } catch (error) {
        toast.error(error.message || 'Failed to add the ingredient');
      } finally {
        setSubmitting(false);
      }
      return;
    }

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

  const patchIngredientLocal = (id, field, value) => {
    setIngredients((current) => current.map((item) => (item._id === id ? { ...item, [field]: value } : item)));
  };

  const saveIngredient = async (item) => {
    const unitPrice = Number(item.unitPrice);
    const reorderLevel = Number(item.reorderLevel);
    if (!isValidAmount(unitPrice) || !isValidAmount(reorderLevel)) {
      toast.error('Price and reorder level must be 0 or more');
      return;
    }
    try {
      setSavingId(item._id);
      const response = await ingredientService.update(item._id, { unitPrice, reorderLevel, supplier: item.supplier });
      setIngredients((current) => current.map((entry) => (entry._id === item._id ? response.data : entry)));
      toast.success(`${item.name} updated`);
    } catch (error) {
      toast.error(error.message || 'Failed to update ingredient');
    } finally {
      setSavingId(null);
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
          <p>Add ingredients, record deliveries going into stock, and take out what is used for cooking or waste.</p>
        </div>
        <button className="stock-refresh" onClick={() => loadData(false)} type="button">Refresh</button>
      </div>

      <div className="stock-stats">
        <div><span>Ingredients</span><strong>{stats.total}</strong></div>
        <div><span>Total price</span><strong>ETB {currency.format(stats.totalPrice)}</strong></div>
        <div className="stock-stat-warning"><span>Reorder soon</span><strong>{stats.low}</strong></div>
        <div><span>Withdrawn today</span><strong>{stats.todayOut}</strong></div>
      </div>

      <div className="stock-forms">
        <div className="stock-form-card">
          <h2>Stock in</h2>
          <p>Pick an existing ingredient to add stock, or add a new ingredient with its opening stock.</p>
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
              <option value={NEW_INGREDIENT}>+ Add new ingredient</option>
            </select>

            {creatingNew ? (
              <>
                <label htmlFor="new-ingredient-name">New ingredient name</label>
                <input
                  id="new-ingredient-name"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  placeholder="e.g. Berbere spice"
                />

                <label htmlFor="new-ingredient-unit">Unit</label>
                <select
                  id="new-ingredient-unit"
                  value={newIngredient.unit}
                  onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                >
                  {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                </select>

                <label htmlFor="new-ingredient-quantity">Opening quantity</label>
                <input
                  id="new-ingredient-quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newIngredient.quantity}
                  onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                />

                <label htmlFor="new-ingredient-price">Unit price (ETB)</label>
                <input
                  id="new-ingredient-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newIngredient.unitPrice}
                  onChange={(e) => setNewIngredient({ ...newIngredient, unitPrice: e.target.value })}
                />

                <label htmlFor="new-ingredient-reorder">Reorder level</label>
                <input
                  id="new-ingredient-reorder"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newIngredient.reorderLevel}
                  onChange={(e) => setNewIngredient({ ...newIngredient, reorderLevel: e.target.value })}
                />

                <label htmlFor="new-ingredient-supplier">Supplier</label>
                <input
                  id="new-ingredient-supplier"
                  value={newIngredient.supplier}
                  onChange={(e) => setNewIngredient({ ...newIngredient, supplier: e.target.value })}
                />

                <button type="submit" disabled={submitting}>Add ingredient to stock</button>
              </>
            ) : (
              <>
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
              </>
            )}
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
        <p>What is currently in the store room. Unit price and reorder level can be edited here.</p>
      </div>
      <div className="stock-table-wrap">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Available</th>
              <th>Reorder at</th>
              <th>Unit price (ETB)</th>
              <th>Total price (ETB)</th>
              <th>Status</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((item) => {
              const low = Number(item.quantity) <= Number(item.reorderLevel);
              return (
                <tr key={item._id} className={low ? 'low-stock' : ''}>
                  <td>
                    <strong>{item.name}</strong>
                    <small className="stock-unit">{item.unit}</small>
                  </td>
                  <td><span className="stock-quantity">{item.quantity} {item.unit}</span></td>
                  <td>
                    <input
                      className="stock-inline-input"
                      aria-label={`${item.name} reorder level`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.reorderLevel}
                      onChange={(e) => patchIngredientLocal(item._id, 'reorderLevel', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="stock-inline-input"
                      aria-label={`${item.name} unit price`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice ?? 0}
                      onChange={(e) => patchIngredientLocal(item._id, 'unitPrice', e.target.value)}
                    />
                  </td>
                  <td><span className="stock-line-total">ETB {currency.format(lineValue(item))}</span></td>
                  <td><span className={`stock-status ${low ? 'low' : 'healthy'}`}>{low ? 'Reorder soon' : 'Healthy'}</span></td>
                  <td>
                    <button
                      className="stock-save"
                      type="button"
                      disabled={savingId === item._id}
                      onClick={() => saveIngredient(item)}
                    >
                      {savingId === item._id ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {ingredients.length > 0 && (
            <tfoot>
              <tr className="stock-total-row">
                <td colSpan="4">Total price of all stock</td>
                <td><span className="stock-line-total">ETB {currency.format(stats.totalPrice)}</span></td>
                <td colSpan="2" />
              </tr>
            </tfoot>
          )}
        </table>
        {ingredients.length === 0 && (
          <div className="stock-empty">No ingredients yet. Use the Stock in form above to add your first one.</div>
        )}
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
