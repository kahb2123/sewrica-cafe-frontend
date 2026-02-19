import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaClock, FaStar, FaStarHalfAlt, FaRegStar, 
  FaLeaf, FaSearch, FaFilter, FaShoppingCart,
  FaTimes, FaPlus, FaMinus, FaHamburger, 
  FaBreadSlice, FaPepperHot, FaUtensils
} from 'react-icons/fa';
import { GiMeat, GiBowlOfRice, GiChickenLeg } from 'react-icons/gi';
import { MdLocalPizza, MdRestaurantMenu } from 'react-icons/md';
import { IoFastFoodOutline } from 'react-icons/io5';
import { RiTakeawayLine, RiRestaurantLine } from 'react-icons/ri';
import { TbBread } from 'react-icons/tb';
import { toast } from 'react-toastify';
import { menuService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './Menu.css';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    vegetarian: false,
    spicy: false,
    signature: false,
    minPrice: '',
    maxPrice: ''
  });

  // Fetch menu items from API
  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const response = await menuService.getAllItems();
      setMenuItems(response.data);
      setFilteredItems(response.data);
    } catch (error) {
      toast.error('Failed to load menu items');
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await menuService.getAllCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = [...menuItems];

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nameAm.includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply boolean filters
    if (filters.vegetarian) {
      filtered = filtered.filter(item => item.isVegetarian);
    }
    if (filters.spicy) {
      filtered = filtered.filter(item => item.isSpicy);
    }
    if (filters.signature) {
      filtered = filtered.filter(item => item.isSignature);
    }

    // Apply price filters
    if (filters.minPrice) {
      filtered = filtered.filter(item => item.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(item => item.price <= Number(filters.maxPrice));
    }

    setFilteredItems(filtered);
  }, [activeCategory, searchTerm, filters, menuItems]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setQuantity(1);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const addToCart = (item) => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItemIndex = cart.findIndex(i => i.id === item._id);
    
    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({
        id: item._id,
        name: item.name,
        nameAm: item.nameAm,
        price: item.price,
        image: item.image,
        quantity: quantity
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    toast.success(`${item.name} added to cart!`);
    closeModal();
  };

  const quickAddToCart = (item, e) => {
    e.stopPropagation();
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItemIndex = cart.findIndex(i => i.id === item._id);
    
    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({
        id: item._id,
        name: item.name,
        nameAm: item.nameAm,
        price: item.price,
        image: item.image,
        quantity: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    toast.success(`${item.name} added to cart!`);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star-filled" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star-half" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star-empty" />);
    }
    return stars;
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'burgers': return <FaHamburger />;
      case 'sandwiches': return <FaBreadSlice />;
      case 'fastfood': return <IoFastFoodOutline />;
      case 'pizza': return <MdLocalPizza />;
      case 'wraps': return <RiTakeawayLine />;
      case 'fetira': return <TbBread />;
      default: return <RiRestaurantLine />;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading our delicious menu..." />;
  }

  return (
    <div className="menu-page">
      {/* Hero Section */}
      <section className="menu-hero">
        <div className="container">
          <h1 className="menu-hero-title">Our Menu</h1>
          <p className="menu-hero-subtitle">
            Discover our delicious selection of burgers, pizzas, sandwiches, and traditional Ethiopian dishes
          </p>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="menu-controls">
        <div className="container">
          <div className="controls-wrapper">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="filter-panel">
              <h4 className="filter-title">Filter Options</h4>
              
              <div className="filter-row">
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.vegetarian}
                    onChange={(e) => setFilters({...filters, vegetarian: e.target.checked})}
                  />
                  <FaLeaf className="filter-icon" /> Vegetarian
                </label>
                
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.spicy}
                    onChange={(e) => setFilters({...filters, spicy: e.target.checked})}
                  />
                  <FaPepperHot className="filter-icon" /> Spicy
                </label>
                
                <label className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.signature}
                    onChange={(e) => setFilters({...filters, signature: e.target.checked})}
                  />
                  <FaStar className="filter-icon" /> Signature
                </label>
              </div>
              
              <div className="filter-row price-range">
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  />
                </div>
              </div>
              
              <button 
                className="clear-filters"
                onClick={() => {
                  setFilters({
                    vegetarian: false,
                    spicy: false,
                    signature: false,
                    minPrice: '',
                    maxPrice: ''
                  });
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="container">
          <div className="categories-wrapper">
            <button
              className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <MdRestaurantMenu className="category-icon" />
              <span>All Items</span>
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="category-icon">{getCategoryIcon(category)}</span>
                <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Items Grid */}
      <section className="menu-items-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {activeCategory === 'all' ? 'All Menu Items' : 
                activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
            </h2>
            <p className="section-description">
              {filteredItems.length} items available
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div className="no-items">
              <FaUtensils className="no-items-icon" />
              <h3>No items found</h3>
              <p>Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="menu-grid">
              {filteredItems.map(item => (
                <div key={item._id} className="menu-card" onClick={() => handleItemClick(item)}>
                  <div className="menu-card-image">
                            <img 
                            src={item.image ? `http://localhost:5000/uploads/${item.image}` : `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.name)}`}
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.name)}`;
                              e.target.onerror = null; // Prevent infinite loop
                            }}
/>
                    {item.isSignature && (
                      <div className="signature-badge">Signature</div>
                    )}
                    {item.isPopular && (
                      <div className="popular-badge">Popular</div>
                    )}
                  </div>
                  <div className="menu-card-content">
                    <div className="menu-card-header">
                      <h3 className="menu-card-title">
                        {item.name}
                        <span className="menu-card-title-am">{item.nameAm}</span>
                      </h3>
                      <div className="menu-card-rating">
                        {renderStars(item.rating)}
                        <span className="rating-value">{item.rating}</span>
                      </div>
                    </div>
                    
                    <p className="menu-card-description">{item.description}</p>
                    
                    <div className="menu-card-meta">
                      <span className="prep-time">
                        <FaClock /> {item.prepTime}
                      </span>
                      <span className="spice-level">{item.spiceLevel}</span>
                      {item.isVegetarian && (
                        <span className="veg-icon" title="Vegetarian">
                          <FaLeaf />
                        </span>
                      )}
                    </div>
                    
                    <div className="menu-card-footer">
                      <span className="menu-card-price">ETB {item.price}</span>
                      <button 
                        className="quick-add-btn"
                        onClick={(e) => quickAddToCart(item, e)}
                        title="Add to cart"
                      >
                        <FaShoppingCart /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Item Details Modal */}
      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            
            <div className="modal-grid">
              <div className="modal-image">
                <img 
                  src={selectedItem.image ? `http://localhost:5000/uploads/${selectedItem.image}` : '/default-food.jpg'}
                  alt={selectedItem.name}
                  onError={(e) => {
                    e.target.src = '/default-food.jpg';
                  }}
                />
                {selectedItem.isSignature && (
                  <div className="modal-signature-badge">Signature</div>
                )}
              </div>
              
              <div className="modal-details">
                <h2 className="modal-title">{selectedItem.name}</h2>
                <p className="modal-title-am">{selectedItem.nameAm}</p>
                
                {selectedItem.greekText && (
                  <p className="modal-greek">{selectedItem.greekText}</p>
                )}
                
                <div className="modal-rating">
                  {renderStars(selectedItem.rating)}
                  <span className="modal-rating-value">{selectedItem.rating} / 5</span>
                </div>
                
                <p className="modal-description">{selectedItem.fullDescription}</p>
                
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <span className="info-label">Price:</span>
                    <span className="info-value price">ETB {selectedItem.price}</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="info-label">Prep Time:</span>
                    <span className="info-value">{selectedItem.prepTime}</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="info-label">Spice Level:</span>
                    <span className="info-value spice">{selectedItem.spiceLevel}</span>
                  </div>
                </div>
                
                <div className="modal-ingredients">
                  <h4 className="ingredients-title">Ingredients:</h4>
                  <ul className="ingredients-list">
                    {selectedItem.ingredients?.map((ingredient, index) => (
                      <li key={index}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="modal-footer">
                  <div className="quantity-selector">
                    <button 
                      className="quantity-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <FaMinus />
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <FaPlus />
                    </button>
                  </div>
                  
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addToCart(selectedItem)}
                  >
                    <FaShoppingCart /> Add to Cart • ETB {selectedItem.price * quantity}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;