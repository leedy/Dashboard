# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A modern, responsive dashboard application displaying real-time sports data (NHL, NFL, MLB), Disney World wait times, and entertainment information. Designed for TV displays and home dashboards.

## Architecture

Full-stack application with separate frontend and backend:

```
Dashboard/
├── backend/              # Express.js API server (port 3001)
│   ├── config/          # MongoDB connection
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   ├── scripts/         # Utility scripts
│   ├── server.js        # Entry point
│   └── .env             # Backend config (REQUIRED)
├── frontend/            # React + Vite (port 5173)
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboards/  # Dashboard views
│   │   │   ├── layout/      # Header/navigation
│   │   │   ├── settings/    # Preferences panel
│   │   │   ├── admin/       # Admin interface
│   │   │   └── common/      # Shared components
│   │   ├── hooks/           # Custom React hooks
│   │   └── App.jsx          # Main router
│   ├── vite.config.js   # Dev server + proxy config
│   └── .env.local       # Frontend config (TMDb API key)
├── ecosystem.config.cjs # PM2 production config
└── logs/                # Application logs
```

**Technology Stack:**
- Frontend: React 19, Vite 7, Axios
- Backend: Express, Node.js
- Database: MongoDB (remote at 192.168.1.100:27017)
- Auth: JWT tokens
- Production: PM2 process manager

## Development Commands

### Start Development (Recommended)

```bash
# Run both frontend and backend together
cd frontend
npm run dev:all
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

### Start Development (Separate Terminals)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production Build & Deploy

```bash
# Build frontend
cd frontend
npm run build

# Preview production build locally
npm run preview  # http://localhost:4173

