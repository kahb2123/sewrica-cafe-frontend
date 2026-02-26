import React, { useState, useEffect } from 'react';
import { 
  FaClock, FaStar, FaStarHalfAlt, FaRegStar, 
  FaLeaf, FaSearch, FaFilter, FaShoppingCart,
  FaTimes, FaPlus, FaMinus, FaHamburger, 
  FaBreadSlice, FaPepperHot, FaUtensils, FaCoffee,
  FaCheck, FaRegClock, FaExclamationTriangle
} from 'react-icons/fa';
import { GiMeat, GiBowlOfRice, GiChickenLeg } from 'react-icons/gi';
import { MdLocalPizza, MdRestaurantMenu } from 'react-icons/md';
import { IoFastFoodOutline } from 'react-icons/io5';
import { RiTakeawayLine, RiRestaurantLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { menuService, UPLOADS_URL } from '../services/api';
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
  const [imageErrors, setImageErrors] = useState({});
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    setApiError(false);
    
    try {
      console.log('Fetching menu items...');
      // Pass any active filters to the API
      const response = await menuService.getAllItems(filters);
      console.log('API Response:', response);
      
      // Handle the response structure from your API
      let items = [];
      
      // Your API returns { success: true, count: 6, data: [...] }
      if (response && response.success && response.data) {
        items = response.data;
        console.log('Items from API:', items);
      } else if (Array.isArray(response)) {
        items = response;
      } else if (response && response.data) {
        items = Array.isArray(response.data) ? response.data : 
               (response.data.data ? response.data.data : []);
      }

      if (items && items.length > 0) {
        // Process the items with proper defaults
        const processedItems = items.map(item => ({
          ...item,
          _id: item._id || item.id,
          name: item.name || 'Unknown Item',
          // Make Amharic fields optional
          nameAm: item.nameAm || '',
          description: item.description || 'No description available',
          fullDescription: item.fullDescription || item.description || 'No detailed description available',
          price: item.price || 0,
          category: item.category || 'other',
          image: item.image || null,
          rating: item.rating || 4.0,
          spiceLevel: item.spiceLevel || 'Mild',
          prepTime: item.prepTime || '15-20 min',
          isVegetarian: item.isVegetarian || false,
          isSpicy: item.isSpicy || false,
          isSignature: item.isSignature || false,
          isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
          // Handle ingredients (might be stored as comma-separated string or array)
          ingredients: item.ingredients ? (
            Array.isArray(item.ingredients) ? item.ingredients : 
            (typeof item.ingredients === 'string' ? item.ingredients.split(',').map(i => i.trim()) : ['Ingredients not specified'])
          ) : ['Ingredients information coming soon'],
          available: item.isAvailable !== undefined ? item.isAvailable : true
        }));

        setMenuItems(processedItems);
        setFilteredItems(processedItems);
        
        toast.success(`Loaded ${processedItems.length} menu items`);
      } else {
        console.log('No items found in API response');
        setMenuItems([]);
        setFilteredItems([]);
        toast.info('No menu items available');
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
      setApiError(true);
      toast.error(error.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await menuService.getAllCategories();
      if (response && response.data) {
        setCategories(Array.isArray(response.data) ? response.data : []);
      } else if (Array.isArray(response)) {
        setCategories(response);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Extract categories from menu items if API fails
      if (menuItems.length > 0) {
        const uniqueCategories = [...new Set(menuItems.map(item => item.category))];
        setCategories(uniqueCategories.filter(Boolean));
      }
    }
  };

  useEffect(() => {
    if (menuItems.length > 0) {
      filterItems();
    }
  }, [activeCategory, searchTerm, filters, menuItems]);

  const filterItems = () => {
    let filtered = [...menuItems];

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(term) ||
        (item.nameAm && item.nameAm.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term))
      );
    }

    // Filter by vegetarian
    if (filters.vegetarian) {
      filtered = filtered.filter(item => item.isVegetarian);
    }

    // Filter by spicy
    if (filters.spicy) {
      filtered = filtered.filter(item => item.isSpicy);
    }

    // Filter by signature
    if (filters.signature) {
      filtered = filtered.filter(item => item.isSignature);
    }

    // Filter by price range
    if (filters.minPrice) {
      filtered = filtered.filter(item => item.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(item => item.price <= Number(filters.maxPrice));
    }

    setFilteredItems(filtered);
  };

  // FIXED: Improved image URL handling
  // FIXED: Improved image URL handling
// FIXED: Image URL helper function
const getImageUrl = (image) => {
  if (!image) return null;
  
  console.log('Original image path:', image);
  
  // If it's already a full URL
  if (image.startsWith('http')) return image;
  
  // If it's default-food.jpg, return null to show fallback
  if (image === 'default-food.jpg') return null;
  
  // Construct the full URL
  return `${UPLOADS_URL}/${image}`;
};

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setQuantity(1);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setQuantity(1);
    document.body.style.overflow = 'unset';
  };

  const addToCart = (item) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      
      const existingItemIndex = cart.findIndex(i => i.id === item._id);
      
      if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += quantity;
        toast.info(`Updated ${item.name} quantity in cart!`);
      } else {
        cart.push({
          id: item._id,
          name: item.name,
          nameAm: item.nameAm,
          price: item.price,
          image: item.image,
          quantity: quantity
        });
        toast.success(`${item.name} added to cart!`);
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      closeModal();
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const quickAddToCart = (item, e) => {
    e.stopPropagation();
    
    try {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      
      const existingItemIndex = cart.findIndex(i => i.id === item._id);
      
      if (existingItemIndex >= 0) {
        cart[existingItemIndex].quantity += 1;
        toast.info(`Updated ${item.name} quantity in cart!`);
      } else {
        cart.push({
          id: item._id,
          name: item.name,
          nameAm: item.nameAm,
          price: item.price,
          image: item.image,
          quantity: 1
        });
        toast.success(`${item.name} added to cart!`);
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cartUpdated'));
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
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
    switch(category?.toLowerCase()) {
      case 'burgers': return <FaHamburger />;
      case 'sandwiches': return <FaBreadSlice />;
      case 'fastfood': return <IoFastFoodOutline />;
      case 'pizza': return <MdLocalPizza />;
      case 'wraps': return <RiTakeawayLine />;
      case 'appetizers': return <GiMeat />;
      case 'beverages': return <FaCoffee />;
      case 'traditional': return <GiBowlOfRice />;
      case 'fetira': return <GiBowlOfRice />;
      default: return <RiRestaurantLine />;
    }
  };

  const getSpiceLevelIcon = (level) => {
    switch(level?.toLowerCase()) {
      case 'mild': return '🟢';
      case 'medium': return '🟡';
      case 'spicy': return '🔴';
      default: return '⚪';
    }
  };

  const handleImageError = (itemId) => {
    setImageErrors(prev => ({
      ...prev,
      [itemId]: true
    }));
  };

  if (loading) {
    return <LoadingSpinner message="Loading our delicious menu..." />;
  }

  if (apiError) {
    return (
      <div className="menu-page">
        <div className="container">
          <div className="error-state">
            <FaExclamationTriangle className="error-icon" />
            <h2>Unable to load menu</h2>
            <p>Please check your connection and try again</p>
            <button onClick={fetchMenuItems} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      <section className="menu-hero">
        <div className="container">
          <h1 className="menu-hero-title">Our Menu</h1>
          <p className="menu-hero-subtitle">
            Discover our delicious selection of Ethiopian and international dishes
          </p>
        </div>
      </section>

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
            {categories.length > 0 ? (
              categories.map(category => (
                <button
                  key={category}
                  className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  <span className="category-icon">{getCategoryIcon(category)}</span>
                  <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                </button>
              ))
            ) : (
              // Extract categories from menu items if API fails
              [...new Set(menuItems.map(item => item.category))].map(category => (
                <button
                  key={category}
                  className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category)}
                >
                  <span className="category-icon">{getCategoryIcon(category)}</span>
                  <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

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
                    {!imageErrors[item._id] && item.image ? (
                      <img 
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        onError={() => handleImageError(item._id)}
                      />
                    ) : (
                      <div className="image-fallback">
                        {getCategoryIcon(item.category)}
                      </div>
                    )}
                    {item.isSignature && (
                      <div className="signature-badge">Signature</div>
                    )}
                  </div>
                  <div className="menu-card-content">
                    <div className="menu-card-header">
                      <h3 className="menu-card-title" title={item.name}>
                        {item.name}
                      </h3>
                      {/* Only show Amharic name if it exists */}
                      {item.nameAm && (
                        <span className="menu-card-title-am" title={item.nameAm}>
                          {item.nameAm}
                        </span>
                      )}
                      <div className="menu-card-rating">
                        {renderStars(item.rating)}
                        <span className="rating-value">{item.rating}</span>
                      </div>
                    </div>
                    
                    <p className="menu-card-description" title={item.description}>
                      {item.description}
                    </p>
                    
                    <div className="menu-card-meta">
                      <span className="prep-time">
                        <FaRegClock /> {item.prepTime}
                      </span>
                      {item.isVegetarian && (
                        <span className="veg-icon" title="Vegetarian">
                          <FaLeaf />
                        </span>
                      )}
                      {item.isSpicy && (
                        <span className="spicy-icon" title="Spicy">
                          <FaPepperHot />
                        </span>
                      )}
                    </div>
                    
                    <div className="menu-card-footer">
                      <span className="menu-card-price">ETB {item.price}</span>
                      <button 
                        className="quick-add-btn"
                        onClick={(e) => quickAddToCart(item, e)}
                        disabled={!item.isAvailable}
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
              {/* Left Side - Image */}
              <div className="modal-image-section">
                {!imageErrors[`modal-${selectedItem._id}`] && selectedItem.image ? (
                  <img 
                    src={getImageUrl(selectedItem.image)}
                    alt={selectedItem.name}
                    className="modal-image"
                    onError={() => handleImageError(`modal-${selectedItem._id}`)}
                  />
                ) : (
                  <div className="modal-image-fallback">
                    {getCategoryIcon(selectedItem.category)}
                  </div>
                )}
                {selectedItem.isSignature && (
                  <div className="modal-signature-badge">Signature Dish</div>
                )}
              </div>
              
              {/* Right Side - Details */}
              <div className="modal-details-section">
                <div className="modal-details-container">
                  <h2 className="modal-title">{selectedItem.name}</h2>
                  {/* Only show Amharic title if it exists */}
                  {selectedItem.nameAm && (
                    <p className="modal-title-am">{selectedItem.nameAm}</p>
                  )}
                  
                  <div className="modal-rating">
                    <div className="modal-stars">
                      {renderStars(selectedItem.rating)}
                    </div>
                    <span className="modal-rating-value">{selectedItem.rating} / 5</span>
                  </div>
                  
                  <p className="modal-description">
                    {selectedItem.fullDescription || selectedItem.description}
                  </p>
                  
                  {/* Info Cards */}
                  <div className="modal-info-cards">
                    <div className="info-card">
                      <span className="info-card-label">Price</span>
                      <span className="info-card-value price">ETB {selectedItem.price}</span>
                    </div>
                    
                    <div className="info-card">
                      <span className="info-card-label">Prep Time</span>
                      <span className="info-card-value">
                        <FaRegClock className="info-icon" /> {selectedItem.prepTime}
                      </span>
                    </div>
                    
                    <div className="info-card">
                      <span className="info-card-label">Spice Level</span>
                      <span className="info-card-value spice">
                        {getSpiceLevelIcon(selectedItem.spiceLevel)} {selectedItem.spiceLevel}
                      </span>
                    </div>
                  </div>
                  
                  {/* Ingredients */}
                  {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                    <div className="modal-ingredients">
                      <h4 className="ingredients-title">Ingredients</h4>
                      <div className="ingredients-grid">
                        {selectedItem.ingredients.map((ingredient, index) => (
                          <div key={index} className="ingredient-item">
                            <FaCheck className="ingredient-check" />
                            <span>{ingredient}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Add to Cart Section */}
                  <div className="modal-cart-section">
                    <div className="quantity-control">
                      <button 
                        className="quantity-control-btn"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <FaMinus />
                      </button>
                      <span className="quantity-display">{quantity}</span>
                      <button 
                        className="quantity-control-btn"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <FaPlus />
                      </button>
                    </div>
                    
                    <button 
                      className="modal-add-to-cart-btn"
                      onClick={() => addToCart(selectedItem)}
                      disabled={!selectedItem.isAvailable}
                    >
                      <FaShoppingCart className="btn-icon" />
                      <span className="btn-text">Add to Cart</span>
                      <span className="btn-total">ETB {selectedItem.price * quantity}</span>
                    </button>
                  </div>
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