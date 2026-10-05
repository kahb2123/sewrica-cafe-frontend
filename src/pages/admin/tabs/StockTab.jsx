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

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPeriodRange = (period) => {
  const today = new Date();
  const end = toInputDate(today);
  if (period === 'daily') return { start: end, end };
  if (period === 'weekly') {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);
    return { start: toInputDate(startDate), end };
  }
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  return { start: toInputDate(startDate), end };
};

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
  const [activeView, setActiveView] = useState('manage');
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [reportRange, setReportRange] = useState(() => getPeriodRange('monthly'));
  const [movementReport, setMovementReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

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

  useEffect(() => {
    if (activeView !== 'report') return undefined;

    let cancelled = false;
    setReportLoading(true);
    ingredientService.getMovementReport(reportRange)
      .then((response) => {
        if (!cancelled) setMovementReport(response.data);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error.message || 'Failed to load stock movement report');
          setMovementReport(null);
        }
      })
      .finally(() => {
        if (!cancelled) setReportLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeView, reportRange]);

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

  const movementRows = useMemo(() => {
    const stockIn = movementReport?.stockIn || [];
    const stockOut = movementReport?.stockOut || [];
    const sumQuantities = (entries) => entries.reduce((totals, entry) => {
      const unit = entry.unit || 'unit';
      totals[unit] = (totals[unit] || 0) + (Number(entry.quantity) || 0);
      return totals;
    }, {});
    const sumValue = (entries) => entries.reduce((total, entry) => total + (Number(entry.totalValue) || 0), 0);
    const byReason = Object.fromEntries(REASONS.map(({ value }) => [
      value,
      stockOut.filter((entry) => entry.reason === value)
    ]));
    return {
      stockIn,
      stockOut,
      totalIn: sumQuantities(stockIn),
      totalOut: sumQuantities(stockOut),
      outByReason: Object.fromEntries(Object.entries(byReason).map(([reason, entries]) => [
        reason,
        { quantities: sumQuantities(entries), value: sumValue(entries), count: entries.length }
      ])),
      stockInValue: sumValue(stockIn),
      stockOutValue: sumValue(stockOut)
    };
  }, [movementReport]);

  const formatQuantities = (quantities) => {
    const entries = Object.entries(quantities || {});
    return entries.length
      ? entries.map(([unit, quantity]) => `${Number(quantity.toFixed(2))} ${unit}`).join(' · ')
      : '0';
  };

  const setPeriod = (period) => {
    setReportPeriod(period);
    if (period !== 'custom') setReportRange(getPeriodRange(period));
  };

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

  if (activeView === 'report') {
    const reasonCards = [
      { key: 'consumption', label: 'Used for cooking' },
      { key: 'waste', label: 'Wasted / spoiled' },
      { key: 'damage', label: 'Damaged' },
      { key: 'correction', label: 'Stock correction' },
      { key: 'other', label: 'Other stock out' }
    ];

    return (
      <section className="stock-tab stock-report-page">
        <div className="stock-header">
          <div>
            <p className="stock-eyebrow">Supply chain analytics</p>
            <h1>Stock movement report</h1>
            <p>Review stock received and stock removed, grouped by period and reason.</p>
          </div>
          <button className="stock-refresh" onClick={() => setActiveView('manage')} type="button">
            Back to stock management
          </button>
        </div>

        <div className="stock-report-toolbar">
          <div className="stock-period-switch" role="group" aria-label="Report period">
            {[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'custom', label: 'Custom' }
            ].map((period) => (
              <button
                key={period.value}
                type="button"
                className={reportPeriod === period.value ? 'active' : ''}
                onClick={() => setPeriod(period.value)}
              >
                {period.label}
              </button>
            ))}
          </div>
          <div className="stock-report-dates">
            <label>
              From
              <input
                type="date"
                value={reportRange.start}
                max={reportRange.end}
                onChange={(event) => {
                  setReportPeriod('custom');
                  setReportRange((current) => ({ ...current, start: event.target.value }));
                }}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={reportRange.end}
                min={reportRange.start}
                onChange={(event) => {
                  setReportPeriod('custom');
                  setReportRange((current) => ({ ...current, end: event.target.value }));
                }}
              />
            </label>
          </div>
        </div>

        {reportLoading ? (
          <div className="stock-report-state">Loading stock movement report...</div>
        ) : (
          <>
            <div className="stock-report-period-label">
              Showing {movementReport?.period?.start || reportRange.start} to {movementReport?.period?.end || reportRange.end}
            </div>

            <div className="stock-report-summary">
              <article className="stock-report-metric stock-in-metric">
                <span>Total stock in</span>
                <strong>{formatQuantities(movementRows.totalIn)}</strong>
                <small>ETB {currency.format(movementRows.stockInValue)}</small>
              </article>
              <article className="stock-report-metric stock-out-metric">
                <span>Total stock out</span>
                <strong>{formatQuantities(movementRows.totalOut)}</strong>
                <small>ETB {currency.format(movementRows.stockOutValue)}</small>
              </article>
              {reasonCards.map((reason) => {
                const totals = movementRows.outByReason[reason.key];
                return (
                  <article className="stock-report-metric" key={reason.key}>
                    <span>{reason.label}</span>
                    <strong>{formatQuantities(totals?.quantities)}</strong>
                    <small>{totals?.count || 0} movement{totals?.count === 1 ? '' : 's'} · ETB {currency.format(totals?.value || 0)}</small>
                  </article>
                );
              })}
            </div>

            <div className="stock-report-note">
              Opening stock created from now on is recorded as stock in. Older opening balances without purchase history are not included in historical movement totals.
            </div>

            <div className="stock-report-tables">
              <section className="stock-report-section">
                <div className="stock-section-title">
                  <h2>Stock received</h2>
                  <p>{movementRows.stockIn.length} recorded stock-in movements</p>
                </div>
                <div className="stock-table-wrap">
                  <table className="stock-table stock-report-table">
                    <thead>
                      <tr><th>Date</th><th>Ingredient</th><th>Quantity</th><th>Unit cost</th><th>Total value</th><th>Supplier</th><th>Recorded by</th></tr>
                    </thead>
                    <tbody>
                      {movementRows.stockIn.map((entry) => (
                        <tr key={entry._id}>
                          <td>{formatDateTime(entry.createdAt)}</td>
                          <td>{entry.ingredientName}</td>
                          <td>{entry.quantity} {entry.unit}</td>
                          <td>ETB {currency.format(entry.unitCost)}</td>
                          <td>ETB {currency.format(entry.totalValue)}</td>
                          <td>{entry.supplier || '--'}</td>
                          <td>{entry.performedByName || '--'}</td>
                        </tr>
                      ))}
                      {movementRows.stockIn.length === 0 && (
                        <tr><td colSpan="7" className="stock-report-empty">No stock received in this period.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="stock-report-section">
                <div className="stock-section-title">
                  <h2>Stock taken out</h2>
                  <p>{movementRows.stockOut.length} recorded stock-out movements</p>
                </div>
                <div className="stock-table-wrap">
                  <table className="stock-table stock-report-table">
                    <thead>
                      <tr><th>Date</th><th>Ingredient</th><th>Quantity</th><th>Reason</th><th>Total value</th><th>Recorded by</th><th>Note</th></tr>
                    </thead>
                    <tbody>
                      {movementRows.stockOut.map((entry) => (
                        <tr key={entry._id}>
                          <td>{formatDateTime(entry.createdAt)}</td>
                          <td>{entry.ingredientName}</td>
                          <td>{entry.quantity} {entry.unit}</td>
                          <td>{REASON_LABELS[entry.reason] || 'Other'}</td>
                          <td>ETB {currency.format(entry.totalValue)}</td>
                          <td>{entry.performedByName || '--'}</td>
                          <td>{entry.note || '--'}</td>
                        </tr>
                      ))}
                      {movementRows.stockOut.length === 0 && (
                        <tr><td colSpan="7" className="stock-report-empty">No stock taken out in this period.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="stock-tab">
      <div className="stock-header">
        <div>
          <p className="stock-eyebrow">Supply chain</p>
          <h1>Stock in and stock out</h1>
          <p>Add ingredients, record deliveries going into stock, and take out what is used for cooking or waste.</p>
        </div>
        <div className="stock-header-actions">
          <button className="stock-refresh" onClick={() => loadData(false)} type="button">Refresh</button>
          <button className="stock-report-open" onClick={() => setActiveView('report')} type="button">
            View stock report
          </button>
        </div>
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
