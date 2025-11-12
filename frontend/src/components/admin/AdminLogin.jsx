import { useState } from 'react';
import './AdminLogin.css';

function AdminLogin({ onLoginSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid password');
        setLoading(false);
        return;
      }

      // Save token to localStorage
      localStorage.setItem('adminToken', data.token);

      // Call success callback
      onLoginSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to server');
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-overlay">
      <div className="admin-login-modal">
        <div className="admin-login-header">
          <h2>🔐 Admin Login</h2>
          <button className="admin-login-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-field">
            <label htmlFor="password">Admin Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && <div className="admin-login-error">{error}</div>}

          <div className="admin-login-actions">
            <button
              type="button"
              onClick={onCancel}
              className="admin-login-button cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-login-button submit"
              disabled={loading || !password}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        <div className="admin-login-footer">
          <p className="admin-login-note">
            ℹ️ Contact the administrator if you need access
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
