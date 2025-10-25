import { useState, useEffect } from 'react';
import axios from 'axios';
import './PhotoManagement.css';

const CATEGORIES = [
  { id: 'family-photos', label: 'Family Photos', icon: '📸' },
  { id: 'event-slides', label: 'Event Slides', icon: '📊' },
  { id: 'dashboard-assets', label: 'Dashboard Assets', icon: '🎨' }
];

function PhotoManagement() {
  const [activeCategory, setActiveCategory] = useState('family-photos');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    fetchPhotos(activeCategory);
  }, [activeCategory]);

  const fetchPhotos = async (category) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/photos?category=${category}`);
      setPhotos(response.data);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 5MB.');
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('category', activeCategory);

      await axios.post('/api/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh photo list
      await fetchPhotos(activeCategory);

      // Clear file input
      event.target.value = '';
    } catch (err) {
      console.error('Error uploading photo:', err);
      setUploadError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      await axios.delete(`/api/photos/${photoId}`);
      // Refresh photo list
      await fetchPhotos(activeCategory);
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Failed to delete photo');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="photo-management">
      <div className="photo-management-header">
        <h2>Photo Management</h2>
        <p>Upload and manage photos for your dashboards</p>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-label">{category.label}</span>
            <span className="category-count">
              ({photos.filter(p => p.category === category.id).length})
            </span>
          </button>
        ))}
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <label htmlFor="photo-upload" className="upload-button">
          {uploading ? '⏳ Uploading...' : '📤 Upload Photo'}
          <input
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        {uploadError && <div className="upload-error">{uploadError}</div>}
        <div className="upload-info">
          <small>Supported formats: JPG, PNG, GIF, WebP | Max size: 5MB</small>
        </div>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="loading-message">Loading photos...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : photos.length === 0 ? (
        <div className="empty-message">
          <p>📷 No photos in this category yet.</p>
          <p>Upload your first photo to get started!</p>
        </div>
      ) : (
        <div className="photos-grid">
          {photos.map(photo => (
            <div key={photo._id} className="photo-card">
              <div className="photo-thumbnail">
                <img
                  src={`/api/photos/${photo._id}`}
                  alt={photo.filename}
                  loading="lazy"
                />
              </div>
              <div className="photo-info">
                <div className="photo-filename" title={photo.filename}>
                  {photo.filename}
                </div>
                <div className="photo-details">
                  <span>{photo.width} × {photo.height}</span>
                  <span>•</span>
                  <span>{formatFileSize(photo.fileSize)}</span>
                </div>
                <div className="photo-date">{formatDate(photo.uploadDate)}</div>
              </div>
              <button
                className="photo-delete"
                onClick={() => handleDelete(photo._id, photo.filename)}
                title="Delete photo"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PhotoManagement;
