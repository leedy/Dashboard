/**
 * Backfill Peak Wait Times
 *
 * One-time script to populate peakWaitTime fields in RideMetadata
 * from existing WaitTimeSnapshot data.
 *
 * Usage: cd backend && node scripts/backfillPeakWaitTimes.js
 *
 * Idempotent - safe to re-run. Always picks the true peak from snapshots.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const WaitTimeSnapshot = require('../models/WaitTimeSnapshot');
const RideMetadata = require('../models/RideMetadata');

async function connectDB() {
  const mongoHost = process.env.MONGO_HOST || 'localhost';
  const mongoPort = process.env.MONGO_PORT || 27017;
  const mongoUsername = process.env.MONGO_USERNAME;
  const mongoPassword = process.env.MONGO_PASSWORD;
  const mongoDatabase = process.env.MONGO_DATABASE || 'dashboard';

  let mongoURI;
  if (mongoUsername && mongoPassword) {
    mongoURI = `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}?authSource=${mongoDatabase}`;
  } else {
    mongoURI = `mongodb://${mongoHost}:${mongoPort}/${mongoDatabase}`;
  }

  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB');
}

async function backfillPeakWaitTimes() {
  // Aggregate: find the peak wait time snapshot for each ride
  const peaks = await WaitTimeSnapshot.aggregate([
    { $match: { isOpen: true, waitTime: { $gt: 0 } } },
    { $sort: { waitTime: -1 } },
    {
      $group: {
        _id: '$rideId',
        peakWaitTime: { $first: '$waitTime' },
        peakWaitTimeDate: { $first: '$timestamp' },
        context: { $first: '$context' }
      }
    }
  ]);

  console.log(`Found peak data for ${peaks.length} rides`);

  let updated = 0;
  let skipped = 0;

  for (const peak of peaks) {
    const context = peak.context || {};
    const result = await RideMetadata.updateOne(
      { rideId: peak._id },
      {
        $set: {
          peakWaitTime: peak.peakWaitTime,
          peakWaitTimeDate: peak.peakWaitTimeDate,
          peakWaitTimeContext: {
            dayOfWeek: context.dayOfWeek,
            hour: context.hour,
            month: context.month,
            year: context.year,
            isWeekend: context.isWeekend,
            isHoliday: context.isHoliday,
            holidayName: context.holidayName
          }
        }
      }
    );

    if (result.matchedCount > 0) {
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Updated ${updated} ride metadata documents`);
  if (skipped > 0) {
    console.log(`Skipped ${skipped} rides (no matching RideMetadata document)`);
  }
}

async function main() {
  try {
    await connectDB();
    await backfillPeakWaitTimes();
    console.log('Backfill complete');
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

main();
