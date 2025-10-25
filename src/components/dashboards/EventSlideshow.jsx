import { useState, useEffect } from 'react';
import axios from 'axios';
import './EventSlideshow.css';

function EventSlideshow() {
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;

    // Auto-advance every 10 seconds
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
        setFade(true);
      }, 500); // Wait for fade out
    }, 10000);

    return () => clearInterval(interval);
  }, [photos.length]);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get('/api/photos?category=event-slides');

      if (response.data.length === 0) {
        setError('No event slides available. Please upload some slides in the Admin panel.');
        setLoading(false);
        return;
      }

      // Fetch full photo data for each photo
      const photoPromises = response.data.map(photo =>
        axios.get(`/api/photos/${photo._id}`)
      );
      const photoResponses = await Promise.all(photoPromises);
      const fullPhotos = photoResponses.map(res => res.data);

      setPhotos(fullPhotos);
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
