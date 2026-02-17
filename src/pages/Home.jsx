import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUtensils, FaClock, FaMapMarkerAlt, FaPhone, 
  FaStar, FaStarHalfAlt, FaRegStar, FaChevronLeft,
  FaChevronRight, FaCheckCircle, FaCoffee, FaLeaf,
  FaUsers, FaTrophy, FaHeart, FaInstagram, FaTelegram,
  FaPizzaSlice, FaHamburger, FaDrumstickBite, FaFish,
  FaPepperHot, FaCheese, FaEgg, FaBreadSlice
} from 'react-icons/fa';
import { GiMeat, GiBowlOfRice, GiChickenLeg, GiCoffeeBeans, GiFrenchFries } from 'react-icons/gi';
import { MdDeliveryDining, MdRestaurantMenu, MdLocalPizza } from 'react-icons/md';
import { RiRestaurantLine, RiTakeawayLine } from 'react-icons/ri';
import { IoFastFoodOutline } from 'react-icons/io5';
import { TbBread } from 'react-icons/tb';
import './Home.css';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [stats, setStats] = useState({
    customers: 0,
    dishes: 0,
    years: 0,
    awards: 0
  });

  // Hero Slider Images
  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      title: 'Enjoy with Best City View',
      subtitle: 'SEWRICA Cafe',
      description: 'Experience delicious food with breathtaking views of Addis Ababa'
    },
    {
      image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      title: 'Delicious Food',
      subtitle: 'From Burgers to Traditional Ethiopian Cuisine',
      description: 'Order your favorites online for delivery or take-out'
    },
    {
      image: 'https://images.unsplash.com/photo-1517244683847-7456ed63a8f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      title: 'ምርጥ የከተማ እይታ',
      subtitle: 'SEWRICA ካፌ',
      description: 'በሚያማምሩ እይታዎች እና ጣፋጭ ምግቦች ይደሰቱ'
    }
  ];

  // Complete Menu Data based on your images
  const menuItems = [
    // Burgers Section
    {
      id: 1,
      name: 'Beef Burger',
      nameAm: 'በፍ በርግር',
      description: 'Sandwich consisting of a cooked patty of ground beef placed inside a sliced bun, often accompanied by various condiments and toppings.',
      price: 380,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'burgers',
      spiceLevel: '🌶️',
      prepTime: '15 min',
      isVegetarian: false,
      popular: true
    },
    {
      id: 2,
      name: 'Cheese Burger',
      nameAm: 'ችዝ በርግር',
      description: 'A hamburger with a slice of cheese melted on top of the meat patty.',
      price: 450,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'burgers',
      spiceLevel: '🌶️',
      prepTime: '15 min',
      isVegetarian: false,
      popular: true
    },
    {
      id: 3,
      name: 'Chicken Burger',
      nameAm: 'ዶሮ በርግር',
      description: 'A sandwich that features a cooked patty of ground chicken or a whole chicken fillet, typically grilled or fried, served in a sliced bun with various toppings.',
      price: 650,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1606755962773-d324e9a3e4d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'burgers',
      spiceLevel: '🌶️🌶️',
      prepTime: '18 min',
      isVegetarian: false
    },
    {
      id: 4,
      name: 'Sewrica Burger',
      nameAm: 'ሰውሪካ በርግር',
      description: 'Best burger for all - Our signature special burger with premium ingredients',
      price: 680,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'burgers',
      spiceLevel: '🌶️🌶️',
      prepTime: '20 min',
      isVegetarian: false,
      popular: true,
      signature: true,
     
    },

    // Sandwiches Section
    {
      id: 5,
      name: 'Chicken Sandwich',
      nameAm: 'ዶሮ ሳንድዊች',
      description: 'Sandwich made with a piece of cooked chicken, such as a fried or grilled fillet, or sliced or shredded meat, served between slices of bread or on a bun with various condiments and toppings.',
      price: 450,
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1606755962773-d324e9a3e4d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'sandwiches',
      spiceLevel: '🌶️',
      prepTime: '12 min',
      isVegetarian: false
    },
    {
      id: 6,
      name: 'Club Sandwich',
      nameAm: 'ክለብ ሳንድዊች',
      description: 'Double-decker sandwich made with three slices of toasted bread, traditionally filled with sliced poultry like turkey or chicken, bacon, lettuce, tomato, and mayonnaise, and then cut into quarters.',
      price: 385,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'sandwiches',
      spiceLevel: '🌶️',
      prepTime: '15 min',
      isVegetarian: false
    },

    // Fast Food Section
    {
      id: 7,
      name: 'Beyaynet',
      nameAm: 'በያይነት',
      description: 'Combination platter consisting of various colorful vegetable and legume stews arranged on top of a large, spongy, sourdough flatbread called injera.',
      price: 250,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fastfood',
      spiceLevel: '🌶️🌶️',
      prepTime: '15 min',
      isVegetarian: true,
      popular: true
    },
    {
      id: 8,
      name: 'Sewrica Yetsom Agelgil',
      nameAm: 'ሰውሪካ የጾም አገልግል',
      description: 'Distinctive lidded basket often covered in leather, used to transport a meal of injera and various stews (wot).',
      price: 650,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1543353071-8735f4c8f5c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fastfood',
      spiceLevel: '🌶️🌶️',
      prepTime: '20 min',
      isVegetarian: true,
      signature: true,
      popular: true,
      greekText: 'Από-ζήτηση για την Αθήνα'
    },
    {
      id: 9,
      name: 'Shero wot',
      nameAm: 'ሽሮ ወጥ',
      description: 'Made from powdered chickpeas or broad beans, slow-simmered with onions, garlic, and spicy berbere seasoning into a thick and savory purée.',
      price: 160,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1543353071-8735f4c8f5c3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fastfood',
      spiceLevel: '🌶️🌶️',
      prepTime: '15 min',
      isVegetarian: true
    },

    // Pizza Section
    {
      id: 10,
      name: 'Beef Pizza',
      nameAm: 'በፍ ፒዛ',
      description: 'A baked flatbread topped with tomato sauce, cheese, and various forms of seasoned beef, such as ground beef or sliced steak.',
      price: 450,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️🌶️',
      prepTime: '20 min',
      isVegetarian: false
    },
    {
      id: 11,
      name: 'Cheese Pizza',
      nameAm: 'ችዝ ፒዛ',
      description: 'Baked flatbread topped with tomato sauce and one or more types of cheese.',
      price: 550,
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️',
      prepTime: '18 min',
      isVegetarian: true
    },
    {
      id: 12,
      name: 'Chicken Pizza',
      nameAm: 'ዶሮ ፒዛ',
      description: 'A baked flatbread topped with tomato sauce, cheese, and pieces of cooked, seasoned chicken.',
      price: 550,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️🌶️',
      prepTime: '20 min',
      isVegetarian: false,
      popular: true
    },
    {
      id: 13,
      name: 'Sewrica Pizza',
      nameAm: 'ሰውሪካ ፒዛ',
      description: 'Our signature pizza - a globally cherished dish featuring a baked dough crust topped with sauce, cheese, and a wide variety of other ingredients.',
      price: 625,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1593504049359-74330189a345?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️🌶️',
      prepTime: '22 min',
      isVegetarian: false,
      signature: true,
      popular: true
    },
    {
      id: 14,
      name: 'Tuna Pizza',
      nameAm: 'ቱና ፒዛ',
      description: 'Baked flatbread topped with tomato sauce, cheese, and flakes of tuna, often combined with other ingredients like onions, olives, or sweetcorn.',
      price: 450,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️',
      prepTime: '18 min',
      isVegetarian: false
    },
    {
      id: 15,
      name: 'Vegetable Pizza',
      nameAm: 'አትክልት ፒዛ',
      description: 'A baked, round flatbread topped with tomato sauce, cheese, and a variety of different vegetables.',
      price: 430,
      rating: 4.4,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'pizza',
      spiceLevel: '🌶️',
      prepTime: '18 min',
      isVegetarian: true
    },

    // Wraps
    {
      id: 16,
      name: 'Special Wrap',
      nameAm: 'ልዩ ራፕ',
      description: 'Delicious wrap filled with fresh ingredients including bread, fried potatoes, meat, egg, cheese, ketchup, mayonnaise, and special spices.',
      price: 330,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'wraps',
      spiceLevel: '🌶️',
      prepTime: '12 min',
      isVegetarian: false,
      popular: true
    },

    // Fetira
    {
      id: 17,
      name: 'Chechebsa with Egg',
      nameAm: 'በለጠ ከእንቁላል ጋር',
      description: 'Traditional Ethiopian fried flatbread served with egg, honey, and butter',
      price: 280,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fetira',
      spiceLevel: '🌶️',
      prepTime: '10 min',
      isVegetarian: false,
      popular: true
    },
    {
      id: 18,
      name: 'Chechebsa',
      nameAm: 'በለጠ',
      description: 'Traditional Ethiopian fried flatbread served with honey and butter',
      price: 220,
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fetira',
      spiceLevel: '🌶️',
      prepTime: '8 min',
      isVegetarian: true
    },
    {
      id: 19,
      name: 'Fetira',
      nameAm: 'ፈጢራ',
      description: 'Traditional Ethiopian layered flatbread, perfect for breakfast or anytime',
      price: 220,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      category: 'fetira',
      spiceLevel: '🌶️',
      prepTime: '8 min',
      isVegetarian: true
    }
  ];

  // Filter menu items based on active category
  const filteredItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  // Get popular items
  const popularItems = menuItems.filter(item => item.popular).slice(0, 4);

  // Get signature items
  const signatureItems = menuItems.filter(item => item.signature);

  // Testimonials
  const testimonials = [
    {
      id: 1,
      name: 'Abebe Kebede',
      image: 'https://randomuser.me/api/portraits/men/1.jpg',
      rating: 5,
      comment: 'Best view in Addis! The Sewrica Burger is absolutely amazing. Love the atmosphere and food.',
      date: 'March 2024',
      platform: 'Google'
    },
    {
      id: 2,
      name: 'Sara Hailu',
      image: 'https://randomuser.me/api/portraits/women/2.jpg',
      rating: 5,
      comment: 'The city view from this cafe is breathtaking. Their pizza and traditional dishes are delicious!',
      date: 'February 2024',
      platform: 'TripAdvisor'
    },
    {
      id: 3,
      name: 'John Smith',
      image: 'https://randomuser.me/api/portraits/men/3.jpg',
      rating: 5,
      comment: 'Great food, amazing view, excellent service. The Chechebsa is my favorite breakfast now.',
      date: 'January 2024',
      platform: 'Facebook'
    }
  ];

  // Stats Animation
  useEffect(() => {
    const targetStats = {
      customers: 10000,
      dishes: 75,
      years: 8,
      awards: 12
    };

    const duration = 2000;
    const steps = 50;
    const increment = {
      customers: targetStats.customers / steps,
      dishes: targetStats.dishes / steps,
      years: targetStats.years / steps,
      awards: targetStats.awards / steps
    };

    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep < steps) {
        setStats(prev => ({
          customers: Math.min(prev.customers + increment.customers, targetStats.customers),
          dishes: Math.min(prev.dishes + increment.dishes, targetStats.dishes),
          years: Math.min(prev.years + increment.years, targetStats.years),
          awards: Math.min(prev.awards + increment.awards, targetStats.awards)
        }));
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, []);

  // Hero Slider Controls
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="home-page">
      {/* Hero Section with Slider */}
      <section className="hero-section">
        <div className="hero-slider">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${slide.image})` }}
            >
              <div className="hero-content">
                <h1 className="hero-title">{slide.title}</h1>
                <h2 className="hero-subtitle">{slide.subtitle}</h2>
                <p className="hero-description">{slide.description}</p>
                <div className="hero-buttons">
                  <Link to="/menu" className="btn-primary">
                    <MdRestaurantMenu /> Order Online
                  </Link>
                  <Link to="/contact" className="btn-secondary">
                    <FaMapMarkerAlt /> Find Us
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="slider-control prev" onClick={prevSlide}>
          <FaChevronLeft />
        </button>
        <button className="slider-control next" onClick={nextSlide}>
          <FaChevronRight />
        </button>

        <div className="slider-dots">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="container">
          <div className="welcome-content">
            <div className="welcome-text">
              <span className="section-subtitle">ሰላም! Welcome to</span>
              <h2 className="section-title">SEWRICA Cafe</h2>
              <div className="title-underline"></div>
              <p className="welcome-description">
                <strong>Enjoy with Best City View and Delicious Food</strong>
              </p>
              <p className="welcome-description">
                Located in the heart of Addis Ababa at Megenagna's Metebaber Building on the 2nd floor, 
                SEWRICA Cafe offers you the perfect combination of breathtaking city views and exceptional cuisine.
              </p>
              <p className="welcome-description">
                From our signature Sewrica Burger and Sewrica Pizza to traditional Ethiopian dishes like 
                Beyaynet and Chechebsa, we have something for everyone. Order your favorites online for 
                delivery or take-out, or join us in person for an unforgettable dining experience.
              </p>
              <div className="welcome-features">
                <div className="welcome-feature">
                  <FaCheckCircle className="feature-icon" />
                  <span>Best City View</span>
                </div>
                <div className="welcome-feature">
                  <FaCheckCircle className="feature-icon" />
                  <span>Signature Burgers</span>
                </div>
                <div className="welcome-feature">
                  <FaCheckCircle className="feature-icon" />
                  <span>Traditional Cuisine</span>
                </div>
                <div className="welcome-feature">
                  <FaCheckCircle className="feature-icon" />
                  <span>Free Delivery</span>
                </div>
              </div>
              <Link to="/menu" className="btn-primary">
                Order Now
              </Link>
            </div>
            <div className="welcome-image">
              <img 
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="SEWRICA Cafe City View"
              />
              <div className="image-badge">
                <FaCoffee />
                <span>Best City View</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Our Menu</span>
            <h2 className="section-title">Browse Categories</h2>
            <div className="title-underline"></div>
          </div>

          <div className="categories-grid">
            <button
              className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <MdRestaurantMenu className="category-icon" />
              <span>All Items</span>
            </button>
            <button
              className={`category-btn ${activeCategory === 'burgers' ? 'active' : ''}`}
              onClick={() => setActiveCategory('burgers')}
            >
              <FaHamburger className="category-icon" />
              <span>Burgers</span>
            </button>
            <button
              className={`category-btn ${activeCategory === 'sandwiches' ? 'active' : ''}`}
              onClick={() => setActiveCategory('sandwiches')}
            >
              <FaBreadSlice className="category-icon" />
              <span>Sandwiches</span>
            </button>
            <button
              className={`category-btn ${activeCategory === 'fastfood' ? 'active' : ''}`}
              onClick={() => setActiveCategory('fastfood')}
            >
              <IoFastFoodOutline className="category-icon" />
              <span>Fast Food</span>
            </button>
            <button
              className={`category-btn ${activeCategory === 'pizza' ? 'active' : ''}`}
              onClick={() => setActiveCategory('pizza')}
            >
              <MdLocalPizza className="category-icon" />
              <span>Pizza</span>
            </button>
            <button
              className={`category-btn ${activeCategory === 'wraps' ? 'active' : ''}`}
              onClick={() => setActiveCategory('wraps')}
            >
              <RiTakeawayLine className="category-icon" />
              <span>Wraps</span>
            </button>
            <button
              className={`category-btn ${activeCategory === 'fetira' ? 'active' : ''}`}
              onClick={() => setActiveCategory('fetira')}
            >
              <TbBread className="category-icon" />
              <span>Fetia</span>
            </button>
            <button
              className={`category-btn ${activeCategory === 'traditional' ? 'active' : ''}`}
              onClick={() => setActiveCategory('traditional')}
            >
              <RiRestaurantLine className="category-icon" />
              <span>Traditional</span>
            </button>
          </div>
        </div>
      </section>

      {/* Signature Items */}
      {signatureItems.length > 0 && (
        <section className="signature-section">
          <div className="container">
            <div className="signature-banner">
              <h3 className="signature-title">SEWRICA Signature Specials</h3>
              <p className="signature-subtitle">Our chef's special creations you won't find anywhere else</p>
            </div>
            <div className="signature-grid">
              {signatureItems.map(item => (
                <div key={item.id} className="signature-card">
                  <div className="signature-image">
                    <img src={item.image} alt={item.name} />
                    <div className="signature-badge">Signature</div>
                  </div>
                  <div className="signature-info">
                    <h4 className="signature-item-name">{item.name}</h4>
                    <p className="signature-item-name-am">{item.nameAm}</p>
                    {item.greekText && <p className="dish-greek-text">{item.greekText}</p>}
                    <p className="signature-item-desc">{item.description.substring(0, 40)}...</p>
                    <div className="signature-footer">
                      <span className="signature-price">ETB {item.price}</span>
                      <Link to={`/menu/${item.id}`} className="btn-signature">Order Now</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Menu Items */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Our Specialties</span>
            <h2 className="section-title">
              {activeCategory === 'all' ? 'Popular Items' : 
                activeCategory === 'burgers' ? 'Burgers' :
                activeCategory === 'sandwiches' ? 'Sandwiches' :
                activeCategory === 'fastfood' ? 'Fast Food' :
                activeCategory === 'pizza' ? 'Pizza' :
                activeCategory === 'wraps' ? 'Wraps' :
                activeCategory === 'fetira' ? 'Fetia' : 'Traditional'}
            </h2>
            <div className="title-underline"></div>
          </div>

          <div className="featured-grid">
            {(activeCategory === 'all' ? popularItems : filteredItems.slice(0, 4)).map((item) => (
              <div key={item.id} className="featured-card">
                <div className="dish-image">
                  <img src={item.image} alt={item.name} />
                  <div className="dish-badge">
                    {item.category === 'burgers' ? 'Burgers' :
                     item.category === 'sandwiches' ? 'Sandwiches' :
                     item.category === 'fastfood' ? 'Fast Food' :
                     item.category === 'pizza' ? 'Pizza' :
                     item.category === 'wraps' ? 'Wraps' :
                     item.category === 'fetira' ? 'Fetia' : 'Traditional'}
                  </div>
                  {item.isVegetarian && (
                    <div className="veg-badge">
                      <FaLeaf /> Veg
                    </div>
                  )}
                  {item.signature && (
                    <div className="signature-badge-small">Signature</div>
                  )}
                </div>
                <div className="dish-info">
                  <div className="dish-header">
                    <h3 className="dish-name">
                      {item.name}
                      <span className="dish-name-am">{item.nameAm}</span>
                    </h3>
                    <div className="dish-rating">
                      {renderStars(item.rating)}
                      <span className="rating-value">{item.rating}</span>
                    </div>
                  </div>
                  {item.greekText && <p className="dish-greek-text">{item.greekText}</p>}
                  <p className="dish-description">{item.description.substring(0, 80)}...</p>
                  <div className="dish-meta">
                    <span className="spice-level">{item.spiceLevel}</span>
                    <span className="prep-time">
                      <FaClock /> {item.prepTime}
                    </span>
                  </div>
                  <div className="dish-footer">
                    <span className="dish-price">ETB {item.price}</span>
                    <Link to={`/menu/${item.id}`} className="btn-order">
                      Order Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-footer">
            <Link to="/menu" className="btn-primary">
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-number">{Math.round(stats.customers)}+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <MdRestaurantMenu />
              </div>
              <div className="stat-number">{Math.round(stats.dishes)}+</div>
              <div className="stat-label">Menu Items</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <GiCoffeeBeans />
              </div>
              <div className="stat-number">{Math.round(stats.years)}+</div>
              <div className="stat-label">Years Serving</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <FaTrophy />
              </div>
              <div className="stat-number">{Math.round(stats.awards)}+</div>
              <div className="stat-label">Awards Won</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Why Choose Us</span>
            <h2 className="section-title">The SEWRICA Experience</h2>
            <div className="title-underline"></div>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper"><FaMapMarkerAlt /></div>
              <h3 className="feature-title">Best City View</h3>
              <h4 className="feature-title-am">ምርጥ የከተማ እይታ</h4>
              <p className="feature-description">Enjoy panoramic views of Addis Ababa from our 2nd floor location at Metebaber Building.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><FaHamburger /></div>
              <h3 className="feature-title">Signature Burgers</h3>
              <h4 className="feature-title-am">ልዩ በርገር</h4>
              <p className="feature-description">Try our famous Sewrica Burger and other unique burger creations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><MdLocalPizza /></div>
              <h3 className="feature-title">Gourmet Pizza</h3>
              <h4 className="feature-title-am">ጎርሜ ፒዛ</h4>
              <p className="feature-description">From classic to signature Sewrica Pizza, we have something for everyone.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><RiRestaurantLine /></div>
              <h3 className="feature-title">Traditional Dishes</h3>
              <h4 className="feature-title-am">ባህላዊ ምግቦች</h4>
              <p className="feature-description">Authentic Ethiopian cuisine including Beyaynet, Shero wot, and Chechebsa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Customer Reviews</span>
            <h2 className="section-title">What Our Guests Say</h2>
            <div className="title-underline"></div>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-header">
                  <img src={testimonial.image} alt={testimonial.name} className="testimonial-image" />
                  <div className="testimonial-info">
                    <h4 className="testimonial-name">{testimonial.name}</h4>
                    <div className="testimonial-rating">
                      {[...Array(5)].map((_, i) => (
                        <FaStar 
                          key={i} 
                          className={i < testimonial.rating ? 'star-filled' : 'star-empty'} 
                        />
                      ))}
                    </div>
                    <span className="testimonial-platform">{testimonial.platform}</span>
                  </div>
                </div>
                <p className="testimonial-comment">"{testimonial.comment}"</p>
                <span className="testimonial-date">{testimonial.date}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Experience the Best City View & Delicious Food?</h2>
            <p className="cta-description">
              Order your favorites online for delivery or take-out, or visit us at Megenagna, Metebaber Building, 2nd Floor
            </p>
            <div className="cta-buttons">
              <Link to="/menu" className="btn-primary btn-large">
                Order Online
              </Link>
              <Link to="/contact" className="btn-secondary btn-large">
                <FaMapMarkerAlt /> Find Us
              </Link>
            </div>
            <div className="cta-contact">
              <FaPhone className="cta-phone-icon" />
              <span className="cta-phone">+251 911 234 567</span>
            </div>
            <p className="cta-hours">
              <FaClock /> Open Daily: 8:00 AM - 10:00 PM
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;