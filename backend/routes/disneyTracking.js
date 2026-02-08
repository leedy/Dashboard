const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const disneyDataCollector = require('../services/disneyDataCollector');
const WaitTimeSnapshot = require('../models/WaitTimeSnapshot');
const RideMetadata = require('../models/RideMetadata');
const Preferences = require('../models/Preferences');

const router = express.Router();

/**
 * GET /api/disney/tracking/status
 * Get current tracking status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    const collectorStatus = disneyDataCollector.getStatus();

    // Get admin preferences for tracking config
    const prefs = await Preferences.findOne({ userId: 'admin' });
    const trackingConfig = prefs?.disneyTracking || {};

    // Get snapshot statistics
    const totalSnapshots = await WaitTimeSnapshot.countDocuments();
    const totalRides = await RideMetadata.countDocuments();

    // Get oldest and newest snapshots
    const oldestSnapshot = await WaitTimeSnapshot.findOne().sort({ timestamp: 1 }).select('timestamp');
    const newestSnapshot = await WaitTimeSnapshot.findOne().sort({ timestamp: -1 }).select('timestamp');

    // Get snapshots from last 24 hours
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const snapshotsLast24h = await WaitTimeSnapshot.countDocuments({ timestamp: { $gte: last24h } });

    res.json({
      collector: collectorStatus,
      config: {
        enabled: trackingConfig.enabled || false,
        collectionIntervalMinutes: trackingConfig.collectionIntervalMinutes || 5,
        retentionDays: trackingConfig.retentionDays || 90,
        status: trackingConfig.status || 'stopped',
        lastCollectionTime: trackingConfig.lastCollectionTime,
        errorMessage: trackingConfig.errorMessage
      },
      statistics: {
        totalSnapshots,
        totalRides,
        snapshotsLast24h,
        oldestSnapshot: oldestSnapshot?.timestamp,
        newestSnapshot: newestSnapshot?.timestamp
      }
    });
  } catch (error) {
    console.error('Error getting tracking status:', error);
    res.status(500).json({ message: 'Error getting tracking status' });
  }
});

/**
 * POST /api/disney/tracking/start
 * Start data collection (admin only)
 */
router.post('/start', adminAuth, async (req, res) => {
  try {
    const { intervalMinutes = 5 } = req.body;

    // Validate interval
    if (intervalMinutes < 1 || intervalMinutes > 60) {
      return res.status(400).json({ message: 'Interval must be between 1 and 60 minutes' });
    }

    // Update preferences
    await Preferences.findOneAndUpdate(
      { userId: 'admin' },
      {
        $set: {
          'disneyTracking.enabled': true,
          'disneyTracking.collectionIntervalMinutes': intervalMinutes,
          'disneyTracking.status': 'running'
        }
      },
      { upsert: true }
    );

    // Start collector
    const started = disneyDataCollector.startCollection(intervalMinutes);

    if (started) {
      res.json({ message: 'Data collection started', intervalMinutes });
    } else {
      res.json({ message: 'Data collection already running', intervalMinutes });
    }
  } catch (error) {
    console.error('Error starting collection:', error);
    res.status(500).json({ message: 'Error starting data collection' });
  }
});

/**
 * POST /api/disney/tracking/stop
 * Stop data collection (admin only)
 */
router.post('/stop', adminAuth, async (req, res) => {
  try {
    // Update preferences
    await Preferences.findOneAndUpdate(
      { userId: 'admin' },
      {
        $set: {
          'disneyTracking.enabled': false,
          'disneyTracking.status': 'stopped'
        }
      },
      { upsert: true }
    );

    // Stop collector
    const stopped = disneyDataCollector.stopCollection();

    if (stopped) {
      res.json({ message: 'Data collection stopped' });
    } else {
      res.json({ message: 'Data collection was not running' });
    }
  } catch (error) {
    console.error('Error stopping collection:', error);
    res.status(500).json({ message: 'Error stopping data collection' });
  }
});

/**
 * POST /api/disney/tracking/collect-now
 * Trigger immediate collection (admin only)
 */
router.post('/collect-now', adminAuth, async (req, res) => {
  try {
    const result = await disneyDataCollector.collectAllParks();
    res.json({
      message: 'Collection completed',
      ...result
    });
  } catch (error) {
    console.error('Error running collection:', error);
    res.status(500).json({ message: 'Error running data collection' });
  }
});

/**
 * GET /api/disney/tracking/history/:rideId
 * Get wait time history for a specific ride
 */
router.get('/history/:rideId', async (req, res) => {
  try {
    const { rideId } = req.params;
    const { hours = 24, limit = 100 } = req.query;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const snapshots = await WaitTimeSnapshot.find({
      rideId: parseInt(rideId),
      timestamp: { $gte: since }
    })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('waitTime isOpen timestamp context');

    res.json({ rideId: parseInt(rideId), snapshots });
  } catch (error) {
    console.error('Error getting ride history:', error);
    res.status(500).json({ message: 'Error getting ride history' });
  }
});

/**
 * GET /api/disney/tracking/history/park/:parkId
 * Get recent snapshots for all rides in a park
 */
router.get('/history/park/:parkId', async (req, res) => {
  try {
    const { parkId } = req.params;
    const { hours = 1 } = req.query;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const snapshots = await WaitTimeSnapshot.find({
      parkId: parseInt(parkId),
      timestamp: { $gte: since }
    })
      .sort({ timestamp: -1 })
      .select('rideId rideName waitTime isOpen timestamp');

    res.json({ parkId: parseInt(parkId), snapshots });
  } catch (error) {
    console.error('Error getting park history:', error);
    res.status(500).json({ message: 'Error getting park history' });
  }
});

/**
 * GET /api/disney/tracking/rides
 * Get all tracked rides with metadata
 */
router.get('/rides', async (req, res) => {
  try {
    const { parkId } = req.query;

    const query = parkId ? { parkId: parseInt(parkId) } : {};
    const rides = await RideMetadata.find(query)
      .sort({ parkId: 1, rideName: 1 });

    res.json({ rides });
  } catch (error) {
    console.error('Error getting rides:', error);
    res.status(500).json({ message: 'Error getting rides' });
  }
});

/**
 * GET /api/disney/tracking/records/:parkId
 * Get all-time record wait times for rides in a park
 */
router.get('/records/:parkId', async (req, res) => {
  try {
    const rides = await RideMetadata.find({ parkId: parseInt(req.params.parkId) })
      .select('rideId rideName parkId landId landName classification.type isActive peakWaitTime peakWaitTimeDate peakWaitTimeContext')
      .sort({ peakWaitTime: -1 });
    res.json({ rides });
  } catch (error) {
    console.error('Error getting records:', error);
    res.status(500).json({ message: 'Error getting record wait times' });
  }
});

/**
 * DELETE /api/disney/tracking/data
 * Clear all tracking data (admin only) - use with caution
 */
router.delete('/data', adminAuth, async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        message: 'Must confirm deletion by sending { confirm: "DELETE_ALL_DATA" }'
      });
    }

    const snapshotResult = await WaitTimeSnapshot.deleteMany({});
    const metadataResult = await RideMetadata.deleteMany({});

    res.json({
      message: 'All tracking data deleted',
      deletedSnapshots: snapshotResult.deletedCount,
      deletedRideMetadata: metadataResult.deletedCount
    });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ message: 'Error deleting tracking data' });
  }
});

module.exports = router;
