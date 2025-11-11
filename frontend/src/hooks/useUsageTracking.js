import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// Generate a session ID that persists for the browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('dashboardSessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('dashboardSessionId', sessionId);
  }
  return sessionId;
};

// Get browser info
const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // Detect browser
  if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
  }

  // Detect OS
  if (ua.indexOf('Windows') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'macOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iOS') > -1) os = 'iOS';

  // Detect device type
  if (/Mobi|Android/i.test(ua)) device = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

  return { name: browserName, version: browserVersion, os, device };
};

// Log usage event to backend (with error handling to not break the app)
const logEvent = async (eventData) => {
  try {
    await axios.post('/api/usage/log', {
      ...eventData,
      sessionId: getSessionId(),
      browserInfo: getBrowserInfo(),
      timestamp: new Date()
    });
  } catch (error) {
    // Silently fail - don't break the app if tracking fails
    console.warn('Failed to log usage event:', error.message);
  }
};

// Hook for tracking dashboard views
export const useDashboardTracking = (dashboardId, metadata = {}) => {
  const startTime = useRef(Date.now());
  const hasLogged = useRef(false);

  useEffect(() => {
    // Track dashboard view on mount
    if (!hasLogged.current && dashboardId) {
      logEvent({
        eventType: 'dashboard_view',
        dashboardId,
        metadata
      });
      hasLogged.current = true;
      startTime.current = Date.now();
    }

    // Track duration on unmount
    return () => {
      if (dashboardId) {
        const duration = Date.now() - startTime.current;
        logEvent({
          eventType: 'dashboard_view',
          dashboardId,
          duration,
          metadata
        });
      }
    };
  }, [dashboardId, metadata]);
};

// Hook for tracking feature usage
export const useFeatureTracking = () => {
  const trackFeature = useCallback((featureName, metadata = {}) => {
    logEvent({
      eventType: 'feature_use',
      featureName,
      metadata
    });
  }, []);

  const trackModalOpen = useCallback((modalName, metadata = {}) => {
    logEvent({
      eventType: 'modal_open',
      featureName: modalName,
      metadata
    });
  }, []);

  const trackSettingsChange = useCallback((settingName, value, metadata = {}) => {
    logEvent({
      eventType: 'settings_change',
      featureName: settingName,
      metadata: { value, ...metadata }
    });
  }, []);

  const trackError = useCallback((errorMessage, metadata = {}) => {
    logEvent({
      eventType: 'error_occurred',
      metadata: { error: errorMessage, ...metadata }
    });
  }, []);

  return {
    trackFeature,
    trackModalOpen,
    trackSettingsChange,
    trackError
  };
};

// Hook for tracking page loads
export const usePageLoadTracking = () => {
  useEffect(() => {
    logEvent({
      eventType: 'page_load',
      metadata: {
        url: window.location.href,
        referrer: document.referrer
      }
    });
  }, []);
};

export default {
  useDashboardTracking,
  useFeatureTracking,
  usePageLoadTracking
};
