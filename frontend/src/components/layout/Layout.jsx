import { useState } from 'react';
import './Layout.css';

function Layout({ children, currentDashboard, onDashboardChange, photoCounts }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState(null);

  const dashboardCategories = [
    {
      name: 'Sports',
      icon: '🏒',
      items: [
        { id: 'todays-games', name: "Today's Games", available: true },
        { id: 'upcoming-games', name: 'Upcoming Games', available: true },
        { id: 'standings', name: 'Standings', available: true },
      ]
    },
    {
      name: 'Entertainment',
      icon: '🎬',
      items: [
        { id: 'disney', name: 'Disney Info', available: true },
        { id: 'movies', name: 'Movies', available: true },
        { id: 'family-photos', name: 'Family Photos', available: true, requiresPhotos: true },
        { id: 'event-slides', name: 'Event Slides', available: true, requiresPhotos: true },
      ]
    },
    {
      name: 'Info',
      icon: 'ℹ️',
      items: [
        { id: 'weather', name: 'Weather', available: true },
        { id: 'car-wash', name: "Bob's Car Wash", available: true },
        { id: 'stocks', name: 'Market Overview', available: true },
        { id: 'countdown', name: 'Countdown', available: true },
      ]
    }
  ];

  // Filter categories to only show items with photos if needed
  const visibleCategories = dashboardCategories.map(category => ({
    ...category,
    items: category.items.filter(item => {
      if (item.requiresPhotos && photoCounts) {
        return photoCounts[item.id] > 0;
      }
      return true;
    })
  })).filter(category => category.items.length > 0);

  const handleDropdownToggle = (categoryName) => {
    setOpenDropdown(openDropdown === categoryName ? null : categoryName);
  };

  const handleMouseEnter = (categoryName) => {
    // Clear any pending close timeout
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setOpenDropdown(categoryName);
  };

  const handleMouseLeave = () => {
    // Add a small delay before closing to allow moving to dropdown
    const timeout = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
    setCloseTimeout(timeout);
  };

  const handleItemClick = (dashboardId) => {
    onDashboardChange(dashboardId);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    // Clear any pending timeout
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (categoryItems) => {
    return categoryItems.some(item => item.id === currentDashboard);
  };

  return (
    <div className="layout">
      <header className="header">
        {/* Hamburger button for mobile/tablet */}
        <button className="hamburger-button" onClick={toggleMobileMenu}>
          <span className="hamburger-icon">☰</span>
        </button>

        {/* Desktop navigation with dropdowns */}
        <nav className={`nav desktop-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {visibleCategories.map(category => (
            <div
              key={category.name}
              className="nav-dropdown"
              onMouseEnter={() => handleMouseEnter(category.name)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`nav-button dropdown-trigger ${isActive(category.items) ? 'active' : ''}`}
                onClick={() => handleDropdownToggle(category.name)}
              >
                <span className="category-icon">{category.icon}</span>
                {category.name} ▾
              </button>
              {openDropdown === category.name && (
                <div
                  className="dropdown-menu"
                  onMouseEnter={() => handleMouseEnter(category.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  {category.items.map(item => (
                    <button
                      key={item.id}
                      className={`dropdown-item ${currentDashboard === item.id ? 'active' : ''}`}
                      onClick={() => handleItemClick(item.id)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button
            className={`nav-button settings-button ${currentDashboard === 'admin' ? 'active' : ''}`}
            onClick={() => handleItemClick('admin')}
          >
            ⚙️ Admin
          </button>
        </nav>

        {/* Mobile/Tablet slide-out menu */}
        {mobileMenuOpen && (
          <>
            <div className="mobile-menu-overlay" onClick={toggleMobileMenu}></div>
            <nav className="mobile-menu">
              <div className="mobile-menu-header">
                <h3>Menu</h3>
                <button className="close-button" onClick={toggleMobileMenu}>✕</button>
              </div>
              {visibleCategories.map(category => (
                <div key={category.name} className="mobile-category">
                  <div className="mobile-category-header">
                    <span className="category-icon">{category.icon}</span>
                    {category.name}
                  </div>
                  {category.items.map(item => (
                    <button
                      key={item.id}
                      className={`mobile-menu-item ${currentDashboard === item.id ? 'active' : ''}`}
                      onClick={() => handleItemClick(item.id)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              ))}
              <div className="mobile-category">
                <button
                  className={`mobile-menu-item admin-item ${currentDashboard === 'admin' ? 'active' : ''}`}
                  onClick={() => handleItemClick('admin')}
                >
                  ⚙️ Admin
                </button>
              </div>
            </nav>
          </>
        )}
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>Dashboard App • Built with React</p>
      </footer>
    </div>
  );
}

export default Layout;
