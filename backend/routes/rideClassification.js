const express = require('express');
const axios = require('axios');
const adminAuth = require('../middleware/adminAuth');
const RideMetadata = require('../models/RideMetadata');

const router = express.Router();

// Disney World park IDs
const PARKS = [
  { id: 6, name: 'Magic Kingdom' },
  { id: 5, name: 'Epcot' },
  { id: 7, name: 'Hollywood Studios' },
  { id: 8, name: 'Animal Kingdom' }
];

const VALID_CLASSIFICATIONS = ['headliner', 'popular', 'standard', 'minor', 'unclassified'];

/**
 * GET /api/disney/classifications
 * Get all ride classifications (public - no auth required)
 */
router.get('/', async (req, res) => {
  try {
    const { parkId } = req.query;
    const query = parkId ? { parkId: parseInt(parkId) } : {};

    const rides = await RideMetadata.find(query)
      .select('rideId rideName parkId landId landName classification.type isActive')
      .sort({ parkId: 1, landName: 1, rideName: 1 });

    res.json({ rides });
  } catch (error) {
    console.error('Error getting classifications:', error);
    res.status(500).json({ message: 'Error getting classifications' });
  }
});

/**
 * PUT /api/disney/classifications/:rideId
 * Update classification for a single ride (admin only)
 */
router.put('/:rideId', adminAuth, async (req, res) => {
  try {
    const { rideId } = req.params;
    const { classification } = req.body;

    if (!VALID_CLASSIFICATIONS.includes(classification)) {
      return res.status(400).json({
        message: `Invalid classification. Must be one of: ${VALID_CLASSIFICATIONS.join(', ')}`
      });
    }

    const ride = await RideMetadata.findOneAndUpdate(
      { rideId: parseInt(rideId) },
      {
        $set: {
          'classification.type': classification,
          'classification.lastCalculated': new Date()
        }
      },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    res.json({ ride });
  } catch (error) {
    console.error('Error updating classification:', error);
    res.status(500).json({ message: 'Error updating classification' });
  }
});

/**
 * PUT /api/disney/classifications/bulk
 * Bulk update classifications (admin only)
 */
router.put('/bulk', adminAuth, async (req, res) => {
  try {
    const { classifications } = req.body;
    // classifications = [{ rideId: 123, classification: 'headliner' }, ...]

    if (!Array.isArray(classifications)) {
      return res.status(400).json({ message: 'classifications must be an array' });
    }

    const results = [];
    const now = new Date();

    for (const { rideId, classification } of classifications) {
      if (!VALID_CLASSIFICATIONS.includes(classification)) continue;

      const result = await RideMetadata.findOneAndUpdate(
        { rideId: parseInt(rideId) },
        {
          $set: {
            'classification.type': classification,
            'classification.lastCalculated': now
          }
        },
        { new: true }
      );

      if (result) {
        results.push({ rideId, classification, success: true });
      }
    }

    res.json({ updated: results.length, results });
  } catch (error) {
    console.error('Error bulk updating classifications:', error);
    res.status(500).json({ message: 'Error bulk updating classifications' });
  }
});

/**
 * POST /api/disney/classifications/sync
 * Sync rides from queue-times API to RideMetadata (admin only)
 * Creates entries for rides that don't exist yet
 */
router.post('/sync', adminAuth, async (req, res) => {
  try {
    let created = 0;
    let updated = 0;
    const now = new Date();

    for (const park of PARKS) {
      try {
        const response = await axios.get(
          `https://queue-times.com/parks/${park.id}/queue_times.json`,
          { timeout: 10000 }
        );

        if (response.data.lands) {
          for (const land of response.data.lands) {
            if (land.rides) {
              for (const ride of land.rides) {
                const existingRide = await RideMetadata.findOne({ rideId: ride.id });

                const updateData = {
                  rideName: ride.name,
                  parkId: park.id,
                  landId: land.id,
                  landName: land.name,
                  lastSeen: now,
                  isActive: true
                };

                if (existingRide) {
                  await RideMetadata.updateOne(
                    { rideId: ride.id },
                    { $set: updateData }
                  );
                  updated++;
                } else {
                  await RideMetadata.create({
                    rideId: ride.id,
                    ...updateData,
                    firstSeen: now,
                    classification: { type: 'unclassified' }
                  });
                  created++;
                }
              }
            }
          }
        }
      } catch (parkError) {
        console.error(`Error fetching park ${park.name}:`, parkError.message);
      }
    }

    res.json({
      message: 'Sync complete',
      created,
      updated,
      total: created + updated
    });
  } catch (error) {
    console.error('Error syncing rides:', error);
    res.status(500).json({ message: 'Error syncing rides' });
  }
});

/**
 * GET /api/disney/classifications/stats
 * Get classification statistics (public)
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await RideMetadata.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$classification.type',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      headliner: 0,
      popular: 0,
      standard: 0,
      minor: 0,
      unclassified: 0
    };

    stats.forEach(s => {
      if (s._id && result.hasOwnProperty(s._id)) {
        result[s._id] = s.count;
      } else {
        result.unclassified += s.count;
      }
    });

    res.json({ stats: result, total: Object.values(result).reduce((a, b) => a + b, 0) });
  } catch (error) {
    console.error('Error getting classification stats:', error);
    res.status(500).json({ message: 'Error getting stats' });
  }
});

module.exports = router;
