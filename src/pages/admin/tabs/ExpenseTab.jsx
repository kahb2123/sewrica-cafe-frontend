import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '../../../context/useLanguage';
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
  const { t } = useLanguage();
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
      toast.error(error.message || t('Failed to load expenses'));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [filters, page, t]);

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
      toast.error(t('Please fill all required fields'));
      return;
    }
    try {
      setSubmitting(true);
      const payload = { ...form, amount: Number(form.amount) };
      if (editingId) {
        await expenseService.update(editingId, payload);
        toast.success(t('Expense updated'));
      } else {
        await expenseService.create(payload);
        toast.success(t('Expense added'));
      }
      resetForm();
      loadData(false);
    } catch (error) {
      toast.error(error.message || t('Failed to save expense'));
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
      toast.success(t('Expense approved'));
      loadData(false);
    } catch (error) {
      toast.error(error.message || t('Failed to approve'));
    }
  };

  const handleDelete = async (id) => {
    if (readOnly) return;
    if (!window.confirm(t('Delete this expense?'))) return;
    try {
      setDeletingId(id);
      await expenseService.delete(id);
      toast.success(t('Expense deleted'));
      loadData(false);
    } catch (error) {
      toast.error(error.message || t('Failed to delete'));
    } finally {
      setDeletingId(null);
    }
  };

  const totals = stats.totals || stats;

  if (loading) return <div className="expense-tab expense-loading">{t('Loading expenses...')}</div>;

  return (
    <section className="expense-tab">
      <div className="expense-header">
        <div>
          <p className="expense-eyebrow">{t('Finance')}</p>
          <h1>{t('Expenses')}</h1>
          <p>{t('Track all business expenses by category, payment method, and date range.')}</p>
        </div>
        <button className="expense-refresh" onClick={() => loadData(false)} type="button">{t('Refresh')}</button>
      </div>

      <div className="expense-stats">
        <div><span>{t('Total')}</span><strong>ETB {CURRENCY.format(totals.totalAmount || 0)}</strong></div>
        <div><span>{t('Entries')}</span><strong>{totals.count || 0}</strong></div>
        <div className="expense-stat-success"><span>{t('Approved')}</span><strong>{totals.approved || 0}</strong></div>
        <div className="expense-stat-warning"><span>{t('Pending')}</span><strong>{(totals.count || 0) - (totals.approved || 0)}</strong></div>
      </div>

      {!readOnly && <div className="expense-form-card">
        <h2>{t(editingId ? 'Edit Expense' : 'Add Expense')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="expense-form-row">
            <div className="expense-form-group">
              <label htmlFor="expense-category">{t('Category')}</label>
              <select id="expense-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                <option value="">{t('Select category')}</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{t(c.label)}</option>)}
              </select>
            </div>
            <div className="expense-form-group">
              <label htmlFor="expense-description">{t('Description')}</label>
              <input id="expense-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('e.g. Electricity bill - July')} required />
            </div>
          </div>

          <div className="expense-form-row">
            <div className="expense-form-group">
              <label htmlFor="expense-amount">{t('Amount (ETB)')}</label>
              <input id="expense-amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="expense-form-group">
              <label htmlFor="expense-payment">{t('Payment Method')}</label>
              <select id="expense-payment" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t(m.replace('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase()))}</option>)}
              </select>
            </div>
            <div className="expense-form-group">
              <label htmlFor="expense-date">{t('Date')}</label>
              <input id="expense-date" type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} required />
            </div>
          </div>

          <div className="expense-form-row">
            <div className="expense-form-group">
              <label htmlFor="expense-supplier">{t('Supplier / Vendor')}</label>
              <input id="expense-supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder={t('Optional')} />
            </div>
            <div className="expense-form-group">
              <label htmlFor="expense-receipt">{t('Receipt #')}</label>
              <input id="expense-receipt" value={form.receiptNumber} onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })} placeholder={t('Optional')} />
            </div>
          </div>

          <div className="expense-form-group expense-full-width">
            <label htmlFor="expense-notes">{t('Notes')}</label>
            <textarea id="expense-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows="2" placeholder={t('Additional details...')} />
          </div>

          <div className="expense-form-actions">
            <button type="submit" disabled={submitting}>{submitting ? t('Saving...') : (editingId ? t('Update Expense') : t('Add Expense'))}</button>
            {editingId && <button type="button" className="btn-cancel" onClick={resetForm}>{t('Cancel')}</button>}
          </div>
        </form>
      </div>}

      <div className="expense-filters">
        <div className="filter-group">
          <label>{t('Date Range')}</label>
          <div className="date-range">
            <input type="date" value={filters.start} max={filters.end} onChange={(e) => handleFilterChange('start', e.target.value)} />
            <span>{t('to')}</span>
            <input type="date" value={filters.end} min={filters.start} onChange={(e) => handleFilterChange('end', e.target.value)} />
          </div>
        </div>
        <div className="filter-group">
          <label>{t('Category')}</label>
          <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
            <option value="">{t('All')}</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{t(c.label)}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>{t('Status')}</label>
          <select value={filters.approved} onChange={(e) => handleFilterChange('approved', e.target.value)}>
            <option value="">{t('All')}</option>
            <option value="true">{t('Approved')}</option>
            <option value="false">{t('Pending')}</option>
          </select>
        </div>
      </div>

      <div className="expense-table-wrap">
        <table className="expense-table">
          <thead>
            <tr>
              <th>{t('Date')}</th>
              <th>{t('Category')}</th>
              <th>{t('Description')}</th>
              <th>{t('Amount')}</th>
              <th>{t('Payment')}</th>
              <th>{t('Supplier')}</th>
              <th>{t('Status')}</th>
              {!readOnly && <th><span className="sr-only">{t('Actions')}</span></th>}
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense._id} className={!expense.approved ? 'pending' : ''}>
                <td>{formatDate(expense.expenseDate)}</td>
                <td><span className="expense-category">{t(CATEGORY_LABELS[expense.category] || expense.category)}</span></td>
                <td>
                  <strong>{expense.description}</strong>
                  {expense.notes && <small className="expense-note">{expense.notes}</small>}
                </td>
                <td className="expense-amount">ETB {CURRENCY.format(expense.amount)}</td>
                <td>{t(expense.paymentMethod?.replace('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase()))}</td>
                <td>{expense.supplier || '-'}</td>
                <td><span className={`expense-status ${expense.approved ? 'approved' : 'pending'}`}>{expense.approved ? `✓ ${t('Approved')}` : `⏳ ${t('Pending')}`}</span></td>
                {!readOnly && <td>
                  <div className="expense-actions">
                    {!expense.approved && (
                      <button className="btn-approve" onClick={() => handleApprove(expense._id)}>{t('Approve')}</button>
                    )}
                    <button className="btn-edit" onClick={() => handleEdit(expense)} disabled={deletingId === expense._id}>{t('Edit')}</button>
                    <button className="btn-delete" onClick={() => handleDelete(expense._id)} disabled={deletingId === expense._id}>{deletingId === expense._id ? '...' : t('Delete')}</button>
                  </div>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <div className="expense-empty">{readOnly
          ? t('No expenses found.')
          : t('No expenses found. Add your first expense above.')}</div>}
      </div>

      {totalPages > 1 && (
        <div className="expense-pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t('Previous')}</button>
          <span>{t('Page')} {page} {t('of')} {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{t('Next')}</button>
        </div>
      )}

      {stats.byCategory.length > 0 && (
        <div className="expense-breakdown">
          <h3>{t('Expenses by Category')}</h3>
          <div className="breakdown-list">
            {stats.byCategory.map((row) => (
              <div key={row._id} className="breakdown-item">
                <div className="breakdown-header">
                  <span className="breakdown-name">{t(CATEGORY_LABELS[row._id] || row._id)}</span>
                  <span className="breakdown-stats"><strong>{row.count}</strong> {t('entries')} · ETB {CURRENCY.format(row.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.byPaymentMethod.length > 0 && (
        <div className="expense-breakdown">
          <h3>{t('Expenses by Payment Method')}</h3>
          <div className="breakdown-list">
            {stats.byPaymentMethod.map((row) => (
              <div key={row._id} className="breakdown-item">
                <div className="breakdown-header">
                  <span className="breakdown-name">{t(row._id.replace('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase()))}</span>
                  <span className="breakdown-stats"><strong>{row.count}</strong> {t('entries')} · ETB {CURRENCY.format(row.total)}</span>
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