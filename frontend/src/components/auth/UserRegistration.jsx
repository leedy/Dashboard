import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UserAuth.css';

function UserRegistration() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="user-auth-container">
      <div className="user-auth-card">
        <div className="user-auth-header">
          <h1>Create Account</h1>
          <p>Sign up for your Dashboard account</p>
        </div>

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
            className="user-auth-button primary"
            disabled={loading || !username || !password || !displayName}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

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
        </form>
      </div>
    </div>
  );
}

export default UserRegistration;
