import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('userToken'));

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('userToken');

      if (savedToken) {
        try {
          // Verify token is still valid
          const response = await axios.get('/api/auth/verify', {
            headers: {
              Authorization: `Bearer ${savedToken}`
            }
          });

          if (response.data.valid) {
            setToken(savedToken);
            setUser(response.data.user);
          } else {
            // Token invalid, clear it
            localStorage.removeItem('userToken');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Token expired or invalid
          localStorage.removeItem('userToken');
          setToken(null);
          setUser(null);
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Update axios defaults when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      const { token: newToken, user: userData } = response.data;

      // Save token to localStorage
      localStorage.setItem('userToken', newToken);
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (username, password, displayName, email = '') => {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        password,
        displayName,
        email: email || undefined
      });

      const { token: newToken, user: userData } = response.data;

      // Save token to localStorage
      localStorage.setItem('userToken', newToken);
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    setToken(null);
    setUser(null);
  };

  const updateUser = async () => {
    if (!token) return;

    try {
      const response = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUser(response.data);
    } catch (error) {
      console.error('Failed to update user data:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
