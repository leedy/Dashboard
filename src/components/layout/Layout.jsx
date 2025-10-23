import './Layout.css';

function Layout({ children, currentDashboard, onDashboardChange }) {
  const dashboards = [
    { id: 'todays-games', name: "Today's Games", available: true },
    { id: 'standings', name: 'Standings', available: true },
    { id: 'weather', name: 'Weather', available: true },
    { id: 'countdown', name: 'Countdown', available: true },
    { id: 'disney', name: 'Disney Info', available: true },
  ];

  return (
    <div className="layout">
      <header className="header">
        <h1>My Dashboard</h1>
        <nav className="nav">
          {dashboards.map(dashboard => (
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
            className={`nav-button settings-button ${currentDashboard === 'settings' ? 'active' : ''}`}
            onClick={() => onDashboardChange('settings')}
          >
            ⚙️ Settings
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
