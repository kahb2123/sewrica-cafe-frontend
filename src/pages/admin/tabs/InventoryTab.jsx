import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { menuService } from '../../../services/api';
import './InventoryTab.css';

const InventoryTab = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await menuService.getInventory();
      setItems(response.data || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
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
