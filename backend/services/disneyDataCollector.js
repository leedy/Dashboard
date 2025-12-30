/**
 * Disney Data Collector Service
 * Collects wait time data from all 4 Disney World parks on a schedule
 * Uses node-cron for scheduling, stores data in MongoDB
 */

const cron = require('node-cron');
const axios = require('axios');
const WaitTimeSnapshot = require('../models/WaitTimeSnapshot');
const RideMetadata = require('../models/RideMetadata');
const Preferences = require('../models/Preferences');
const weatherService = require('./weatherService');
const holidayService = require('./holidayService');

// Disney World park IDs from queue-times.com
const PARKS = {
  5: { name: 'Epcot', slug: 'epcot' },
  6: { name: 'Magic Kingdom', slug: 'magic-kingdom' },
  7: { name: 'Hollywood Studios', slug: 'hollywood-studios' },
  8: { name: 'Animal Kingdom', slug: 'animal-kingdom' }
};

/**
 * Get ISO week number (1-53)
 * @param {Date} date
 * @returns {number}
 */
function getWeekOfYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Calculate park statistics (average wait time and open ride count)
 * @param {Object} parkData - Park data from API
 * @returns {{avgWait: number|null, openRideCount: number}} Park stats
 */
function calculateParkStats(parkData) {
  if (!parkData || !parkData.lands) return { avgWait: null, openRideCount: 0 };

  let totalWait = 0;
  let ridesWithWait = 0;
  let openRideCount = 0;

  for (const land of parkData.lands) {
    if (!land.rides) continue;
    for (const ride of land.rides) {
      if (ride.is_open) {
        openRideCount++;
        if (ride.wait_time > 0) {
          totalWait += ride.wait_time;
          ridesWithWait++;
        }
      }
    }
  }

  return {
    avgWait: ridesWithWait > 0 ? Math.round(totalWait / ridesWithWait) : null,
    openRideCount: openRideCount
  };
}

// Track the cron job instance
let cronJob = null;
let isCollecting = false;

/**
 * Fetch wait times for a single park
 * @param {number} parkId - Park ID (5-8)
 * @returns {Promise<Object|null>} Park data or null on error
 */
async function fetchParkData(parkId) {
  try {
    const url = `https://queue-times.com/parks/${parkId}/queue_times.json`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error(`Error fetching park ${parkId} (${PARKS[parkId]?.name}):`, error.message);
    return null;
  }
}

/**
 * Collect data from all parks and store snapshots
 * @returns {Promise<{success: boolean, snapshotsCreated: number, errors: string[]}>}
 */
async function collectAllParks() {
  if (isCollecting) {
    console.log('Disney collector: Collection already in progress, skipping');
    return { success: false, snapshotsCreated: 0, errors: ['Collection already in progress'] };
  }

  isCollecting = true;
  const startTime = Date.now();
  const errors = [];
  let snapshotsCreated = 0;

  try {
    const now = new Date();

    // Check if another instance already collected recently (within last 4 minutes)
    const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000);
    const recentSnapshot = await WaitTimeSnapshot.findOne({
      timestamp: { $gte: fourMinutesAgo }
    }).lean();

    if (recentSnapshot) {
      const age = Math.round((now - new Date(recentSnapshot.timestamp)) / 1000);
      console.log(`Disney collector: Recent data exists (${age}s old), skipping to prevent duplicates`);
      isCollecting = false;
      return { success: true, snapshotsCreated: 0, errors: [], skipped: 'Recent data exists' };
    }

    console.log('Disney collector: Starting data collection...');

    // Get current context (weather + holiday info)
    const weather = await weatherService.getCurrentWeather();
    const holidayInfo = holidayService.checkHoliday(now);

    const dayOfWeek = now.getDay();
    const context = {
      dayOfWeek: dayOfWeek,
      hour: now.getHours(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      weekOfYear: getWeekOfYear(now),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isHoliday: holidayInfo.isHoliday,
      holidayName: holidayInfo.holidayName || undefined,
      weather: weather ? {
        temperature: weather.temperature,
        feelsLike: weather.feelsLike,
        humidity: weather.humidity,
        weatherCode: weather.weatherCode,
        isRaining: weather.isRaining
      } : undefined
    };

    // Fetch all parks in parallel
    const parkIds = Object.keys(PARKS).map(Number);
    const parkDataPromises = parkIds.map(parkId => fetchParkData(parkId));
    const parkResults = await Promise.all(parkDataPromises);

    // Check if any rides are open across all parks
    let anyRideOpen = false;
    for (const parkData of parkResults) {
      if (!parkData || !parkData.lands) continue;
      for (const land of parkData.lands) {
        if (!land.rides) continue;
        if (land.rides.some(ride => ride.is_open)) {
          anyRideOpen = true;
          break;
        }
      }
      if (anyRideOpen) break;
    }

    // Skip saving if all parks are closed
    if (!anyRideOpen) {
      const duration = Date.now() - startTime;
      console.log(`Disney collector: All parks closed, skipping save (${duration}ms)`);
      return { success: true, snapshotsCreated: 0, errors: [], skipped: 'All parks closed' };
    }

    // Process each park's data
    for (let i = 0; i < parkIds.length; i++) {
      const parkId = parkIds[i];
      const parkData = parkResults[i];

      if (!parkData || !parkData.lands) {
        errors.push(`No data for ${PARKS[parkId].name}`);
        continue;
      }

      // Calculate park-wide statistics
      const parkStats = calculateParkStats(parkData);

      // Process each land and ride
      for (const land of parkData.lands) {
        if (!land.rides) continue;

        for (const ride of land.rides) {
          try {
            // Create snapshot
            const snapshot = new WaitTimeSnapshot({
              rideId: ride.id,
              rideName: ride.name,
              parkId: parkId,
              landId: land.id,
              landName: land.name,
              waitTime: ride.wait_time || 0,
              isOpen: ride.is_open || false,
              timestamp: now,
              parkAvgWait: parkStats.avgWait,
              parkOpenRideCount: parkStats.openRideCount,
              context: context
            });

            await snapshot.save();
            snapshotsCreated++;

            // Update ride metadata (upsert)
            await RideMetadata.findOneAndUpdate(
              { rideId: ride.id },
              {
                $set: {
                  rideName: ride.name,
                  parkId: parkId,
                  landId: land.id,
                  landName: land.name,
                  lastSeen: now,
                  isActive: true
                },
                $setOnInsert: {
                  firstSeen: now
                },
                $inc: {
                  'stats.totalSnapshots': 1
                }
              },
              { upsert: true, new: true }
            );
          } catch (error) {
            // Ignore duplicate key errors (another instance already saved this data)
            if (error.code === 11000) {
              // Silently skip duplicates
              continue;
            }
            errors.push(`Error saving ride ${ride.name}: ${error.message}`);
          }
        }
      }
    }

    // Update tracking status in preferences
    await updateTrackingStatus('running', null, now);

    const duration = Date.now() - startTime;
    console.log(`Disney collector: Completed in ${duration}ms. Created ${snapshotsCreated} snapshots.`);

    if (errors.length > 0) {
      console.log(`Disney collector: ${errors.length} errors occurred`);
    }

    return { success: true, snapshotsCreated, errors };

  } catch (error) {
    console.error('Disney collector: Fatal error:', error.message);
    await updateTrackingStatus('error', error.message);
    return { success: false, snapshotsCreated, errors: [error.message] };
  } finally {
    isCollecting = false;
  }
}

