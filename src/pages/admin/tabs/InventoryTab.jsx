import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ingredientService } from '../../../services/api';
import './InventoryTab.css';

const units = ['piece', 'kg', 'g', 'liter', 'ml', 'pack', 'box'];

const InventoryTab = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredientForm, setIngredientForm] = useState({ name: '', unit: 'piece', quantity: '', reorderLevel: '0', supplier: '' });
  const [purchase, setPurchase] = useState({ ingredientId: '', quantity: '', unitCost: '', supplier: '' });

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const response = await ingredientService.getAll();
      setIngredients(response.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadIngredients(); }, []);

  const createIngredient = async (event) => {
    event.preventDefault();
    if (!ingredientForm.name.trim() || Number(ingredientForm.quantity) < 0 || Number(ingredientForm.reorderLevel) < 0) {
      toast.error('Enter an ingredient name and valid stock values');
      return;
    }
    try {
      const response = await ingredientService.create({ ...ingredientForm, quantity: Number(ingredientForm.quantity || 0), reorderLevel: Number(ingredientForm.reorderLevel || 0) });
      setIngredients(current => [...current, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      setIngredientForm({ name: '', unit: 'piece', quantity: '', reorderLevel: '0', supplier: '' });
      toast.success('Ingredient added');
    } catch (error) { toast.error(error.message || 'Failed to add ingredient'); }
  };

  const recordPurchase = async (event) => {
    event.preventDefault();
    if (!purchase.ingredientId || Number(purchase.quantity) <= 0) {
      toast.error('Select an ingredient and enter a purchase quantity');
      return;
    }
    try {
      const response = await ingredientService.recordPurchase(purchase.ingredientId, { quantity: Number(purchase.quantity), unitCost: Number(purchase.unitCost || 0), supplier: purchase.supplier });
      setIngredients(current => current.map(item => item._id === response.data._id ? response.data : item));
      setPurchase({ ingredientId: '', quantity: '', unitCost: '', supplier: '' });
      toast.success('Purchase recorded and stock increased');
    } catch (error) { toast.error(error.message || 'Failed to record purchase'); }
  };

  const updateIngredient = (id, field, value) => setIngredients(current => current.map(item => item._id === id ? { ...item, [field]: value } : item));

  const saveIngredient = async (ingredient) => {
    const quantity = Number(ingredient.quantity);
    const reorderLevel = Number(ingredient.reorderLevel);
    if (!Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(reorderLevel) || reorderLevel < 0) {
      toast.error('Stock values must be 0 or greater');
      return;
    }
    try {
      setSavingId(ingredient._id);
      const response = await ingredientService.update(ingredient._id, { quantity, reorderLevel, supplier: ingredient.supplier });
      setIngredients(current => current.map(item => item._id === ingredient._id ? response.data : item));
      toast.success(`${ingredient.name} updated`);
    } catch (error) { toast.error(error.message || 'Failed to update ingredient'); }
    finally { setSavingId(null); }
  };

  const stats = useMemo(() => ({
    total: ingredients.length,
    low: ingredients.filter(item => Number(item.quantity) <= Number(item.reorderLevel)).length,
    units: ingredients.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  }), [ingredients]);

  const filteredIngredients = useMemo(() => ingredients.filter(item => {
    const matchesFilter = filter === 'all' || (filter === 'low' && Number(item.quantity) <= Number(item.reorderLevel)) || (filter === 'healthy' && Number(item.quantity) > Number(item.reorderLevel));
    const query = searchQuery.trim().toLowerCase();
    return matchesFilter && (!query || item.name.toLowerCase().includes(query) || (item.supplier || '').toLowerCase().includes(query));
  }), [ingredients, filter, searchQuery]);

  if (loading) return <div className="inventory-tab inventory-loading">Loading ingredients...</div>;

  return (
    <section className="inventory-tab">
      <div className="inventory-header">
        <div><p className="inventory-eyebrow">Supply chain</p><h1>Ingredients inventory</h1><p>Manage purchased cafe ingredients and record supplier deliveries.</p></div>
        <button className="inventory-refresh" onClick={loadIngredients} type="button">Refresh ingredients</button>
      </div>

      <div className="inventory-stats">
        <div><span>Ingredients</span><strong>{stats.total}</strong></div>
        <div className="inventory-stat-warning"><span>Reorder soon</span><strong>{stats.low}</strong></div>
        <div><span>Total quantity</span><strong>{stats.units}</strong></div>
      </div>

      <div className="ingredient-panel">
        <div><h2>Add ingredient</h2><p>Create items such as eggs, flour, oil, or coffee.</p></div>
        <form className="ingredient-form" onSubmit={createIngredient}>
          <input aria-label="Ingredient name" placeholder="Ingredient name" value={ingredientForm.name} onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })} />
          <select aria-label="Ingredient unit" value={ingredientForm.unit} onChange={e => setIngredientForm({ ...ingredientForm, unit: e.target.value })}>{units.map(unit => <option key={unit}>{unit}</option>)}</select>
          <input aria-label="Opening quantity" type="number" min="0" step="0.01" placeholder="Opening quantity" value={ingredientForm.quantity} onChange={e => setIngredientForm({ ...ingredientForm, quantity: e.target.value })} />
          <input aria-label="Reorder level" type="number" min="0" step="0.01" placeholder="Reorder level" value={ingredientForm.reorderLevel} onChange={e => setIngredientForm({ ...ingredientForm, reorderLevel: e.target.value })} />
          <input aria-label="Supplier" placeholder="Supplier" value={ingredientForm.supplier} onChange={e => setIngredientForm({ ...ingredientForm, supplier: e.target.value })} />
          <button type="submit">Add ingredient</button>
        </form>
        <div><h2>Record purchase</h2><p>Purchased quantities are added to the selected ingredient stock.</p></div>
        <form className="purchase-form" onSubmit={recordPurchase}>
          <select aria-label="Purchase ingredient" value={purchase.ingredientId} onChange={e => setPurchase({ ...purchase, ingredientId: e.target.value })}><option value="">Select ingredient</option>{ingredients.map(item => <option key={item._id} value={item._id}>{item.name} ({item.unit})</option>)}</select>
          <input aria-label="Purchase quantity" type="number" min="0.01" step="0.01" placeholder="Quantity purchased" value={purchase.quantity} onChange={e => setPurchase({ ...purchase, quantity: e.target.value })} />
          <input aria-label="Unit cost" type="number" min="0" step="0.01" placeholder="Unit cost" value={purchase.unitCost} onChange={e => setPurchase({ ...purchase, unitCost: e.target.value })} />
          <input aria-label="Purchase supplier" placeholder="Supplier" value={purchase.supplier} onChange={e => setPurchase({ ...purchase, supplier: e.target.value })} />
          <button type="submit">Add purchased stock</button>
        </form>
      </div>

      <div className="inventory-toolbar"><input className="search-input" placeholder="Search ingredients or supplier..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /><div className="inventory-filters" role="group" aria-label="Ingredient filter"><button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button><button type="button" className={filter === 'low' ? 'active' : ''} onClick={() => setFilter('low')}>Reorder soon</button><button type="button" className={filter === 'healthy' ? 'active' : ''} onClick={() => setFilter('healthy')}>Healthy</button></div></div>
      <div className="inventory-table-wrap"><table className="inventory-table"><thead><tr><th>Ingredient</th><th>Quantity</th><th>Reorder at</th><th>Supplier</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredIngredients.map(item => { const low = Number(item.quantity) <= Number(item.reorderLevel); return <tr key={item._id} className={low ? 'low-stock' : ''}><td><strong>{item.name}</strong><small>{item.unit}</small></td><td><input aria-label={`${item.name} quantity`} type="number" min="0" step="0.01" value={item.quantity} onChange={e => updateIngredient(item._id, 'quantity', e.target.value)} /></td><td><input aria-label={`${item.name} reorder level`} type="number" min="0" step="0.01" value={item.reorderLevel} onChange={e => updateIngredient(item._id, 'reorderLevel', e.target.value)} /></td><td>{item.supplier || 'Not recorded'}</td><td><span className={`stock-status ${low ? 'low' : 'healthy'}`}>{low ? 'Reorder soon' : 'Healthy'}</span></td><td><button className="inventory-save" type="button" disabled={savingId === item._id} onClick={() => saveIngredient(item)}>{savingId === item._id ? 'Saving...' : 'Save'}</button></td></tr>; })}</tbody></table>{filteredIngredients.length === 0 && <div className="inventory-empty">No ingredients match this filter.</div>}</div>
    </section>
  );
};

export default InventoryTab;
