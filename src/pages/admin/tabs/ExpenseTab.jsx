import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { expenseService } from '../../../services/api';
import './ExpenseTab.css';

const CURRENCY = new Intl.NumberFormat('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CATEGORIES = [
  { value: 'ingredients', label: 'Ingredients' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'rent', label: 'Rent' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'staff', label: 'Staff' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'other', label: 'Other' }
];
const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'mobile_money'];

const toInputDate = (date) => date.toISOString().split('T')[0];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return toInputDate(d); };
const formatDate = (value) => { if (!value) return '--'; const d = new Date(value); return d.toLocaleDateString(); };

const emptyExpense = { category: '', description: '', amount: '', currency: 'ETB', paymentMethod: 'cash', supplier: '', receiptNumber: '', expenseDate: toInputDate(new Date()), notes: '' };

const ExpenseTab = ({ readOnly = false }) => {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ totalAmount: 0, count: 0, approved: 0, byCategory: [], byPaymentMethod: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(emptyExpense);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ start: daysAgo(29), end: daysAgo(0), category: '', approved: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [expenseResponse, statsResponse] = await Promise.all([
        expenseService.getAll({ ...filters, page, limit: 50 }),
        expenseService.getStats({ start: filters.start, end: filters.end })
      ]);
      setExpenses(expenseResponse.data || []);
      setTotalPages(expenseResponse.pagination?.pages || 1);
      setStats(statsResponse.data || { totalAmount: 0, count: 0, approved: 0, byCategory: [], byPaymentMethod: [] });
    } catch (error) {
      toast.error(error.message || 'Failed to load expenses');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFilterChange = (field, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => { setForm(emptyExpense); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!form.category || !form.description?.trim() || !form.amount || Number(form.amount) <= 0) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const payload = { ...form, amount: Number(form.amount) };
      if (editingId) {
        await expenseService.update(editingId, payload);
        toast.success('Expense updated');
      } else {
        await expenseService.create(payload);
        toast.success('Expense added');
      }
      resetForm();
      loadData(false);
    } catch (error) {
      toast.error(error.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense) => {
    if (readOnly) return;
    setEditingId(expense._id);
    setForm({
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      currency: expense.currency || 'ETB',
      paymentMethod: expense.paymentMethod || 'cash',
      supplier: expense.supplier || '',
      receiptNumber: expense.receiptNumber || '',
      expenseDate: toInputDate(new Date(expense.expenseDate)),
      notes: expense.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApprove = async (id) => {
    if (readOnly) return;
    try {
      await expenseService.approve(id);
      toast.success('Expense approved');
      loadData(false);
    } catch (error) {
      toast.error(error.message || 'Failed to approve');
    }
  };

  const handleDelete = async (id) => {
    if (readOnly) return;
    if (!window.confirm('Delete this expense?')) return;
    try {
      setDeletingId(id);
      await expenseService.delete(id);
      toast.success('Expense deleted');
      loadData(false);
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const totals = stats.totals || stats;

  if (loading) return <div className="expense-tab expense-loading">Loading expenses...</div>;

  return (
    <section className="expense-tab">
      <div className="expense-header">
        <div>
          <p className="expense-eyebrow">Finance</p>
          <h1>Expenses</h1>
          <p>Track all business expenses by category, payment method, and date range.</p>
        </div>
        <button className="expense-refresh" onClick={() => loadData(false)} type="button">Refresh</button>
      </div>

      <div className="expense-stats">
        <div><span>Total</span><strong>ETB {CURRENCY.format(totals.totalAmount || 0)}</strong></div>
        <div><span>Entries</span><strong>{totals.count || 0}</strong></div>
        <div className="expense-stat-success"><span>Approved</span><strong>{totals.approved || 0}</strong></div>
        <div className="expense-stat-warning"><span>Pending</span><strong>{(totals.count || 0) - (totals.approved || 0)}</strong></div>
      </div>

      {!readOnly && <div className="expense-form-card">
        <h2>{editingId ? 'Edit Expense' : 'Add Expense'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="expense-form-row">
            <div className="expense-form-group">
              <label htmlFor="expense-category">Category</label>
              <select id="expense-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="expense-form-group">
              <label htmlFor="expense-description">Description</label>
              <input id="expense-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Electricity bill - July" required />
            </div>
          </div>

          <div className="expense-form-row">
            <div className="expense-form-group">
              <label htmlFor="expense-amount">Amount (ETB)</label>
              <input id="expense-amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="expense-form-group">
              <label htmlFor="expense-payment">Payment Method</label>
              <select id="expense-payment" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="expense-form-group">
              <label htmlFor="expense-date">Date</label>
              <input id="expense-date" type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} required />
            </div>
          </div>

          <div className="expense-form-row">
            <div className="expense-form-group">
              <label htmlFor="expense-supplier">Supplier / Vendor</label>
              <input id="expense-supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Optional" />
            </div>
            <div className="expense-form-group">
              <label htmlFor="expense-receipt">Receipt #</label>
              <input id="expense-receipt" value={form.receiptNumber} onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })} placeholder="Optional" />
            </div>
          </div>

          <div className="expense-form-group expense-full-width">
            <label htmlFor="expense-notes">Notes</label>
            <textarea id="expense-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows="2" placeholder="Additional details..." />
          </div>

          <div className="expense-form-actions">
            <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : (editingId ? 'Update Expense' : 'Add Expense')}</button>
            {editingId && <button type="button" className="btn-cancel" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>}

      <div className="expense-filters">
        <div className="filter-group">
          <label>Date Range</label>
          <div className="date-range">
            <input type="date" value={filters.start} max={filters.end} onChange={(e) => handleFilterChange('start', e.target.value)} />
            <span>to</span>
            <input type="date" value={filters.end} min={filters.start} onChange={(e) => handleFilterChange('end', e.target.value)} />
          </div>
        </div>
        <div className="filter-group">
          <label>Category</label>
          <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
            <option value="">All</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select value={filters.approved} onChange={(e) => handleFilterChange('approved', e.target.value)}>
            <option value="">All</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>
        </div>
      </div>

      <div className="expense-table-wrap">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Supplier</th>
              <th>Status</th>
              {!readOnly && <th><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense._id} className={!expense.approved ? 'pending' : ''}>
                <td>{formatDate(expense.expenseDate)}</td>
                <td><span className="expense-category">{CATEGORY_LABELS[expense.category] || expense.category}</span></td>
                <td>
                  <strong>{expense.description}</strong>
                  {expense.notes && <small className="expense-note">{expense.notes}</small>}
                </td>
                <td className="expense-amount">ETB {CURRENCY.format(expense.amount)}</td>
                <td>{expense.paymentMethod?.replace('_', ' ')}</td>
                <td>{expense.supplier || '-'}</td>
                <td><span className={`expense-status ${expense.approved ? 'approved' : 'pending'}`}>{expense.approved ? '✓ Approved' : '⏳ Pending'}</span></td>
                {!readOnly && <td>
                  <div className="expense-actions">
                    {!expense.approved && (
                      <button className="btn-approve" onClick={() => handleApprove(expense._id)}>Approve</button>
                    )}
                    <button className="btn-edit" onClick={() => handleEdit(expense)} disabled={deletingId === expense._id}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(expense._id)} disabled={deletingId === expense._id}>{deletingId === expense._id ? '...' : 'Delete'}</button>
                  </div>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <div className="expense-empty">{readOnly
          ? 'No expenses found.'
          : 'No expenses found. Add your first expense above.'}</div>}
      </div>

      {totalPages > 1 && (
        <div className="expense-pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
        </div>
      )}

      {stats.byCategory.length > 0 && (
        <div className="expense-breakdown">
          <h3>Expenses by Category</h3>
          <div className="breakdown-list">
            {stats.byCategory.map((row) => (
              <div key={row._id} className="breakdown-item">
                <div className="breakdown-header">
                  <span className="breakdown-name">{CATEGORY_LABELS[row._id] || row._id}</span>
                  <span className="breakdown-stats"><strong>{row.count}</strong> entries · ETB {CURRENCY.format(row.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.byPaymentMethod.length > 0 && (
        <div className="expense-breakdown">
          <h3>Expenses by Payment Method</h3>
          <div className="breakdown-list">
            {stats.byPaymentMethod.map((row) => (
              <div key={row._id} className="breakdown-item">
                <div className="breakdown-header">
                  <span className="breakdown-name">{row._id.replace('_', ' ')}</span>
                  <span className="breakdown-stats"><strong>{row.count}</strong> entries · ETB {CURRENCY.format(row.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ExpenseTab;