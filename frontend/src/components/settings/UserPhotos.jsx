import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './UserPhotos.css';

const CATEGORIES = [
  { id: 'family-photos', label: 'Family Photos', icon: '📸' },
  { id: 'event-slides', label: 'Event Slides', icon: '📊' }
];

function UserPhotos() {
  const [activeCategory, setActiveCategory] = useState('family-photos');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchPhotos(activeCategory);
  }, [activeCategory]);

  const fetchPhotos = async (category) => {
    setLoading(true);
    setError(null);
    try {
      // Use metadata=true for faster listing (excludes heavy base64 data)
      const response = await axios.get(`/api/photos?category=${category}&metadata=true`);
      setPhotos(response.data);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const processFiles = async (files) => {
    if (files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Validate all files first
    const invalidFiles = [];
    const validFiles = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name}: Invalid file type`);
      } else if (file.size > maxSize) {
        invalidFiles.push(`${file.name}: File too large (max 10MB)`);
      } else {
        validFiles.push(file);
      }
    }

    if (invalidFiles.length > 0) {
      setUploadError(invalidFiles.join(', '));
      if (validFiles.length === 0) return;
    } else {
      setUploadError(null);
    }

    // Initialize progress tracking
    const initialProgress = validFiles.map(file => ({
      filename: file.name,
      status: 'uploading'
    }));
    setUploadProgress(initialProgress);
    setUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('photos', file);
      });
      formData.append('category', activeCategory);

      const response = await axios.post('/api/photos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update progress based on results
      const updatedProgress = validFiles.map(file => {
        const success = response.data.success?.find(p => p.filename === file.name);
        const failed = response.data.failed?.find(p => p.filename === file.name);

        if (success) {
          return { filename: file.name, status: 'success' };
        } else if (failed) {
          return { filename: file.name, status: 'failed', error: failed.error };
        } else {
          return { filename: file.name, status: 'success' };
        }
      });

      setUploadProgress(updatedProgress);

      // Show summary
      const successCount = response.data.success?.length || 0;
      const failedCount = response.data.failed?.length || 0;

      if (failedCount > 0) {
        setUploadError(`Uploaded ${successCount} of ${validFiles.length} files. ${failedCount} failed.`);
      }

      // Refresh photo list after a brief delay to show results
      setTimeout(async () => {
        await fetchPhotos(activeCategory);
        setUploadProgress([]);
      }, 2000);
    } catch (err) {
      console.error('Error uploading photos:', err);
      setUploadError(err.response?.data?.error || 'Failed to upload photos');
      setUploadProgress([]);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    await processFiles(files);
    // Clear file input
    event.target.value = '';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
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
    <div className="user-photos">
      <div className="user-photos-header">
        <h2>My Photos</h2>
        <p>Upload and manage your personal photos for slideshows</p>
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
            {activeCategory === category.id && (
              <span className="category-count">({photos.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Upload Section */}
      <div
        className={`upload-section ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <label htmlFor="photo-upload" className="upload-button">
          {uploading ? '⏳ Uploading...' : '📤 Upload Photos'}
          <input
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            multiple
            style={{ display: 'none' }}
          />
        </label>
        {isDragging && <div className="drop-overlay">Drop photos here</div>}
        {uploadError && <div className="upload-error">{uploadError}</div>}
        <div className="upload-info">
          <small>Supported formats: JPG, PNG, GIF, WebP | Max size: 10MB per file | Drag & drop or select multiple files</small>
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="upload-progress">
            <h4>Upload Progress:</h4>
            <div className="progress-list">
              {uploadProgress.map((item, index) => (
                <div key={index} className={`progress-item ${item.status}`}>
                  <span className="progress-filename">{item.filename}</span>
                  <span className="progress-status">
                    {item.status === 'uploading' && '⏳ Uploading...'}
                    {item.status === 'success' && '✅ Success'}
                    {item.status === 'failed' && `❌ Failed: ${item.error || 'Unknown error'}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
                  src={photo.base64Data || `/api/photos/${photo._id}/image?token=${token}`}
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

export default UserPhotos;
