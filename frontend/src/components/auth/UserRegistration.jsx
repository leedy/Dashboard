import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserAuth.css';

function UserRegistration() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Check if this is the first user (admin setup)
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await axios.get('/api/auth/setup-needed');
        setIsFirstUser(response.data.setupNeeded);
      } catch (error) {
        console.error('Error checking setup status:', error);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetupStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    const result = await register(username, password, displayName, email);

    if (result.success) {
      // Redirect to home/dashboard
      navigate('/');
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="user-auth-container">
        <div className="user-auth-card">
          <div className="user-auth-header">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-auth-container">
      <div className="user-auth-card">
        {isFirstUser ? (
          <div className="user-auth-header admin-setup-header">
            <h1>🔐 Admin Account Setup</h1>
            <p className="admin-setup-subtitle">Welcome! Let's create your administrator account.</p>
            <div className="admin-setup-info">
              <p><strong>Important:</strong> As the first user, you will automatically receive administrator privileges.</p>
              <p className="admin-perks">Admin access includes:</p>
              <ul className="admin-perks-list">
                <li>System-wide settings management</li>
                <li>User account administration</li>
                <li>Dashboard asset management</li>
                <li>Usage analytics and monitoring</li>
              </ul>
              <p className="admin-note">You can designate additional administrators later from the Admin Panel.</p>
            </div>
          </div>
        ) : (
          <div className="user-auth-header">
            <h1>Create Account</h1>
            <p>Sign up for your Dashboard account</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="user-auth-form">
          <div className="user-auth-field">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
              autoFocus
              disabled={loading}
              required
            />
          </div>

          <div className="user-auth-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="Choose a username"
              disabled={loading}
              required
              minLength={3}
              maxLength={30}
            />
            <small className="user-auth-hint">3-30 characters, lowercase</small>
          </div>

          <div className="user-auth-field">
            <label htmlFor="email">Email (Optional)</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="user-auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              disabled={loading}
              required
              minLength={6}
            />
            <small className="user-auth-hint">Minimum 6 characters</small>
          </div>

          <div className="user-auth-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          {error && <div className="user-auth-error">{error}</div>}

          <button
            type="submit"
            className={`user-auth-button primary ${isFirstUser ? 'admin-setup-button' : ''}`}
            disabled={loading || !username || !password || !displayName}
          >
            {loading ? 'Creating Account...' : (isFirstUser ? '🔐 Create Admin Account' : 'Sign Up')}
          </button>

          {!isFirstUser && (
            <div className="user-auth-footer">
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="user-auth-link"
                  onClick={() => navigate('/login')}
                  disabled={loading}
                >
                  Log in
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default UserRegistration;
