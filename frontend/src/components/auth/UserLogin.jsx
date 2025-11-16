import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UserAuth.css';

function UserLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

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
          <h1>Welcome Back</h1>
          <p>Log in to your Dashboard account</p>
        </div>

        <form onSubmit={handleSubmit} className="user-auth-form">
          <div className="user-auth-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              disabled={loading}
              required
            />
          </div>

          <div className="user-auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          {error && <div className="user-auth-error">{error}</div>}

          <button
            type="submit"
            className="user-auth-button primary"
            disabled={loading || !username || !password}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <div className="user-auth-footer">
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="user-auth-link"
                onClick={() => navigate('/register')}
                disabled={loading}
              >
                Sign up
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserLogin;
