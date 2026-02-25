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

  // Fetch menu items from API
  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Fetch categories separately
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      const response = await menuService.getAllItems();
      
      // Handle different response formats
      let items = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && response.data) {
        items = Array.isArray(response.data) ? response.data : 
               (response.data.data ? response.data.data : []);
      } else if (response && response.success && response.data) {
        items = response.data;
      }

      // Map backend field names to frontend expected names
      const mappedItems = items.map(item => ({
        ...item,
        vegetarian: item.isVegetarian || false,
        spicy: item.isSpicy || false,
        signature: item.isSignature || false,
        rating: item.rating || 4.5, // Default rating if not provided
        prepTime: item.prepTime || '15-20 min', // Default prep time
        spiceLevel: item.spiceLevel || 'Mild', // Default spice level
        ingredients: item.ingredients || ['Ingredients not specified']
      }));

      setMenuItems(mappedItems);
      setFilteredItems(mappedItems);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to load menu items');
      
      // Set mock data for testing if API fails
      const mockItems = [
        {
          _id: '1',
          name: 'Cheese Burger',
          nameAm: 'በርገር አይብ',
          description: 'Delicious beef patty with melted cheese, lettuce, tomato, and our special sauce',
          fullDescription: 'A classic cheeseburger made with 100% beef patty, topped with melted cheddar cheese, fresh lettuce, ripe tomatoes, and our secret house sauce, served in a brioche bun.',
          price: 450,
          category: 'burgers',
          isVegetarian: false,
          isSpicy: false,
          isSignature: true,
          available: true,
          rating: 4.8,
          prepTime: '15-20 min',
          spiceLevel: 'Mild',
          ingredients: ['Beef patty', 'Cheddar cheese', 'Lettuce', 'Tomato', 'Special sauce', 'Brioche bun'],
          image: '/images/burger.jpg'
        },
        {
          _id: '2',
          name: 'Doro Wat',
          nameAm: 'ዶሮ ወጥ',
          description: 'Spicy Ethiopian chicken stew with hard-boiled eggs',
          fullDescription: 'Traditional Ethiopian spicy chicken stew simmered with berbere spice, served with a hard-boiled egg and injera.',
          price: 380,
          category: 'traditional',
          isVegetarian: false,
          isSpicy: true,
          isSignature: true,
          available: true,
          rating: 4.9,
          prepTime: '20-25 min',
          spiceLevel: 'Spicy',
          ingredients: ['Chicken', 'Berbere spice', 'Onions', 'Garlic', 'Hard-boiled eggs', 'Injera'],
          image: '/images/doro-wat.jpg'
        },
        {
          _id: '3',
          name: 'Vegetarian Pizza',
          nameAm: 'አትክልት ፒዛ',
          description: 'Fresh vegetables on a crispy crust with mozzarella',
          fullDescription: 'Thin crust pizza topped with fresh bell peppers, mushrooms, olives, onions, and generous mozzarella cheese.',
          price: 520,
          category: 'pizza',
          isVegetarian: true,
          isSpicy: false,
          isSignature: false,
          available: true,
          rating: 4.6,
          prepTime: '20-25 min',
          spiceLevel: 'Mild',
          ingredients: ['Pizza dough', 'Mozzarella', 'Bell peppers', 'Mushrooms', 'Olives', 'Tomato sauce'],
          image: '/images/pizza.jpg'
        }
      ];
      setMenuItems(mockItems);
      setFilteredItems(mockItems);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await menuService.getAllCategories();
      if (Array.isArray(response)) {
        setCategories(response);
      } else if (response && response.data) {
        setCategories(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set default categories
      setCategories(['burgers', 'pizza', 'sandwiches', 'traditional', 'fastfood', 'wraps', 'fetira']);
    }
  };

  // Apply filters whenever they change
  useEffect(() => {
    filterItems();
  }, [activeCategory, searchTerm, filters, menuItems]);

  const filterItems = () => {
    let filtered = [...menuItems];

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nameAm && item.nameAm.includes(searchTerm)) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
  };

  const getImageUrl = (image) => {
    if (!image) return '/default-food.jpg';
    if (image.startsWith('http')) return image;
    if (image.startsWith('/uploads')) return `${UPLOADS_URL}${image}`;
    return `${UPLOADS_URL}/${image.split('/').pop()}`;
  };

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
    switch(category?.toLowerCase()) {
      case 'burgers': return <FaHamburger />;
      case 'sandwiches': return <FaBreadSlice />;
      case 'fastfood': return <IoFastFoodOutline />;
      case 'pizza': return <MdLocalPizza />;
      case 'wraps': return <RiTakeawayLine />;
      case 'fetira': return <TbBread />;
      case 'traditional': return <GiBowlOfRice />;
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
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.name)}`;
                      }}
                    />
                    {item.isSignature && (
                      <div className="signature-badge">Signature</div>
                    )}
                    {!item.available && (
                      <div className="unavailable-badge">Unavailable</div>
                    )}
                  </div>
                  <div className="menu-card-content">
                    <div className="menu-card-header">
                      <h3 className="menu-card-title">
                        {item.name}
                        {item.nameAm && <span className="menu-card-title-am">{item.nameAm}</span>}
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
                        disabled={!item.available}
                        title={item.available ? "Add to cart" : "Currently unavailable"}
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
                  src={getImageUrl(selectedItem.image)}
                  alt={selectedItem.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-food.jpg';
                  }}
                />
                {selectedItem.isSignature && (
                  <div className="modal-signature-badge">Signature</div>
                )}
              </div>
              
              <div className="modal-details">
                <h2 className="modal-title">{selectedItem.name}</h2>
                {selectedItem.nameAm && (
                  <p className="modal-title-am">{selectedItem.nameAm}</p>
                )}
                
                <div className="modal-rating">
                  {renderStars(selectedItem.rating)}
                  <span className="modal-rating-value">{selectedItem.rating} / 5</span>
                </div>
                
                <p className="modal-description">{selectedItem.fullDescription || selectedItem.description}</p>
                
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <span className="info-label">Price:</span>
                    <span className="info-value price">ETB {selectedItem.price}</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="info-label">Prep Time:</span>
                    <span className="info-value">{selectedItem.prepTime}</span>
                  </div>
                  {selectedItem.spiceLevel && (
                    <div className="modal-info-item">
                      <span className="info-label">Spice Level:</span>
                      <span className="info-value spice">{selectedItem.spiceLevel}</span>
                    </div>
                  )}
                </div>
                
                {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                  <div className="modal-ingredients">
                    <h4 className="ingredients-title">Ingredients:</h4>
                    <ul className="ingredients-list">
                      {selectedItem.ingredients.map((ingredient, index) => (
                        <li key={index}>{ingredient}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="modal-footer">
                  <div className="quantity-selector">
                    <button 
                      className="quantity-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={!selectedItem.available}
                    >
                      <FaMinus />
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={!selectedItem.available}
                    >
                      <FaPlus />
                    </button>
                  </div>
                  
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addToCart(selectedItem)}
                    disabled={!selectedItem.available}
                  >
                    <FaShoppingCart /> {selectedItem.available ? `Add to Cart • ETB ${selectedItem.price * quantity}` : 'Currently Unavailable'}
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