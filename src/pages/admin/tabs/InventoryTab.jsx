import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { ingredientService, menuService } from '../../../services/api';
import './InventoryTab.css';

const InventoryTab = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [ingredients, setIngredients] = useState([]);
  const [ingredientForm, setIngredientForm] = useState({ name: '', unit: 'piece', quantity: '', reorderLevel: '0', supplier: '' });
  const [purchase, setPurchase] = useState({ ingredientId: '', quantity: '', unitCost: '', supplier: '' });
  const [savingIngredient, setSavingIngredient] = useState(false);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const [response, ingredientResponse] = await Promise.all([menuService.getInventory(), ingredientService.getAll()]);
      setItems(response.data || []);
      setIngredients(ingredientResponse.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const createIngredient = async (event) => {
    event.preventDefault();
    if (!ingredientForm.name.trim() || Number(ingredientForm.quantity) < 0 || Number(ingredientForm.reorderLevel) < 0) {
      toast.error('Enter an ingredient name and valid stock values');
      return;
    }
    try {
      setSavingIngredient(true);
      const response = await ingredientService.create({ ...ingredientForm, quantity: Number(ingredientForm.quantity || 0), reorderLevel: Number(ingredientForm.reorderLevel || 0) });
      setIngredients(current => [...current, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      setIngredientForm({ name: '', unit: 'piece', quantity: '', reorderLevel: '0', supplier: '' });
      toast.success('Ingredient added');
    } catch (error) {
      toast.error(error.message || 'Failed to add ingredient');
    } finally {
      setSavingIngredient(false);
    }
  };

  const recordPurchase = async (event) => {
    event.preventDefault();
    if (!purchase.ingredientId || Number(purchase.quantity) <= 0) {
      toast.error('Select an ingredient and enter a purchase quantity');
      return;
    }
    try {
      setSavingIngredient(true);
      const response = await ingredientService.recordPurchase(purchase.ingredientId, { quantity: Number(purchase.quantity), unitCost: Number(purchase.unitCost || 0), supplier: purchase.supplier });
      setIngredients(current => current.map(item => item._id === response.data._id ? response.data : item));
      setPurchase({ ingredientId: '', quantity: '', unitCost: '', supplier: '' });
      toast.success('Purchase recorded and stock increased');
    } catch (error) {
      toast.error(error.message || 'Failed to record purchase');
    } finally {
      setSavingIngredient(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const updateItem = (id, field, value) => {
    setItems(current => current.map(item => (
      item._id === id ? { ...item, [field]: value } : item
    )));
  };

  const saveItem = async (item) => {
    const stockQuantity = Number(item.stockQuantity);
    const reorderLevel = Number(item.reorderLevel);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0 || !Number.isInteger(reorderLevel) || reorderLevel < 0) {
      toast.error('Stock values must be whole numbers of 0 or more');
      return;
    }

    try {
      setSavingId(item._id);
      const response = await menuService.updateInventory(item._id, { stockQuantity, reorderLevel });
      setItems(current => current.map(currentItem => currentItem._id === item._id ? response.data : currentItem));
      toast.success(`${item.name} inventory updated`);
    } catch (error) {
      toast.error(error.message || 'Failed to update inventory');
    } finally {
      setSavingId(null);
    }
  };

  const stats = useMemo(() => ({
    total: items.length,
    low: items.filter(item => item.stockQuantity > 0 && item.stockQuantity <= item.reorderLevel).length,
    out: items.filter(item => item.stockQuantity === 0).length,
    units: items.reduce((total, item) => total + (Number(item.stockQuantity) || 0), 0)
  }), [items]);

  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      if (filter === 'low') return item.stockQuantity > 0 && item.stockQuantity <= item.reorderLevel;
      if (filter === 'out') return item.stockQuantity === 0;
      return true;
    });

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'stock':
          aVal = Number(a.stockQuantity);
          bVal = Number(b.stockQuantity);
          break;
        case 'category':
          aVal = a.category.toLowerCase();
          bVal = b.category.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [items, filter, searchQuery, sortBy, sortOrder]);

  const toggleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return <div className="inventory-tab inventory-loading">Loading inventory...</div>;
  }

  return (
    <section className="inventory-tab">
      <div className="inventory-header">
        <div>
          <p className="inventory-eyebrow">Operations</p>
          <h1>Inventory</h1>
          <p>Monitor menu stock and keep low items visible to the kitchen team.</p>
        </div>
        <button className="inventory-refresh" onClick={loadInventory} type="button">🔄 Refresh stock</button>
      </div>

      <div className="inventory-stats">
        <div><span>Menu items</span><strong>{stats.total}</strong></div>
        <div className="inventory-stat-warning"><span>Low stock</span><strong>{stats.low}</strong></div>
        <div className="inventory-stat-danger"><span>Out of stock</span><strong>{stats.out}</strong></div>
        <div><span>Total units</span><strong>{stats.units}</strong></div>
      </div>

      <div className="inventory-toolbar">
        <div className="inventory-search">
          <input
            type="text"
            placeholder="🔍 Search by item name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="inventory-filters" role="group" aria-label="Inventory filter">
          {[
            ['all', 'All items'],
            ['low', 'Low stock'],
            ['out', 'Out of stock']
          ].map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="ingredient-panel">
        <div>
          <h2>Ingredients & supplies</h2>
          <p>Add cafe ingredients, then record each supplier purchase to increase stock.</p>
        </div>
        <form className="ingredient-form" onSubmit={createIngredient}>
          <input aria-label="Ingredient name" placeholder="Ingredient, e.g. Eggs" value={ingredientForm.name} onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })} />
          <select aria-label="Ingredient unit" value={ingredientForm.unit} onChange={e => setIngredientForm({ ...ingredientForm, unit: e.target.value })}>{['piece', 'kg', 'g', 'liter', 'ml', 'pack', 'box'].map(unit => <option key={unit}>{unit}</option>)}</select>
          <input aria-label="Opening quantity" type="number" min="0" step="0.01" placeholder="Opening qty" value={ingredientForm.quantity} onChange={e => setIngredientForm({ ...ingredientForm, quantity: e.target.value })} />
          <input aria-label="Ingredient reorder level" type="number" min="0" step="0.01" placeholder="Reorder at" value={ingredientForm.reorderLevel} onChange={e => setIngredientForm({ ...ingredientForm, reorderLevel: e.target.value })} />
          <input aria-label="Ingredient supplier" placeholder="Supplier" value={ingredientForm.supplier} onChange={e => setIngredientForm({ ...ingredientForm, supplier: e.target.value })} />
          <button type="submit" disabled={savingIngredient}>Add ingredient</button>
        </form>
        <form className="purchase-form" onSubmit={recordPurchase}>
          <select aria-label="Purchase ingredient" value={purchase.ingredientId} onChange={e => setPurchase({ ...purchase, ingredientId: e.target.value })}><option value="">Record purchase for...</option>{ingredients.map(item => <option key={item._id} value={item._id}>{item.name} ({item.unit})</option>)}</select>
          <input aria-label="Purchase quantity" type="number" min="0.01" step="0.01" placeholder="Quantity purchased" value={purchase.quantity} onChange={e => setPurchase({ ...purchase, quantity: e.target.value })} />
          <input aria-label="Purchase unit cost" type="number" min="0" step="0.01" placeholder="Unit cost" value={purchase.unitCost} onChange={e => setPurchase({ ...purchase, unitCost: e.target.value })} />
          <input aria-label="Purchase supplier" placeholder="Supplier" value={purchase.supplier} onChange={e => setPurchase({ ...purchase, supplier: e.target.value })} />
          <button type="submit" disabled={savingIngredient}>Add purchased stock</button>
        </form>
        <div className="ingredient-list">{ingredients.map(item => <div className="ingredient-row" key={item._id}><strong>{item.name}</strong><span>{item.quantity} {item.unit}</span><small>{item.quantity <= item.reorderLevel ? 'Reorder soon' : item.supplier || 'No supplier recorded'}</small></div>)}</div>
      </div>

      <div className="inventory-table-wrap">
        <table className="inventory-table">
          <thead>
            <tr>
              <th 
                onClick={() => toggleSort('name')}
                className="sortable"
                title="Click to sort"
              >
                Menu item {sortBy === 'name' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th>Availability</th>
              <th 
                onClick={() => toggleSort('stock')}
                className="sortable"
                title="Click to sort"
              >
                Stock units {sortBy === 'stock' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
              </th>
              <th>Reorder at</th>
              <th>Status</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const isOut = Number(item.stockQuantity) === 0;
              const isLow = !isOut && Number(item.stockQuantity) <= Number(item.reorderLevel);
              return (
                <tr key={item._id} className={isOut ? 'out-of-stock' : isLow ? 'low-stock' : ''}>
                  <td>
                    <div className="inventory-item-name">
                      <span className="inventory-item-icon">{isOut ? '🚫' : isLow ? '⚠️' : '✅'}</span>
                      <div><strong>{item.name}</strong><small>{item.category}</small></div>
                    </div>
                  </td>
                  <td><span className={`availability-pill ${item.isAvailable ? 'available' : 'unavailable'}`}>{item.isAvailable ? '✓ Available' : '✗ Hidden'}</span></td>
                  <td><input aria-label={`${item.name} stock units`} type="number" min="0" step="1" value={item.stockQuantity ?? 0} onChange={event => updateItem(item._id, 'stockQuantity', event.target.value)} /></td>
                  <td><input aria-label={`${item.name} reorder level`} type="number" min="0" step="1" value={item.reorderLevel ?? 0} onChange={event => updateItem(item._id, 'reorderLevel', event.target.value)} /></td>
                  <td><span className={`stock-status ${isOut ? 'out' : isLow ? 'low' : 'healthy'}`}>{isOut ? '🔴 Out of stock' : isLow ? '🟡 Reorder soon' : '🟢 Healthy'}</span></td>
                  <td><button className="inventory-save" type="button" disabled={savingId === item._id} onClick={() => saveItem(item)}>{savingId === item._id ? 'Saving...' : 'Save'}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredItems.length === 0 && <div className="inventory-empty">No items match this filter. {searchQuery && 'Try adjusting your search.'}</div>}
      </div>
    </section>
  );
};

export default InventoryTab;
