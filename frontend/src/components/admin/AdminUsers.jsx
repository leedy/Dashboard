import { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminUsers.css';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Token is automatically included via axios defaults from AuthContext
      const response = await axios.get('/api/admin/auth/users');

      setUsers(response.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      // Token is automatically included via axios defaults from AuthContext
      await axios.patch(`/api/admin/auth/users/${userId}/admin`,
        { isAdmin: !currentStatus }
      );

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, isAdmin: !currentStatus } : user
      ));
    } catch (err) {
      console.error('Error toggling admin status:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update admin status';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Check if a user is the last admin
  const isLastAdmin = (user) => {
    if (!user.isAdmin) return false;
    const adminCount = users.filter(u => u.isAdmin).length;
    return adminCount === 1;
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="admin-users">
        <div className="loading-state">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-users">
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="users-header">
        <h2>Registered Users</h2>
        <div className="users-count">Total: {users.length}</div>
      </div>

      {users.length === 0 ? (
        <div className="no-users">No registered users found.</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Display Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Admin</th>
                <th>Created</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isProtected = isLastAdmin(user);
                return (
                  <tr key={user.id}>
                    <td className="username-cell">{user.username}</td>
                    <td>{user.displayName}</td>
                    <td className="email-cell">{user.email}</td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`admin-toggle-btn ${user.isAdmin ? 'admin' : 'non-admin'} ${isProtected ? 'protected' : ''}`}
                        onClick={() => !isProtected && toggleAdminStatus(user.id, user.isAdmin)}
                        title={
                          isProtected
                            ? 'Last admin - cannot be removed'
                            : user.isAdmin
                              ? 'Click to remove admin'
                              : 'Click to make admin'
                        }
                        disabled={isProtected}
                      >
                        {user.isAdmin ? 'Admin' : 'User'}
                        {isProtected && ' 🔒'}
                      </button>
                    </td>
                    <td>{formatShortDate(user.createdAt)}</td>
                    <td>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
