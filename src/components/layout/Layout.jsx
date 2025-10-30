import './Layout.css';

function Layout({ children, currentDashboard, onDashboardChange, photoCounts }) {
  const dashboards = [
    { id: 'todays-games', name: "Today's Games", available: true },
    { id: 'upcoming-games', name: 'Upcoming Games', available: true },
    { id: 'standings', name: 'Standings', available: true },
    { id: 'weather', name: 'Weather', available: true },
    { id: 'countdown', name: 'Countdown', available: true },
    { id: 'disney', name: 'Disney Info', available: true },
    { id: 'movies', name: 'Movies', available: true },
    { id: 'family-photos', name: 'Family Photos', available: true, requiresPhotos: true },
    { id: 'event-slides', name: 'Event Slides', available: true, requiresPhotos: true },
  ];

  // Filter out dashboards that require photos but have none
  const visibleDashboards = dashboards.filter(dashboard => {
    if (dashboard.requiresPhotos && photoCounts) {
      return photoCounts[dashboard.id] > 0;
    }
    return true;
  });

  return (
    <div className="layout">
      <header className="header">
        <nav className="nav">
          {visibleDashboards.map(dashboard => (
            <button
              key={dashboard.id}
              className={`nav-button ${currentDashboard === dashboard.id ? 'active' : ''} ${!dashboard.available ? 'disabled' : ''}`}
              onClick={() => dashboard.available && onDashboardChange(dashboard.id)}
              disabled={!dashboard.available}
            >
              {dashboard.name}
              {!dashboard.available && ' (Coming Soon)'}
            </button>
          ))}
          <button
            className={`nav-button settings-button ${currentDashboard === 'admin' ? 'active' : ''}`}
            onClick={() => onDashboardChange('admin')}
          >
            ⚙️ Admin
          </button>
        </nav>
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