# Deploy with PM2
cd /home/leedy/Dashboard
pm2 start ecosystem.config.cjs
pm2 logs dashboard-backend
```

### Install Dependencies

```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd backend
npm install
```

## Environment Configuration

### Backend (.env in backend/)

```bash
cd backend
cp .env.template .env
# Edit with your values
```

Required variables:
```env
MONGO_HOST=192.168.1.100
MONGO_PORT=27017
MONGO_USERNAME=dashboard_user
MONGO_PASSWORD=your_password
MONGO_DATABASE=dashboard
BACKEND_PORT=3001
JWT_SECRET=your_secure_secret
```

### Frontend (.env.local in root)

**Note:** TMDb API key is now configured in Admin System Settings, not in .env.local.

The frontend .env.local file is optional and primarily used for development overrides if needed.

## MongoDB Connection

**CRITICAL**: This app connects to a **remote MongoDB server** at 192.168.1.100 (not localhost).

- MongoDB must be running on the network before starting the app
- Connection configured in `backend/.env`
- Database name: `dashboard`
- The app does NOT start or manage MongoDB

**Collections:**
- `preferences` - User settings and favorites
- `gamecaches` - Cached sports game data
- `standingscaches` - Cached standings data
- `photos` - Uploaded photos
- `usageevents` - Usage tracking
- `admincredentials` - Admin accounts

## Key Architecture Patterns

### Data Flow

1. Frontend makes requests to `/api/*`
2. Vite dev server proxies to `localhost:3001` (see `vite.config.js`)
3. Backend handles requests:
   - Proxies to external APIs (NHL, ESPN, Disney, TMDb)
   - Caches responses intelligently based on game state
   - Stores preferences/photos in MongoDB

### Smart Caching Strategy

Backend caches sports data dynamically based on game state:

- **Live games**: 1-minute cache (fast updates)
- **Pre-game**: 5-minute cache (less frequent)
- **All games final**: 60-minute cache (minimal API calls)

Frontend requests data every 30 seconds. Backend serves from cache or refreshes based on cache age.

### Backend Routes

**MongoDB Operations:**
- `/api/preferences` - User preferences CRUD
- `/api/photos` - Photo upload/retrieval
- `/api/games/*` - Game data with caching
- `/api/standings/*` - Standings data with caching
- `/api/usage` - Usage event tracking
- `/api/admin/auth` - Admin authentication

**External API Proxies:**
- `/api/nhl/*` → api-web.nhle.com
- `/api/nfl/*` → site.api.espn.com
- `/api/mlb/*` → site.api.espn.com
- `/api/queue-times/*` → queue-times.com

Routes are in `backend/routes/`. Each route file exports an Express router.

### Frontend Components

**Dashboard Views** (`components/dashboards/`):
- `TodaysGames.jsx` - NHL/NFL/MLB live scores
- `Standings.jsx` - NHL/NFL division standings
- `DisneyDashboard.jsx` - Wait times + crowd levels
- `MoviesDashboard.jsx` - Upcoming movie releases
- `PhotoGallery.jsx` - Photo management
- `PlayerStats.jsx` - NHL player statistics modal

**Layout** (`components/layout/`):
- `Layout.jsx` - Fixed header navigation with dashboard switcher

**Settings** (`components/settings/`):
- `UserSettings.jsx` - User preferences modal (favorite teams, location, countdowns, photos)
- `UserPhotos.jsx` - User photo management (family photos, event slides)

**Admin** (`components/admin/`):
- `Admin.jsx` - Admin panel with tabs for system settings, photos, analytics, users
- `AdminSystemSettings.jsx` - System-wide settings (TMDb API key)
- `AdminUsers.jsx` - User management interface (view all users, manage admin status)
- `AdminDisneyDefaults.jsx` - Default Disney ride preferences for new users
- `PhotoManagement.jsx` - Dashboard asset photo management
- `UsageAnalytics.jsx` - Usage tracking and analytics

### State Management

- React hooks (`useState`, `useEffect`)
- Custom hooks in `hooks/` (e.g., `usePreferences.js`, `useAuth.js`)
- AuthContext for user authentication state
- Minimal global state - keeping it simple

## External APIs

**No API key required:**
- NHL API (api-web.nhle.com)
- ESPN NFL/MLB API (site.api.espn.com)
- Queue-Times API (queue-times.com)
- ThemeParks.Wiki API (api.themeparks.wiki)

**API key required:**
- TMDb API - Movies data (configured in Admin System Settings)

All external requests are proxied through backend to avoid CORS and enable caching.

## Authentication System

### User Accounts
**Access:** Click "Settings" button in navigation, then "Create Account" if needed

Users can:
- Create accounts with username/display name/password
- Manage personal preferences (favorite teams, location, etc.)
- Manage personal photos (family photos, event slides)
- Configure countdowns and Disney ride preferences
- Log out from Settings panel

**First User Setup:**
- When creating the first account, a special "Admin Account Setup" screen is displayed
- The first user is automatically assigned admin privileges
- The setup screen explains admin permissions and responsibilities
- This ensures there is always at least one admin account
- Additional admins can be designated from the Admin Panel → Users tab

### Admin Access
**Access:** Click "Admin" button in navigation (only visible to admin users)

Admin users have access to:
- **System Settings:** Configure system-wide settings (TMDb API key)
- **Users:** View all registered users and manage admin status
- **Disney Defaults:** Set default Disney ride preferences for new users
- **Photo Management:** Manage dashboard asset photos
- **Usage Analytics:** View usage tracking across all users

**Admin Management:**
- Admin status is a flag on regular user accounts (`isAdmin` field)
- Admins are designated in Admin Panel → Users tab
- The last remaining admin cannot have their admin status removed (protected)
- All authentication uses the same token system (30-day JWT tokens)

## Production Deployment with PM2

```bash
# Build frontend
cd frontend
npm run build

# Start with PM2
cd /home/leedy/Dashboard
pm2 start ecosystem.config.cjs

# Manage
pm2 status
pm2 logs dashboard-backend
pm2 restart dashboard-backend
pm2 stop dashboard-backend

# Save PM2 config
pm2 save

# Auto-start on boot
pm2 startup
```

In production, backend serves the built frontend from `dist/` folder. No separate frontend server needed.

## Dashboard Features

**Sports Dashboards:**
- Live NHL/NFL/MLB games with real-time scores
- Auto-refresh every 30 seconds with live countdown timer
- NHL intermission detection with countdown to period start
- Division standings
- Favorite team highlighting (always shown first)
- Player statistics (NHL)
- Goal details modal (NHL)

**Disney Dashboard:**
- Real-time wait times for all 4 parks
- Park operating hours (including special events)
- Crowd level indicator (Low/Moderate/High/Very High)
- Two view modes: By Land or By Wait Time

**Other:**
- Upcoming movie releases
- Photo gallery with upload
- Multi-user authentication with personal preferences
- Separate user settings and admin panel
- Usage analytics tracking

## Common Development Tasks

### Add a New Dashboard View

1. Create component in `frontend/src/components/dashboards/NewDashboard.jsx`
2. Add route in `frontend/src/App.jsx`
3. Add to navigation in `frontend/src/components/layout/Layout.jsx`

### Add a New Backend Route

1. Create route file in `backend/routes/newRoute.js`
2. Import in `backend/server.js`
3. Register with `app.use('/api/new-route', newRoute)`

### Update Database Schema

1. Edit model in `backend/models/`
2. Restart backend server
3. MongoDB updates schema automatically on next write

### Debug Backend Issues

- Check backend terminal for errors
- Verify `.env` exists with correct values
- Test MongoDB connection: `mongosh mongodb://user:pass@192.168.1.100:27017/dashboard`
- Check PM2 logs: `pm2 logs dashboard-backend`

### Debug Frontend Issues

- Check browser console
- Verify backend is running on port 3001
- Check Network tab - `/api` requests should be proxied
- Clear localStorage if auth is broken: `localStorage.clear()`

## Common Gotchas

1. **Missing .env files**: Copy from templates in both `backend/` and root
2. **MongoDB unreachable**: Ensure server at 192.168.1.100 is running and accessible
3. **Stale production build**: Run `npm run build` after frontend changes
4. **Wrong port**: Backend must be on 3001 (check `backend/.env` and `vite.config.js`)
5. **PM2 not restarting**: Use `pm2 restart dashboard-backend` after code changes
6. **CORS errors**: Ensure vite proxy is configured correctly
7. **Cache issues**: Backend caching is intentional - wait for cache expiry or restart backend

## Project Documentation

Additional documentation in repository:
- `README.md` - Full project documentation
- `RASPBERRY_PI_SETUP.md` - Raspberry Pi deployment guide
- `KIOSK_MODE.md` - Kiosk mode configuration
- `ROADMAP.md` - Future feature plans
- `ENHANCEMENTS.md` - Enhancement ideas
