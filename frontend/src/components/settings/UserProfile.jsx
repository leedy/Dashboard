import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import './UserProfile.css';

function UserProfile() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    displayName: '',
    createdAt: null
  });

  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    displayName: ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password changing
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setProfile(response.data);
      setEditForm({
        email: response.data.email || '',
        displayName: response.data.displayName || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfileError('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditForm({
      email: profile.email || '',
      displayName: profile.displayName || ''
    });
    setProfileError('');
  };

  const handleSaveProfile = async () => {
    try {
      setProfileError('');
      setProfileSuccess('');

      const response = await axios.patch('/api/auth/profile', editForm, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setProfile(prev => ({
        ...prev,
        email: response.data.user.email,
        displayName: response.data.user.displayName
      }));

      setIsEditingProfile(false);
      setProfileSuccess('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);

      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="loading-message">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="profile-section">
        <div className="profile-section-header">
          <h2>Profile Information</h2>
          {!isEditingProfile && (
            <button className="profile-edit-button" onClick={handleEditProfile}>
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {profileError && <div className="profile-error">{profileError}</div>}
        {profileSuccess && <div className="profile-success">{profileSuccess}</div>}

        <div className="profile-info">
          <div className="profile-field">
            <label>Username</label>
            <div className="profile-value readonly">{profile.username}</div>
            <small className="profile-hint">Username cannot be changed</small>
          </div>

          <div className="profile-field">
            <label>Display Name</label>
            {isEditingProfile ? (
              <input
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                placeholder="Your display name"
                maxLength={50}
              />
            ) : (
              <div className="profile-value">{profile.displayName}</div>
            )}
          </div>

          <div className="profile-field">
            <label>Email</label>
            {isEditingProfile ? (
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="your@email.com (optional)"
              />
            ) : (
              <div className="profile-value">{profile.email || <em>Not set</em>}</div>
            )}
          </div>

          <div className="profile-field">
            <label>Member Since</label>
            <div className="profile-value readonly">
              {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Unknown'}
            </div>
          </div>

          {isEditingProfile && (
            <div className="profile-actions">
              <button className="profile-button cancel" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="profile-button save" onClick={handleSaveProfile}>
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-section-header">
          <h2>Change Password</h2>
        </div>

        {passwordError && <div className="profile-error">{passwordError}</div>}
        {passwordSuccess && <div className="profile-success">{passwordSuccess}</div>}

        {!isChangingPassword ? (
          <button
            className="profile-button primary"
            onClick={() => setIsChangingPassword(true)}
          >
            🔒 Change Password
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="password-form">
            <div className="profile-field">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password"
                required
                autoFocus
              />
            </div>

            <div className="profile-field">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password (min 6 characters)"
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                required
              />
            </div>

            <div className="profile-actions">
              <button
                type="button"
                className="profile-button cancel"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                }}
              >
                Cancel
              </button>
              <button type="submit" className="profile-button save">
                Change Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
