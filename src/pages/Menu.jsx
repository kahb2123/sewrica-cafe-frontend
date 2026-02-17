import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaClock, FaStar, FaStarHalfAlt, FaRegStar, 
  FaLeaf, FaSearch, FaFilter, FaShoppingCart,
  FaTimes, FaPlus, FaMinus,
  FaHamburger, FaBreadSlice, FaPepperHot,
  FaEgg, FaFish
} from 'react-icons/fa';
import { GiMeat, GiBowlOfRice, GiChickenLeg, GiFrenchFries } from 'react-icons/gi';
import { MdLocalPizza, MdRestaurantMenu, MdDeliveryDining } from 'react-icons/md';
import { IoFastFoodOutline } from 'react-icons/io5';
import { RiTakeawayLine, RiRestaurantLine } from 'react-icons/ri';
import { TbBread } from 'react-icons/tb';
import { toast } from 'react-toastify';
import './Menu.css';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    vegetarian: false,
    spicy: false,
    signature: false
  });

  // Complete Menu Data based on your images
  const allMenuItems = [
    // Burgers Section
    {
      id: 1,
      name: 'Beef Burger',
      nameAm: 'በፍ በርግር',
      description: 'Sandwich consisting of a cooked patty of ground beef placed inside a sliced bun, often accompanied by various condiments and toppings.',
      fullDescription: 'Our classic beef burger features a 100% pure beef patty grilled to perfection, topped with fresh lettuce, tomato, onion, pickles, and our special sauce, all served in a toasted brioche bun. Served with crispy french fries.',
      price: 380,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'burgers',
      spiceLevel: '🌶️',
      prepTime: '15 min',
      calories: '650 kcal',
      isVegetarian: false,
      isSpicy: false,
      isPopular: true,
      isSignature: false,
      ingredients: ['Beef patty', 'Brioche bun', 'Lettuce', 'Tomato', 'Onion', 'Pickles', 'Special sauce', 'French fries']
    },
    {
      id: 2,
      name: 'Cheese Burger',
      nameAm: 'ችዝ በርግር',
      description: 'A hamburger with a slice of cheese melted on top of the meat patty.',
      fullDescription: 'Take our classic beef burger and add a generous slice of melted cheddar cheese for extra richness and flavor. The cheese adds a creamy, savory element that perfectly complements the juicy beef patty.',
      price: 450,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'burgers',
      spiceLevel: '🌶️',
      prepTime: '15 min',
      calories: '720 kcal',
      isVegetarian: false,
      isSpicy: false,
      isPopular: true,
      isSignature: false,
      ingredients: ['Beef patty', 'Brioche bun', 'Cheddar cheese', 'Lettuce', 'Tomato', 'Onion', 'Pickles', 'Special sauce', 'French fries']
    },
    {
      id: 3,
      name: 'Chicken Burger',
      nameAm: 'ዶሮ በርግር',
      description: 'A sandwich that features a cooked patty of ground chicken or a whole chicken fillet, typically grilled or fried, served in a sliced bun with various toppings.',
      fullDescription: 'Crispy or grilled chicken fillet seasoned with our special blend of herbs and spices, topped with fresh lettuce, tomato, and mayo, all served in a toasted sesame seed bun. A lighter but equally delicious option.',
      price: 650,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1606755962773-d324e9a3e4d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'burgers',
      spiceLevel: '🌶️🌶️',
      prepTime: '18 min',
      calories: '580 kcal',
      isVegetarian: false,
      isSpicy: true,
      isPopular: false,
      isSignature: false,
      ingredients: ['Chicken fillet', 'Sesame bun', 'Lettuce', 'Tomato', 'Mayonnaise', 'Special spices', 'French fries']
    },
    {
      id: 4,
      name: 'Sewrica Burger',
      nameAm: 'ሰውሪካ በርግር',
      description: 'Best burger for all - Our signature special burger with premium ingredients',
      fullDescription: 'Our signature creation! A double beef patty with melted cheese, crispy bacon, caramelized onions, mushrooms, lettuce, tomato, and our secret Sewrica sauce, all between a premium brioche bun. Served with seasoned curly fries.',
      price: 680,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'burgers',
      spiceLevel: '🌶️🌶️',
      prepTime: '20 min',
      calories: '950 kcal',
      isVegetarian: false,
      isSpicy: true,
      isPopular: true,
      isSignature: true,
      greekText: 'Από-ζήτηση',
      ingredients: ['Double beef patty', 'Brioche bun', 'Cheddar cheese', 'Bacon', 'Caramelized onions', 'Mushrooms', 'Lettuce', 'Tomato', 'Sewrica sauce', 'Curly fries']
    },

    // Sandwiches Section
    {
      id: 5,
      name: 'Chicken Sandwich',
      nameAm: 'ዶሮ ሳንድዊች',
      description: 'Sandwich made with a piece of cooked chicken, served between slices of bread with various toppings.',
      fullDescription: 'Grilled chicken breast marinated in herbs and spices, served on artisan bread with fresh lettuce, tomato, avocado, and our signature aioli sauce. A healthy and satisfying option.',
      price: 450,
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1606755962773-d324e9a3e4d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'sandwiches',
      spiceLevel: '🌶️',
      prepTime: '12 min',
      calories: '520 kcal',
      isVegetarian: false,
      isSpicy: false,
      isPopular: false,
      isSignature: false,
      ingredients: ['Grilled chicken', 'Artisan bread', 'Lettuce', 'Tomato', 'Avocado', 'Aioli sauce']
    },
    {
      id: 6,
      name: 'Club Sandwich',
      nameAm: 'ክለብ ሳንድዊች',
      description: 'Double-decker sandwich with three slices of toasted bread, filled with turkey, bacon, lettuce, tomato, and mayonnaise.',
      fullDescription: 'A classic triple-decker sandwich with toasted bread layers filled with sliced turkey, crispy bacon, fresh lettuce, ripe tomato, and mayonnaise. Cut into quarters and served with potato chips.',
      price: 385,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'sandwiches',
      spiceLevel: '🌶️',
      prepTime: '15 min',
      calories: '680 kcal',
      isVegetarian: false,
      isSpicy: false,
      isPopular: true,
      isSignature: false,
      ingredients: ['Turkey', 'Bacon', 'Toasted bread', 'Lettuce', 'Tomato', 'Mayonnaise', 'Potato chips']
    },

    // Fast Food Section
    {
      id: 7,
      name: 'Beyaynet',
      nameAm: 'በያይነት',
      description: 'Combination platter of various vegetable and legume stews arranged on injera.',
      fullDescription: 'A traditional Ethiopian vegetarian platter featuring a colorful assortment of lentil stew (misir wot), split pea stew (kik alicha), cabbage and carrots (tikil gomen), green beans, and salad, all served on a bed of injera.',
      price: 250,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fastfood',
      spiceLevel: '🌶️🌶️',
      prepTime: '15 min',
      calories: '450 kcal',
      isVegetarian: true,
      isSpicy: true,
      isPopular: true,
      isSignature: false,
      ingredients: ['Injera', 'Misir wot (lentils)', 'Kik alicha (split peas)', 'Tikil gomen (cabbage)', 'Green beans', 'Salad']
    },
    {
      id: 8,
      name: 'Sewrica Yetsom Agelgil',
      nameAm: 'ሰውሪካ የጾም አገልግል',
      description: 'Distinctive lidded basket used to transport a meal of injera and various stews.',
      fullDescription: 'Our signature fasting platter presented in a traditional Ethiopian lidded basket (agelgil). Includes a variety of vegan stews: shiro wot, misir wot, atkilt wot, gomen, and salad, all served with plenty of injera.',
      price: 650,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1543353071-8735f4c8f5c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fastfood',
      spiceLevel: '🌶️🌶️',
      prepTime: '20 min',
      calories: '520 kcal',
      isVegetarian: true,
      isSpicy: true,
      isPopular: true,
      isSignature: true,
      greekText: 'Από-ζήτηση για την Αθήνα',
      ingredients: ['Injera', 'Shiro wot', 'Misir wot', 'Atkilt wot', 'Gomen', 'Salad', 'Traditional agelgil basket']
    },
    {
      id: 9,
      name: 'Shero wot',
      nameAm: 'ሽሮ ወጥ',
      description: 'Made from powdered chickpeas or broad beans, simmered with onions, garlic, and berbere.',
      fullDescription: 'A thick and savory Ethiopian stew made from ground chickpeas, slow-cooked with onions, garlic, ginger, and berbere spice. Smooth, flavorful, and comforting, served with injera.',
      price: 160,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1543353071-8735f4c8f5c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fastfood',
      spiceLevel: '🌶️🌶️',
      prepTime: '15 min',
      calories: '280 kcal',
      isVegetarian: true,
      isSpicy: true,
      isPopular: false,
      isSignature: false,
      ingredients: ['Chickpea powder', 'Onions', 'Garlic', 'Ginger', 'Berbere spice', 'Injera']
    },

    // Pizza Section
    {
      id: 10,
      name: 'Beef Pizza',
      nameAm: 'በፍ ፒዛ',
      description: 'Baked flatbread topped with tomato sauce, cheese, and seasoned beef.',
      fullDescription: 'A hearty pizza topped with our signature tomato sauce, mozzarella cheese, seasoned ground beef, onions, and bell peppers. Baked to perfection in our wood-fired oven.',
      price: 450,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️🌶️',
      prepTime: '20 min',
      calories: '850 kcal',
      isVegetarian: false,
      isSpicy: false,
      isPopular: false,
      isSignature: false,
      ingredients: ['Pizza dough', 'Tomato sauce', 'Mozzarella', 'Ground beef', 'Onions', 'Bell peppers']
    },
    {
      id: 11,
      name: 'Cheese Pizza',
      nameAm: 'ችዝ ፒዛ',
      description: 'Baked flatbread topped with tomato sauce and one or more types of cheese.',
      fullDescription: 'A classic cheese pizza with our homemade tomato sauce and a blend of mozzarella, parmesan, and provolone cheeses. Simple, perfect, and always satisfying.',
      price: 550,
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️',
      prepTime: '18 min',
      calories: '780 kcal',
      isVegetarian: true,
      isSpicy: false,
      isPopular: true,
      isSignature: false,
      ingredients: ['Pizza dough', 'Tomato sauce', 'Mozzarella', 'Parmesan', 'Provolone']
    },
    {
      id: 12,
      name: 'Chicken Pizza',
      nameAm: 'ዶሮ ፒዛ',
      description: 'Baked flatbread topped with tomato sauce, cheese, and pieces of seasoned chicken.',
      fullDescription: 'Grilled chicken breast pieces on a bed of mozzarella and our signature sauce, with red onions, bell peppers, and a hint of barbecue sauce. A crowd favorite.',
      price: 550,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️🌶️',
      prepTime: '20 min',
      calories: '820 kcal',
      isVegetarian: false,
      isSpicy: true,
      isPopular: true,
      isSignature: false,
      ingredients: ['Pizza dough', 'Tomato sauce', 'Mozzarella', 'Grilled chicken', 'Red onions', 'Bell peppers', 'BBQ sauce']
    },
    {
      id: 13,
      name: 'Sewrica Pizza',
      nameAm: 'ሰውሪካ ፒዛ',
      description: 'Our signature pizza with premium toppings and special sauce.',
      fullDescription: 'Our masterpiece pizza! Topped with our signature Sewrica sauce, mozzarella, pepperoni, mushrooms, bell peppers, onions, olives, and a blend of Italian herbs. Finished with a drizzle of truffle oil.',
      price: 625,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1593504049359-74330189a345?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️🌶️',
      prepTime: '22 min',
      calories: '980 kcal',
      isVegetarian: false,
      isSpicy: true,
      isPopular: true,
      isSignature: true,
      ingredients: ['Pizza dough', 'Sewrica sauce', 'Mozzarella', 'Pepperoni', 'Mushrooms', 'Bell peppers', 'Onions', 'Olives', 'Italian herbs', 'Truffle oil']
    },
    {
      id: 14,
      name: 'Tuna Pizza',
      nameAm: 'ቱና ፒዛ',
      description: 'Baked flatbread topped with tomato sauce, cheese, and flakes of tuna.',
      fullDescription: 'A unique and delicious combination with premium tuna, red onions, olives, and capers on a bed of mozzarella and tomato sauce. A seafood lover\'s delight.',
      price: 450,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️',
      prepTime: '18 min',
      calories: '720 kcal',
      isVegetarian: false,
      isSpicy: false,
      isPopular: false,
      isSignature: false,
      ingredients: ['Pizza dough', 'Tomato sauce', 'Mozzarella', 'Tuna', 'Red onions', 'Olives', 'Capers']
    },
    {
      id: 15,
      name: 'Vegetable Pizza',
      nameAm: 'አትክልት ፒዛ',
      description: 'Baked flatbread topped with tomato sauce, cheese, and a variety of vegetables.',
      fullDescription: 'A colorful medley of fresh vegetables including bell peppers, mushrooms, onions, olives, tomatoes, and spinach, all on a bed of mozzarella and our signature tomato sauce.',
      price: 430,
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️',
      prepTime: '18 min',
      calories: '620 kcal',
      isVegetarian: true,
      isSpicy: false,
      isPopular: false,
      isSignature: false,
      ingredients: ['Pizza dough', 'Tomato sauce', 'Mozzarella', 'Bell peppers', 'Mushrooms', 'Onions', 'Olives', 'Tomatoes', 'Spinach']
    },

    // Wraps
    {
      id: 16,
      name: 'Special Wrap',
      nameAm: 'ልዩ ራፕ',
      description: 'Delicious wrap filled with fresh ingredients including bread, fried potatoes, meat, egg, cheese, ketchup, mayonnaise, and special spices.',
      fullDescription: 'A generous flour tortilla filled with grilled chicken or beef, crispy french fries, scrambled egg, melted cheese, fresh lettuce, tomatoes, and our special sauce. Rolled and grilled to perfection.',
      price: 330,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'wraps',
      spiceLevel: '🌶️',
      prepTime: '12 min',
      calories: '580 kcal',
      isVegetarian: false,
      isSpicy: false,
      isPopular: true,
      isSignature: false,
      ingredients: ['Flour tortilla', 'Grilled chicken or beef', 'French fries', 'Scrambled egg', 'Cheddar cheese', 'Lettuce', 'Tomatoes', 'Special sauce']
    },

    // Fetira
    {
      id: 17,
      name: 'Chechebsa with Egg',
      nameAm: 'በለጠ ከእንቁላል ጋር',
      description: 'Traditional Ethiopian fried flatbread served with egg, honey, and butter',
      fullDescription: 'Traditional Ethiopian fried flatbread (kita) torn into pieces and mixed with clarified butter and spices, topped with a fried egg and served with honey on the side. A perfect breakfast or brunch dish.',
      price: 280,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fetira',
      spiceLevel: '🌶️',
      prepTime: '10 min',
      calories: '420 kcal',
      isVegetarian: false,
      isSpicy: false,
      isPopular: true,
      isSignature: false,
      ingredients: ['Kita (flatbread)', 'Niter kibbeh (spiced butter)', 'Egg', 'Honey', 'Berbere spice']
    },
    {
      id: 18,
      name: 'Chechebsa',
      nameAm: 'በለጠ',
      description: 'Traditional Ethiopian fried flatbread served with honey and butter',
      fullDescription: 'A traditional Ethiopian breakfast dish made from shredded flatbread (kita) sautéed with niter kibbeh (spiced clarified butter) and berbere spice. Served warm with a side of honey.',
      price: 220,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fetira',
      spiceLevel: '🌶️',
      prepTime: '8 min',
      calories: '350 kcal',
      isVegetarian: true,
      isSpicy: true,
      isPopular: false,
      isSignature: false,
      ingredients: ['Kita (flatbread)', 'Niter kibbeh (spiced butter)', 'Berbere spice', 'Honey']
    },
    {
      id: 19,
      name: 'Fetira',
      nameAm: 'ፈጢራ',
      description: 'Traditional Ethiopian layered flatbread, perfect for breakfast or anytime',
      fullDescription: 'A delicious Ethiopian layered flatbread, similar to a pancake but thicker and more substantial. Served with honey, butter, or your choice of toppings. Perfect for breakfast or as a snack.',
      price: 220,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fetira',
      spiceLevel: '🌶️',
      prepTime: '8 min',
      calories: '300 kcal',
      isVegetarian: true,
      isSpicy: false,
      isPopular: false,
      isSignature: false,
      ingredients: ['Flour', 'Eggs', 'Milk', 'Butter', 'Honey']
    }
  ];

  // Categories with icons
  const categories = [
    { id: 'all', name: 'All Items', icon: <MdRestaurantMenu /> },
    { id: 'burgers', name: 'Burgers', icon: <FaHamburger /> },
    { id: 'sandwiches', name: 'Sandwiches', icon: <FaBreadSlice /> },
    { id: 'fastfood', name: 'Fast Food', icon: <IoFastFoodOutline /> },
    { id: 'pizza', name: 'Pizza', icon: <MdLocalPizza /> },
    { id: 'wraps', name: 'Wraps', icon: <RiTakeawayLine /> },
    { id: 'fetira', name: 'Fetia', icon: <TbBread /> }
  ];

  // Initialize menu items
  useEffect(() => {
    setMenuItems(allMenuItems);
    setFilteredItems(allMenuItems);
  }, []);

  // Filter items based on category, search, and filters
  useEffect(() => {
    let filtered = [...allMenuItems];

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

    // Filter by price range
    filtered = filtered.filter(item => 
      item.price >= priceRange[0] && item.price <= priceRange[1]
    );

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

    setFilteredItems(filtered);
  }, [activeCategory, searchTerm, priceRange, filters]);

  // Handle item click to show details
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setQuantity(1);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Add to cart
  const addToCart = (item) => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItemIndex = cart.findIndex(i => i.id === item.id);
    
    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        nameAm: item.nameAm,
        price: item.price,
        image: item.image,
        quantity: quantity
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Dispatch custom event for navbar update
    window.dispatchEvent(new Event('cartUpdated'));
    
    toast.success(`${item.name} added to cart!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    closeModal();
  };

  // Quick add to cart (with quantity 1)
  const quickAddToCart = (item, e) => {
    e.stopPropagation();
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItemIndex = cart.findIndex(i => i.id === item.id);
    
    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        nameAm: item.nameAm,
        price: item.price,
        image: item.image,
        quantity: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    window.dispatchEvent(new Event('cartUpdated'));
    
    toast.success(`${item.name} added to cart!`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
    });
  };

  // Render stars for rating
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

  return (
    <div className="menu-page">
      {/* Hero Section */}
      <section className="menu-hero">
        <div className="container">
          <h1 className="menu-hero-title">Our Menu</h1>
          <p className="menu-hero-subtitle">Discover our delicious selection of burgers, pizzas, sandwiches, and traditional Ethiopian dishes</p>
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
              
              <div className="filter-row">
                <span className="filter-label">Price Range: ETB {priceRange[0]} - {priceRange[1]}</span>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="price-range"
                />
              </div>
              
              <button 
                className="clear-filters"
                onClick={() => {
                  setFilters({vegetarian: false, spicy: false, signature: false});
                  setPriceRange([0, 1000]);
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
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
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
                categories.find(c => c.id === activeCategory)?.name}
            </h2>
            <p className="section-description">
              {filteredItems.length} items available
            </p>
          </div>

          {filteredItems.length === 0 ? (
            <div className="no-items">
              <h3>No items found</h3>
              <p>Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="menu-grid">
              {filteredItems.map(item => (
                <div key={item.id} className="menu-card" onClick={() => handleItemClick(item)}>
                  <div className="menu-card-image">
                    <img src={item.image} alt={item.name} />
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
                <img src={selectedItem.image} alt={selectedItem.name} />
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
                  <div className="modal-info-item">
                    <span className="info-label">Spice Level:</span>
                    <span className="info-value spice">{selectedItem.spiceLevel}</span>
                  </div>
                  <div className="modal-info-item">
                    <span className="info-label">Calories:</span>
                    <span className="info-value">{selectedItem.calories}</span>
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
                
                <div className="modal-actions">
                  <Link to="/cart" className="view-cart-link">
                    View Cart
                  </Link>
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