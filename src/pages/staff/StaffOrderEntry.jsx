import React, { useEffect, useMemo, useState } from 'react';
import { menuService, orderService, getImageUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/useLanguage';
import { toast } from 'react-toastify';
import './StaffOrderEntry.css';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'tele_birr', label: 'Telebirr' },
  { value: 'bank', label: 'Bank transfer' }
];

const StaffOrderEntry = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isDeliveryStaff = user?.role?.toLowerCase() === 'delivery';
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState({});
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [deliveryMethod, setDeliveryMethod] = useState(isDeliveryStaff ? 'delivery' : 'dine-in');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [deliveryAddress, setDeliveryAddress] = useState({ street: '', area: '', city: 'Addis Ababa' });
  const [tableNumber, setTableNumber] = useState('');
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    menuService.getAllItems()
      .then((response) => {
        const items = Array.isArray(response?.data) ? response.data : [];
        if (active) setMenuItems(items.filter((item) => item.isAvailable !== false));
      })
      .catch((error) => {
        console.error('Failed to load menu for staff order entry', error);
        toast.error(error.message || 'Failed to load menu items');
      })
      .finally(() => {
        if (active) setLoadingMenu(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedItems = useMemo(
    () => Object.values(cart),
    [cart]
  );
  const itemCount = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const filteredItems = menuItems.filter((item) =>
    item.name?.toLowerCase().includes(search.trim().toLowerCase()) ||
    item.nameAm?.toLowerCase().includes(search.trim().toLowerCase())
  );

  const addItem = (item) => {
    setCart((current) => ({
      ...current,
      [item._id]: current[item._id]
        ? { ...current[item._id], quantity: current[item._id].quantity + 1 }
        : { _id: item._id, name: item.name, nameAm: item.nameAm, price: Number(item.price) || 0, image: item.image, quantity: 1 }
    }));
  };

  const changeQuantity = (itemId, change) => {
    setCart((current) => {
      const item = current[itemId];
      if (!item) return current;
      const quantity = item.quantity + change;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[itemId];
        return next;
      }
      return { ...current, [itemId]: { ...item, quantity } };
    });
  };

  const updateCustomerInfo = (event) => {
    setCustomerInfo((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const updateDeliveryAddress = (event) => {
    setDeliveryAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!selectedItems.length) {
      toast.warning('Select at least one menu item');
      return;
    }
    if (deliveryMethod === 'delivery' && !deliveryAddress.street.trim()) {
      toast.warning('Enter the delivery address');
      return;
    }
    if (deliveryMethod === 'dine-in' && !tableNumber.trim()) {
      toast.warning('Enter a table number for dine-in orders');
      return;
    }

    setSubmitting(true);
    try {
      const response = await orderService.createStaffOrder({
        items: selectedItems.map(({ _id, quantity }) => ({ menuItem: _id, quantity })),
        paymentMethod,
        deliveryMethod,
        customerInfo,
        deliveryAddress,
        tableNumber
      });
      setCart({});
      setShowMobileSummary(false);
      setCustomerInfo({ name: '', phone: '' });
      setDeliveryAddress({ street: '', area: '', city: 'Addis Ababa' });
      setTableNumber('');
      toast.success(`Order #${response.order.orderNumber} placed and paid · ETB ${Number(response.order.totalAmount).toFixed(2)}`);
    } catch (error) {
      console.error('Failed to place staff order', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="staff-order-entry">
      <header className="staff-order-header">
        <div>
          <h1>{t('Quick Order')}</h1>
          <p>{t('Tap menu items to build an order. Submit once when it is ready.')}</p>
        </div>
        <label className="staff-order-search">
          <span>{t('Search menu')}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Find food or drink')}
          />
        </label>
      </header>

      <button
        className="staff-order-summary-toggle"
        type="button"
        aria-expanded={showMobileSummary}
        aria-controls="staff-order-summary"
        onClick={() => setShowMobileSummary((current) => !current)}
      >
        {showMobileSummary
          ? `← ${t('Back to menu')}`
          : `${t('Order summary')} · ${itemCount} ${itemCount === 1 ? t('item') : t('items')} · ETB ${total.toFixed(2)}`}
      </button>

      <div className={`staff-order-layout${showMobileSummary ? ' show-mobile-summary' : ''}`}>
        <div className="staff-order-menu" aria-label={t('Available menu items')}>
          {loadingMenu ? (
            <p className="staff-order-message">{t('Loading menu...')}</p>
          ) : filteredItems.length ? (
            filteredItems.map((item) => (
              <button
                className="staff-menu-item"
                key={item._id}
                type="button"
                onClick={() => addItem(item)}
              >
                {getImageUrl(item.image) ? (
                  <img src={getImageUrl(item.image)} alt="" />
                ) : (
                  <span className="staff-menu-item-placeholder" aria-hidden="true">🍽️</span>
                )}
                <span className="staff-menu-item-info">
                  <strong>{item.name}</strong>
                  {item.nameAm && <span className="staff-menu-item-name-am">{item.nameAm}</span>}
                  <span>ETB {Number(item.price || 0).toFixed(2)}</span>
                </span>
                <span className="staff-menu-item-add" aria-hidden="true">+</span>
              </button>
            ))
          ) : (
            <p className="staff-order-message">{t('No available menu items found.')}</p>
          )}
        </div>

        <form className="staff-order-summary" id="staff-order-summary" onSubmit={placeOrder}>
          <div className="staff-order-summary-heading">
            <h2>{t('Order summary')}</h2>
            <span>{itemCount} {itemCount === 1 ? t('item') : t('items')}</span>
          </div>

          {selectedItems.length ? (
            <ul className="staff-order-selected">
              {selectedItems.map((item) => (
                <li key={item._id}>
                  <div>
                    <strong>{item.name}</strong>
                    {item.nameAm && <span className="staff-menu-item-name-am">{item.nameAm}</span>}
                    <span>ETB {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="staff-order-quantity">
                    <button type="button" onClick={() => changeQuantity(item._id, -1)} aria-label={`${t('Remove one')} ${item.name}`}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => changeQuantity(item._id, 1)} aria-label={`${t('Add one')} ${item.name}`}>+</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="staff-order-empty">{t('Tap a food item to add it to this order.')}</p>
          )}

          <div className="staff-order-options">
            <fieldset>
              <legend>{t('Order type')}</legend>
              <label>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="dine-in"
                  checked={deliveryMethod === 'dine-in'}
                  onChange={() => setDeliveryMethod('dine-in')}
                />
                {t('Dine-in')}
              </label>
              <label>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={() => setDeliveryMethod('pickup')}
                />
                {t('Pickup')}
              </label>
              <label>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={() => setDeliveryMethod('delivery')}
                />
                {t('Delivery')}
              </label>
            </fieldset>

            {deliveryMethod === 'dine-in' && (
              <div className="staff-order-customer-fields">
                <input
                  name="tableNumber"
                  value={tableNumber}
                  onChange={(event) => setTableNumber(event.target.value)}
                  placeholder={t('Table number')}
                  aria-label={t('Table number')}
                  required
                />
              </div>
            )}

            {deliveryMethod === 'delivery' && (
              <div className="staff-order-customer-fields">
                <input name="name" value={customerInfo.name} onChange={updateCustomerInfo} placeholder={t('Customer name (optional)')} aria-label={t('Customer name (optional)')} />
                <input name="phone" value={customerInfo.phone} onChange={updateCustomerInfo} placeholder={t('Customer phone (optional)')} aria-label={t('Customer phone (optional)')} />
                <input name="street" value={deliveryAddress.street} onChange={updateDeliveryAddress} placeholder={t('Delivery address')} aria-label={t('Delivery address')} required />
                <input name="area" value={deliveryAddress.area} onChange={updateDeliveryAddress} placeholder={t('Area (optional)')} aria-label={t('Area (optional)')} />
              </div>
            )}

            <label className="staff-order-payment">
              {t('Payment method')}
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                {PAYMENT_METHODS.map((method) => (
                  <option value={method.value} key={method.value}>{method.label}</option>
                ))}
              </select>
              <small>{t('Payment is recorded as received when the order is submitted.')}</small>
            </label>
          </div>

          <div className="staff-order-total">
            <span>{t('Total')}</span>
            <strong>ETB {total.toFixed(2)}</strong>
          </div>
          <button className="staff-order-submit" type="submit" disabled={submitting || !selectedItems.length || loadingMenu}>
            {submitting ? t('Placing order…') : `${t('Place order')} · ETB ${total.toFixed(2)}`}
          </button>
        </form>
      </div>
    </section>
  );
};

export default StaffOrderEntry;
