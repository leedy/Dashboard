import { useState, useEffect } from 'react';
import axios from 'axios';
import usePreferences from '../../hooks/usePreferences';
import './EventSlideshow.css';

const STORAGE_KEY = 'event-slides-slideshow-index';

function EventSlideshow() {
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fade, setFade] = useState(true);
  const { preferences } = usePreferences();

  // Load saved position from localStorage on mount
  useEffect(() => {
    const savedIndex = localStorage.getItem(STORAGE_KEY);
    if (savedIndex !== null) {
      setCurrentIndex(parseInt(savedIndex, 10));
    }
  }, []);

  // Save current position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentIndex.toString());
  }, [currentIndex]);

  useEffect(() => {
    fetchPhotos();

    // Refresh photo list every 30 seconds to pick up newly uploaded photos
    const refreshInterval = setInterval(() => {
      fetchPhotos();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Preload images for smoother transitions
  useEffect(() => {
    if (photos.length === 0) return;

    // Preload all images
    photos.forEach(photo => {
      const img = new Image();
      img.src = photo.base64Data;
    });
  }, [photos]);

  useEffect(() => {
    if (photos.length === 0) return;

    // Get display interval from preferences (default: 10 seconds)
    const displayInterval = preferences.displaySettings?.eventPhotoInterval || 10000;

    // Auto-advance based on user preference
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
        setFade(true);
      }, 500); // Wait for fade out
    }, displayInterval);

    return () => clearInterval(interval);
  }, [photos.length, preferences.displaySettings?.eventPhotoInterval]);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get('/api/photos?category=event-slides');

      if (response.data.length === 0) {
        setError('No event slides available. Please upload some slides in the Admin panel.');
        setLoading(false);
        return;
      }

      // API already returns full photos with base64 data - no need for individual requests!
      setPhotos(response.data);

      // Validate saved index - reset if it's out of bounds (e.g., photos were deleted)
      setCurrentIndex(prevIndex => {
        if (prevIndex >= response.data.length) {
          return 0;
        }
        return prevIndex;
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching event slides:', err);
      setError('Failed to load event slides');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="event-slideshow-container">
        <div className="event-slideshow-message">
          <p>Loading event slides...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-slideshow-container">
        <div className="event-slideshow-message error">
          <p>📊 {error}</p>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className="event-slideshow-container">
      <div className={`event-slideshow-image ${fade ? 'fade-in' : 'fade-out'}`}>
        <img
          src={currentPhoto.base64Data}
          alt={currentPhoto.filename}
        />
      </div>

      <div className="event-slideshow-info">
        <div className="event-slideshow-counter">
          {currentIndex + 1} / {photos.length}
        </div>
        <div className="event-slideshow-filename">
          {currentPhoto.filename}
        </div>
      </div>
    </div>
  );
}

export default EventSlideshow;
