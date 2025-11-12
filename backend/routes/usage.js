const express = require('express');
const UsageEvent = require('../models/UsageEvent');

const router = express.Router();

// Helper function to get real client IP behind proxy
const getClientIp = (req) => {
  // Check X-Forwarded-For header (nginx, load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can be "client, proxy1, proxy2"
    // We want the first (original client) IP
    return forwarded.split(',')[0].trim();
  }

  // Check X-Real-IP header (alternative nginx header)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Fallback to direct connection IP
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
};

// Log a usage event
router.post('/log', async (req, res) => {
  try {
    const {
      eventType,
      dashboardId,
      featureName,
      sessionId,
      userId,
      duration,
      metadata,
      browserInfo
    } = req.body;

    // Get IP address and user agent from request
    const ipAddress = getClientIp(req);
    const userAgent = req.get('User-Agent');

    const event = new UsageEvent({
      eventType,
      dashboardId,
      featureName,
      sessionId,
      userId: userId || 'default-user',
      ipAddress,
      userAgent,
      duration,
      metadata,
      browserInfo
    });

    await event.save();
    res.json({ success: true, eventId: event._id });
  } catch (error) {
    console.error('Error logging usage event:', error);
    res.status(500).json({ error: 'Failed to log usage event' });
  }
});

// Batch log multiple events (for performance)
router.post('/log/batch', async (req, res) => {
  try {
    const { events } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = req.get('User-Agent');

    const eventsToInsert = events.map(event => ({
      ...event,
      userId: event.userId || 'default-user',
      ipAddress,
      userAgent
    }));

    await UsageEvent.insertMany(eventsToInsert);
    res.json({ success: true, count: eventsToInsert.length });
  } catch (error) {
    console.error('Error batch logging usage events:', error);
    res.status(500).json({ error: 'Failed to log usage events' });
  }
});

// Get analytics overview
router.get('/analytics/overview', async (req, res) => {
  try {
    const { days = 30, userId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const query = { timestamp: { $gte: startDate } };
    if (userId && userId !== 'all') {
      query.userId = userId;
    }

    // Total events
    const totalEvents = await UsageEvent.countDocuments(query);

    // Events by type
    const eventsByType = await UsageEvent.aggregate([
      { $match: query },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Dashboard views
    const dashboardViews = await UsageEvent.aggregate([
      { $match: { ...query, eventType: 'dashboard_view' } },
      { $group: { _id: '$dashboardId', count: { $sum: 1 }, totalDuration: { $sum: '$duration' } } },
      { $sort: { count: -1 } }
    ]);

    // Unique sessions
    const uniqueSessions = await UsageEvent.distinct('sessionId', query);

    // Daily activity
    const dailyActivity = await UsageEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          events: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Peak hours (hour of day)
    const peakHours = await UsageEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalEvents,
      uniqueSessions: uniqueSessions.length,
      eventsByType,
      dashboardViews,
      dailyActivity,
      peakHours
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get recent activity log
router.get('/analytics/recent', async (req, res) => {
  try {
    const { limit = 100, userId } = req.query;
    const query = userId && userId !== 'all' ? { userId } : {};

    const recentEvents = await UsageEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('-userAgent -__v');

    res.json(recentEvents);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Get user sessions
router.get('/analytics/sessions', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const sessions = await UsageEvent.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $sort: { timestamp: 1 }  // Sort by timestamp ascending before grouping
      },
      {
        $group: {
          _id: '$sessionId',
          userId: { $first: '$userId' },
          firstSeen: { $min: '$timestamp' },
          lastSeen: { $max: '$timestamp' },
          eventCount: { $sum: 1 },
          dashboards: { $addToSet: '$dashboardId' },
          ipAddress: { $last: '$ipAddress' }  // Use last (most recent) IP instead of first
        }
      },
      { $sort: { lastSeen: -1 } }
    ]);

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get dashboard statistics
router.get('/analytics/dashboards', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const dashboardStats = await UsageEvent.aggregate([
      {
        $match: {
          eventType: 'dashboard_view',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$dashboardId',
          views: { $sum: 1 },
          uniqueSessions: { $addToSet: '$sessionId' },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' }
        }
      },
      {
        $project: {
          dashboardId: '$_id',
          views: 1,
          uniqueVisitors: { $size: '$uniqueSessions' },
          totalDuration: 1,
          avgDuration: { $round: ['$avgDuration', 0] }
        }
      },
      { $sort: { views: -1 } }
    ]);

    res.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;
