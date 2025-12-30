# Disney Wait Time Tracking and Prediction System

## Overview
Collect historical wait time data from all 4 Disney World parks, auto-classify rides by popularity, and provide wait time predictions based on day/time/season patterns.

## Design Decisions
- **Collector**: Integrated in backend using node-cron (not separate PM2 process)
- **Charts**: Yes - use Chart.js/Recharts for trend visualizations

---

## Task Checklist

### Phase 0: Setup ✅
- [x] Install `node-cron` and `date-holidays` backend dependencies

### Phase 1: Foundation (Models + Services) ✅
- [x] Create `WaitTimeSnapshot` model (`backend/models/WaitTimeSnapshot.js`)
- [x] Create `RideMetadata` model (`backend/models/RideMetadata.js`)
- [x] Extend `Preferences` model with `disneyTracking` config
- [x] Create `weatherService.js` (`backend/services/weatherService.js`)
- [x] Create `holidayService.js` (`backend/services/holidayService.js`)

### Phase 2: Data Collection ✅
- [x] Create `disneyDataCollector.js` service (`backend/services/disneyDataCollector.js`)
- [x] Integrate collector into `server.js`
- [x] Create `disneyTracking.js` routes (`backend/routes/disneyTracking.js`)
- [x] Create `AdminDisneyTracking.jsx` component
- [x] Add "Disney Tracking" tab to Admin panel
- [x] Test data collection

### Phase 3: Classification & Predictions
- [ ] Create `rideClassifier.js` service (`backend/services/rideClassifier.js`)
- [ ] Create `predictionEngine.js` service (`backend/services/predictionEngine.js`)
- [ ] Create `disneyRides.js` routes (`backend/routes/disneyRides.js`)
- [ ] Create `disneyPredictions.js` routes (`backend/routes/disneyPredictions.js`)

### Phase 4: Dashboard Integration
- [ ] Install Chart.js and react-chartjs-2 frontend dependencies
- [ ] Create `useDisneyPredictions` hook (`frontend/src/hooks/useDisneyPredictions.js`)
- [ ] Add classification badges to DisneyDashboard
- [ ] Add prediction display to ride cards
- [ ] Create `DisneyBestTimes.jsx` modal
- [ ] Create `DisneyTrends.jsx` for historical charts
- [ ] Add CSS for new UI elements

### Phase 5: Refinement
- [ ] Tune prediction algorithm after data collection
- [ ] Performance optimization

---

## Data Models

### WaitTimeSnapshot
```javascript
{
  rideId: Number,           // Queue-Times ride ID
  rideName: String,
  parkId: Number,           // 5=Epcot, 6=MK, 7=HS, 8=AK
  landId: Number,
  landName: String,
  waitTime: Number,         // Minutes
  isOpen: Boolean,
  timestamp: Date,

  context: {
    dayOfWeek: Number,      // 0-6
    hour: Number,           // 0-23
    month: Number,          // 1-12
    isHoliday: Boolean,
    holidayName: String,
    weather: {
      temperature: Number,
      weatherCode: Number,
      isRaining: Boolean
    }
  }
}

// Indexes:
// - { rideId: 1, timestamp: -1 }
// - { parkId: 1, timestamp: -1 }
// - { timestamp: 1 } with 90-day TTL
// - { 'context.dayOfWeek': 1, 'context.hour': 1, rideId: 1 }
```

### RideMetadata
```javascript
{
  rideId: Number,           // Unique
  rideName: String,
  parkId: Number,
  landId: Number,
  landName: String,

  classification: {
    type: String,           // 'headliner', 'popular', 'standard', 'minor'
    avgWaitTime: Number,
    peakAvgWaitTime: Number,
    lastCalculated: Date
  },

  stats: {
    totalSnapshots: Number,
    avgWaitOverall: Number,
    avgWaitByHour: [Number],  // 24 elements
    avgWaitByDay: [Number],   // 7 elements
    peakHour: Number,
    lowHour: Number
  },

  firstSeen: Date,
  lastSeen: Date,
  isActive: Boolean
}
```

### Preferences Extension
```javascript
disneyTracking: {
  enabled: { type: Boolean, default: false },
  collectionIntervalMinutes: { type: Number, default: 5 },
  retentionDays: { type: Number, default: 90 },
  lastCollectionTime: Date,
  status: String,           // 'running', 'stopped', 'error'
  errorMessage: String
}
```

---

## API Endpoints

### Tracking Routes (`/api/disney/tracking`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Current tracking status |
| GET | `/history/:rideId` | Ride wait time history |
| GET | `/history/park/:parkId` | Park-wide history |
| POST | `/start` | Start collection (admin) |
| POST | `/stop` | Stop collection (admin) |

### Rides Routes (`/api/disney/rides`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/metadata` | All ride metadata + classifications |
| GET | `/:rideId/stats` | Detailed ride statistics |
| POST | `/recalculate` | Force reclassification (admin) |

### Predictions Routes (`/api/disney/predictions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:rideId` | Hourly predictions for a ride |
| GET | `/park/:parkId` | All predictions for a park |
| GET | `/best-times/:rideId` | Best times to ride |

---

## Ride Classification Thresholds

| Classification | Avg Wait |
|---------------|----------|
| Headliner | 45+ min |
| Popular | 25-45 min |
| Standard | 10-25 min |
| Minor | <10 min |

- Runs weekly (Sunday 3am) via cron
- Requires minimum 100 snapshots before classifying

---

## Configuration Defaults

| Setting | Default |
|---------|---------|
| Collection Interval | 5 minutes |
| Data Retention | 90 days |
| Min Snapshots for Classification | 100 |
| Headliner Threshold | 45 min |
| Popular Threshold | 25 min |
| Standard Threshold | 10 min |
| Min Data for Predictions | 5 snapshots |

---

## Dependencies

**Backend:**
```bash
npm install node-cron date-holidays
```

**Frontend:**
```bash
npm install chart.js react-chartjs-2
```

---

## Critical Files

| File | Action |
|------|--------|
| `backend/models/WaitTimeSnapshot.js` | Create |
| `backend/models/RideMetadata.js` | Create |
| `backend/models/Preferences.js` | Modify |
| `backend/services/disneyDataCollector.js` | Create |
| `backend/services/weatherService.js` | Create |
| `backend/services/holidayService.js` | Create |
| `backend/services/rideClassifier.js` | Create |
| `backend/services/predictionEngine.js` | Create |
| `backend/routes/disneyTracking.js` | Create |
| `backend/routes/disneyRides.js` | Create |
| `backend/routes/disneyPredictions.js` | Create |
| `backend/server.js` | Modify |
| `frontend/src/components/admin/Admin.jsx` | Modify |
| `frontend/src/components/admin/AdminDisneyTracking.jsx` | Create |
| `frontend/src/components/dashboards/DisneyDashboard.jsx` | Modify |
| `frontend/src/components/dashboards/DisneyBestTimes.jsx` | Create |
| `frontend/src/components/dashboards/DisneyTrends.jsx` | Create |
| `frontend/src/hooks/useDisneyPredictions.js` | Create |

---

**Last Updated:** 2025-12-30

**Phase 0 completed:** Dependencies installed and verified
**Phase 1 completed:** Models and services created
**Phase 2 completed:** Data collection working (120 rides from all 4 parks)