/**
 * Update tracking status in admin preferences
 */
async function updateTrackingStatus(status, errorMessage = null, lastCollectionTime = null) {
  try {
    const update = {
      'disneyTracking.status': status
    };

    if (errorMessage !== null) {
      update['disneyTracking.errorMessage'] = errorMessage;
    }

    if (lastCollectionTime) {
      update['disneyTracking.lastCollectionTime'] = lastCollectionTime;
    }

    // Update the admin/system preferences (userId: 'admin' or first admin)
    await Preferences.findOneAndUpdate(
      { userId: 'admin' },
      { $set: update },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error updating tracking status:', error.message);
  }
}

/**
 * Start the data collection cron job
 * @param {number} intervalMinutes - Collection interval in minutes (default: 5)
 * @returns {boolean} Success status
 */
function startCollection(intervalMinutes = 5) {
  if (cronJob) {
    console.log('Disney collector: Already running');
    return false;
  }

  // Create cron expression for every N minutes
  const cronExpression = `*/${intervalMinutes} * * * *`;

  console.log(`Disney collector: Starting with interval ${intervalMinutes} minutes (${cronExpression})`);

  cronJob = cron.schedule(cronExpression, async () => {
    await collectAllParks();
  });

  // Run immediately on start
  collectAllParks();

  updateTrackingStatus('running');

  return true;
}

/**
 * Stop the data collection cron job
 * @returns {boolean} Success status
 */
function stopCollection() {
  if (!cronJob) {
    console.log('Disney collector: Not running');
    return false;
  }

  cronJob.stop();
  cronJob = null;

  console.log('Disney collector: Stopped');

  updateTrackingStatus('stopped');

  return true;
}

/**
 * Get current collector status
 * @returns {Object} Status information
 */
function getStatus() {
  return {
    isRunning: cronJob !== null,
    isCollecting: isCollecting
  };
}

/**
 * Initialize collector based on saved preferences
 * Called on server startup
 */
async function initializeFromPreferences() {
  try {
    const prefs = await Preferences.findOne({ userId: 'admin' });

    if (prefs?.disneyTracking?.enabled) {
      const interval = prefs.disneyTracking.collectionIntervalMinutes || 5;
      console.log('Disney collector: Auto-starting from saved preferences');
      startCollection(interval);
    } else {
      console.log('Disney collector: Not enabled in preferences');
    }
  } catch (error) {
    console.error('Disney collector: Error checking preferences:', error.message);
  }
}

module.exports = {
  collectAllParks,
  startCollection,
  stopCollection,
  getStatus,
  initializeFromPreferences,
  PARKS
};
