# Dashboard App

A modern, responsive dashboard application built with React and Vite. This app provides multiple real-time dashboard views displaying live sports data (NHL, NFL, MLB), theme park wait times, and entertainment information - perfect for a TV display or home dashboard.

## Features

### 🏒 NHL Dashboard
- **Today's Games**: Live NHL games with real-time scores, period information, and game clock
- **Intermission Detection**: Displays "End 1st", "End 2nd", etc. with live countdown to period start
- **Refresh Countdown**: Shows time until next data refresh (e.g., "refreshing in 23s")
- **Division Standings**: Current NHL standings organized by division
- **Player Stats**: Click any team name to view detailed player statistics including goals, assists, points, and plus/minus
- **Auto-Refresh**: Game data updates every 30 seconds during live games
- **Team Logos**: Full team logo support including new franchises (Utah Hockey Club/Mammoth)
- **Favorite Team First**: Your favorite team's games always appear at the top of the list

### 🏈 NFL Dashboard
- **Today's Games**: Live NFL games with real-time scores, quarter, and game clock
- **Division Standings**: Current NFL standings organized by division (AFC/NFC East, West, North, South)
- **Live Updates**: Game scores refresh every 30-60 seconds during live games
- **Favorite Team Highlighting**: Your favorite team is visually highlighted in the games list

### ⚾ MLB Dashboard
- **Today's Games**: Live MLB games with real-time scores and inning information
- **Live Game Status**: Shows current inning (e.g., "Top 5th", "Bot 3rd") for games in progress
- **Team Logos**: Full team logo support from ESPN
- **Auto-Refresh**: Game data updates every 30-60 seconds during live games
- **Favorite Team Highlighting**: Your favorite team is visually highlighted in the games list

### 🏰 Disney World Dashboard
- **Live Wait Times**: Real-time ride wait times for all Disney World parks
- **Park Hours**: Operating hours including special ticketed events (Halloween parties, etc.)
- **Four Parks**: Magic Kingdom, Epcot, Hollywood Studios, and Animal Kingdom
- **Visual Indicators**: Color-coded wait times (green for walk-on, red for long waits)
- **Crowd Level Indicator**: Real-time crowd level calculation based on average wait times across all open rides
  - 🟢 **Low** (avg < 20 min) - Great time to visit!
  - 🟡 **Moderate** (avg 20-35 min) - Typical crowds
  - 🟠 **High** (avg 35-50 min) - Busy day
  - 🔴 **Very High** (avg > 50 min) - Very crowded
- **Dual View Modes**:
  - **By Land**: Wait times organized by themed lands within each park (original view)
  - **By Wait Time**: All rides sorted by longest wait first in a two-column layout

### 🎬 Upcoming Movies Dashboard
- **Theatrical Releases**: Upcoming movie releases with posters and release dates
- **TMDb Integration**: Powered by The Movie Database API
- **Movie Details**: View posters, titles, and release information

### 🎮 General Features
- **Responsive Design**: Optimized for TV displays and all screen sizes
- **Fixed Header Navigation**: Easy dashboard switching with always-visible navigation
- **Space-Optimized Layout**: Maximized content area with minimal chrome
- **Live Data**: All sports and theme park data updates in real-time
- **Multi-User Support**: Create user accounts with personalized preferences
- **User Settings**: Manage favorite teams, location, countdowns, and personal photos
- **Admin Panel**: Separate admin interface for system-wide settings and analytics

## Data Refresh Strategy

The dashboard uses a smart caching system to balance real-time updates with API rate limits and server load.

### Sports Data (NHL, NFL, MLB)

**Frontend Refresh:**
- Requests new data every **30 seconds**

**Backend Cache (Dynamic based on game state):**

| Game State | Cache Duration | Why |
|------------|----------------|-----|
| **Live Games** | 1 minute | Fast updates for real-time scores during active games |
| **Pre-Game** | 5 minutes | Games haven't started yet, less frequent checking needed |
| **All Final** | 60 minutes | All games completed, no need for frequent updates |

**How it works:**

1. **Before games start (Pre-game):**
   - Frontend requests every 30 seconds
   - Backend serves cached data (refreshes every 5 minutes)
   - **Result:** Updates visible every ~5 minutes (nothing changes frequently anyway)

2. **When games start:**
   - Within 5 minutes, backend detects games are now LIVE
   - Switches to 1-minute cache for real-time updates
   - **Result:** Updates visible every 30-60 seconds ✅

3. **After all games finish:**
   - Backend detects all games are FINAL
   - Switches to 60-minute cache (scores won't change)
   - **Result:** Minimal API calls, data still available

**Typical update timing during live games:**
- **Best case:** 30 seconds (frontend catches fresh cache)
- **Typical:** 30-60 seconds
- **Worst case:** 90 seconds (if timing is unlucky)

**Note:** There may be a 2-5 minute delay when games first start before they're detected as "live" and begin updating frequently. This is intentional to reduce API load during the pre-game period.

### Other Data Sources

- **Disney Wait Times:** Updates based on Queue-Times.com API availability
- **Weather:** Updates based on user preferences (configurable in Admin panel)
- **Standings/Stats:** Cached appropriately based on how frequently they change

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- MongoDB server (local or remote network access)

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd dashboard-app
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
cd ..
```

### Configuration

#### MongoDB Configuration (Backend)

1. Create a `.env` file in the `server/` directory by copying the template:
```bash
cd server
cp .env.template .env
```

2. Edit `server/.env` with your MongoDB connection details:
```env
# MongoDB Configuration
MONGO_HOST=your_mongodb_host  # Your MongoDB server IP, hostname, or localhost
MONGO_PORT=27017              # MongoDB port (default: 27017)
MONGO_USERNAME=your_username  # Your MongoDB username
MONGO_PASSWORD=your_password  # Your MongoDB password
MONGO_DATABASE=dashboard      # Database name

# Backend Server Configuration
BACKEND_PORT=3001             # Backend server port
```

**Note:** For Docker deployments on the same host as MongoDB, use `127.0.0.1` as MONGO_HOST.

**Note**: The MongoDB configuration is stored in `server/.env` (backend), not in the root directory.

#### TMDb API Configuration (Admin Panel)

The TMDb API key for the Movies dashboard is now configured through the Admin Panel:

1. Create a user account (first user is automatically an admin)
2. Click the "Admin" button in the navigation
3. Go to the "System Settings" tab
4. Enter your TMDb API key in the provided field

Get your free API key at: https://www.themoviedb.org/settings/api

**Note:** The `.env.local` file is no longer required for TMDb configuration. All API keys are managed centrally through the admin panel.

### Running Locally

You have **three options** for running the application:

#### Option 1: Run Both Servers Together (Recommended for Development)
This runs both the frontend and backend simultaneously in one command:
```bash
npm run dev:all
```
- Frontend will be available at `http://localhost:5173/` (or 5174 if 5173 is busy)
- Backend will run on `http://localhost:3001`
- Both servers run in the same terminal window

#### Option 2: Run Servers Separately (More Control)
Run each server in its own terminal window for better visibility and control:

**Terminal 1 - Start the Backend Server:**
```bash
cd server
npm run dev
```
This starts the Express backend server on `http://localhost:3001` with MongoDB connection.

**Terminal 2 - Start the Frontend Server:**
```bash
npm run dev
```
This starts the Vite frontend development server on `http://localhost:5173/`.

#### Option 3: Production Mode
For testing production builds:

**Terminal 1 - Start Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Build and Preview Frontend:**
```bash
npm run build
npm run preview
```

### How It Works

- **Frontend (Vite + React)**: Runs on port 5173/5174 and serves the user interface
- **Backend (Express + Node.js)**: Runs on port 3001 and handles:
  - MongoDB database operations for preferences/settings
  - Proxying external API requests (NHL, NFL, MLB, Disney, TMDb)
  - CORS handling
- **MongoDB**: Stores user preferences and settings persistently
- **Proxy**: Frontend proxies all `/api` requests to the backend server

**Note**: Both the frontend and backend servers must be running for the app to work properly.

### Important: MongoDB Connection

**⚠️ The `npm run dev:all` command does NOT install or start MongoDB!**

When you run the application, here's what actually happens:

```
Your Computer                    Your MongoDB Server (e.g., Unraid)
┌─────────────────────────┐      ┌──────────────────────────────┐
│                         │      │                              │
│  Frontend (Vite)        │      │                              │
│  Port: 5173/5174        │      │                              │
│         ↓               │      │                              │
│  Backend (Express)      │──────┼─────> MongoDB                │
│  Port: 3001             │      │       Port: 27017            │
│                         │      │       IP: <your_mongo_host>  │
│  What npm run dev:all   │      │                              │
│  actually starts ↑      │      │  Must already be running!    │
│                         │      │                              │
└─────────────────────────┘      └──────────────────────────────┘
```

**What `npm run dev:all` Actually Does:**
- ✅ Starts the frontend server (Vite) on your computer
- ✅ Starts the backend server (Express/Node.js) on your computer
- ❌ **Does NOT** install or start MongoDB
- ❌ **Does NOT** create a local database

**What You Need:**
- A MongoDB server must be **already running** and accessible at the IP address specified in `server/.env`
- The MongoDB server can be on:
  - Your local network (like an Unraid server at `192.168.1.100`)
  - Your local computer (if you install MongoDB locally)
  - A cloud service (like MongoDB Atlas)

### Network Access Requirements

**When Using a Network MongoDB Server (e.g., Unraid):**

✅ **Works:** When you're on the same network as your MongoDB server
```
You're home → Same WiFi → Can reach your MongoDB server → ✅ App works
```

❌ **Doesn't Work:** When you're away from home
```
You're at coffee shop → Different network → Can't reach your MongoDB server → ❌ App fails
```

### Options for Remote Access

If you need to use the app when away from your home network:

**Option 1: Install MongoDB Locally**
Install MongoDB on your laptop for offline use:
```bash
# macOS with Homebrew
brew install mongodb-community
brew services start mongodb-community

# Update server/.env to use localhost
MONGO_HOST=localhost
```

**Option 2: VPN to Your Home Network**
Use a VPN (like Tailscale or WireGuard) to access your home network remotely. With VPN connected, your MongoDB server IP is always reachable.

**Option 3: MongoDB Atlas (Cloud Database)**
Use a free MongoDB Atlas cluster accessible from anywhere:
- Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster
- Update `server/.env` with the Atlas connection string (you'll need to modify the connection format)

**Option 4: Dual Configuration**
Keep two `server/.env` files and swap them:
- `server/.env.home` - Points to your network MongoDB server
- `server/.env.remote` - Points to localhost or cloud MongoDB

### Building for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## API Configuration

### Required APIs

This app integrates with several APIs:

1. **NHL API** (api-web.nhle.com) - No API key required
   - Live game scores and schedules
   - Team standings
   - Player statistics

2. **ESPN NFL API** (site.api.espn.com) - No API key required
   - Live NFL scores and schedules
   - Team standings

3. **ESPN MLB API** (site.api.espn.com) - No API key required
   - Live MLB scores and schedules
   - Team logos and information

4. **Queue-Times API** (queue-times.com) - No API key required
   - Disney World wait times

5. **ThemeParks.Wiki API** (api.themeparks.wiki) - No API key required
   - Disney park operating hours and schedules

6. **TMDb API** (api.themoviedb.org) - **Requires API key**
   - Movie information and posters
   - Get your free API key at: https://www.themoviedb.org/settings/api
   - **Configured in Admin Panel** (see Authentication System section below)

## Authentication System

The dashboard supports multi-user authentication with separate user and admin access levels.

### User Accounts

**Creating a User Account:**
1. Click the "Settings" button in the navigation header
2. If not logged in, click "Create Account"
3. Enter username, display name, and password
4. Your preferences will be saved to your personal account

**User Features:**
- Personal favorite teams (NHL, NFL, MLB)
- Location and weather preferences
- Custom countdowns
- Personal photo galleries (family photos, event slides)
- Disney ride preferences
- Logout from Settings panel

### Admin Access

**First User Setup:**
- When you first access the registration page, you'll see a special "Admin Account Setup" screen
- This screen explains that the first user automatically becomes an administrator
- Admin privileges include system settings, user management, and analytics access
- The setup process is the same as regular registration, but with clear guidance
- Additional admins can be designated later from the Admin Panel → Users tab

**Accessing Admin Panel:**
- Click the "Admin" button in navigation (only visible to admin users)
- Admin status is a flag on regular user accounts
- The last remaining admin cannot have their admin status removed (protected)

**Admin Features:**
- **System Settings:** TMDb API key configuration and other system-wide settings
- **Users:** View all registered users and manage admin status
- **Disney Defaults:** Set default Disney ride preferences for new users
- **Photo Management:** Manage dashboard asset photos
- **Usage Analytics:** View usage tracking across all users

**Note:** Admin and user authentication use the same token system (30-day JWT tokens). Admin access is controlled by the `isAdmin` field on user accounts.

## Proxy Configuration

The app uses a two-tier proxy system to handle CORS and route requests:

### Frontend Proxy (Vite)
In development, Vite proxies all `/api` requests to the backend server:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',  // Backend server
      changeOrigin: true,
      secure: false,
    }
  }
}
```

### Backend Proxy (Express)
The backend server handles external API requests and MongoDB operations:

```javascript
// server/server.js
app.use('/api/nhl', async (req, res) => {
  // Proxies to https://api-web.nhle.com
});

app.use('/api/nfl', async (req, res) => {
  // Proxies to https://site.api.espn.com
});

app.use('/api/mlb', async (req, res) => {
  // Proxies to https://site.api.espn.com
});

app.use('/api/queue-times', async (req, res) => {
  // Proxies to https://queue-times.com
});

app.use('/api/preferences', preferencesRoutes);
  // MongoDB operations for user preferences
```

This architecture allows the backend to handle authentication, rate limiting, and data transformation in the future.

## MongoDB Database

### Database Schema

The app uses MongoDB to store user preferences with the following schema:

```javascript
{
  userId: 'default-user',        // User identifier (default: 'default-user')
  favoriteNHLTeam: {
    abbrev: 'PHI',               // Team abbreviation
    name: 'Philadelphia Flyers'  // Full team name
  },
  favoriteNFLTeam: {
    abbrev: 'PHI',
    name: 'Philadelphia Eagles'
  },
  favoriteMLBTeam: {
    abbrev: 'PHI',
    name: 'Philadelphia Phillies'
  },
  weatherLocation: {
    zipcode: '17042',
    city: 'Lebanon, PA',
    latitude: 40.34093,
    longitude: -76.41135
  },
  countdownEvent: {
    name: 'New Year',
    date: '2026-01-01'
  },
  defaultDashboard: 'todays-games',  // Default dashboard on load
  displaySettings: {
    autoRotate: false,                // Auto-rotate dashboards
    refreshInterval: 60000            // Refresh interval in ms
  },
  createdAt: Date,                    // Auto-generated timestamp
  updatedAt: Date                     // Auto-generated timestamp
}
```

### Collections

- **preferences**: Stores user preferences and settings
  - Currently uses a single document with `userId: 'default-user'`
  - Ready to be extended for multi-user support in the future

### Benefits of MongoDB Integration

- **Persistence**: Settings survive browser cache clears and page refreshes
- **Multi-device**: Access the same preferences from different browsers/devices
- **Scalability**: Easy to add new collections for features like:
  - Historical game data
  - Wait time tracking
  - Custom dashboard layouts
  - User authentication

## Project Structure

```
dashboard-app/
├── server/                       # Backend server
│   ├── config/
│   │   └── database.js          # MongoDB connection configuration
│   ├── models/
│   │   └── Preferences.js       # Mongoose schema for user preferences
│   ├── routes/
│   │   └── preferences.js       # API routes for preferences
│   ├── server.js                # Express server entry point
│   ├── package.json             # Backend dependencies
│   ├── .env                     # Backend environment variables (MongoDB config)
│   └── .env.template            # Template for backend environment variables
├── src/                         # Frontend
│   ├── components/
│   │   ├── dashboards/          # Dashboard components
│   │   │   ├── TodaysGames.jsx  # NHL/NFL/MLB live games
│   │   │   ├── Standings.jsx    # NHL/NFL standings
│   │   │   ├── DisneyDashboard.jsx
│   │   │   ├── MoviesDashboard.jsx
│   │   │   ├── PlayerStats.jsx  # NHL player stats modal
│   │   │   └── *.css            # Component styles
│   │   ├── layout/              # Layout components
│   │   │   ├── Layout.jsx
│   │   │   └── Layout.css
│   │   └── settings/            # Settings components
│   │       └── Settings.jsx
│   ├── hooks/
│   │   └── usePreferences.js    # Custom hook for MongoDB preferences
│   ├── App.jsx                  # Main app component
│   ├── App.css
│   ├── index.css                # Global styles
│   └── main.jsx                 # App entry point
├── public/                      # Static assets
├── vite.config.js              # Vite configuration (proxies to backend)
├── .env.local                  # Frontend environment variables (TMDb API key)
├── .env.local.template         # Template for frontend environment variables
└── package.json                # Frontend dependencies
```

## Key Implementation Details

### Auto-Refresh Pattern

Sports dashboards auto-refresh every 60 seconds:

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    fetchGames();
  }, 60000); // 60 seconds

  return () => clearInterval(interval);
}, []);
```

### Cache-Busting

To ensure fresh data, API requests include timestamp query parameters:

```javascript
const cacheBuster = Date.now();
const response = await axios.get(`/api/nhl/v1/score/${date}?_=${cacheBuster}`);
```

### Date Handling

The app uses local time (not UTC) to avoid date rollover issues:

```javascript
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`;
```

### Disney Park Hours with Special Events

Park hours show the latest closing time including special ticketed events:

```javascript
const todaySchedules = scheduleData.filter(
  entry => entry.date === todayStr &&
  (entry.type === 'OPERATING' || entry.type === 'TICKETED_EVENT')
);

const latestClosing = new Date(Math.max(...closingTimes));
```

### Real-Time Crowd Level Calculation

The Disney dashboard calculates live crowd levels based on current wait times:

```javascript
// Calculate average wait time across all open rides
const openRides = allRides.filter(ride => ride.is_open);
const averageWaitTime = totalWaitTime / openRides.length;

// Categorize into crowd levels
if (averageWaitTime < 20) return 'Low';
else if (averageWaitTime < 35) return 'Moderate';
else if (averageWaitTime < 50) return 'High';
else return 'Very High';
```

This provides an instant, data-driven assessment of current park congestion without requiring third-party crowd prediction APIs.

## Adding New Dashboards

To add a new dashboard:

1. Create a new component in `src/components/dashboards/`:
```jsx
// src/components/dashboards/WeatherDashboard.jsx
function WeatherDashboard() {
  return <div className="dashboard">Weather Dashboard Content</div>
}
export default WeatherDashboard
```

2. Update `src/components/layout/Layout.jsx`:
```jsx
const dashboards = [
  { id: 'sports', name: 'Sports Info', available: true },
  { id: 'weather', name: 'Weather', available: true },
  // ... other dashboards
]
```

3. Update `src/App.jsx`:
```jsx
import WeatherDashboard from './components/dashboards/WeatherDashboard'

// In the renderDashboard function:
case 'weather':
  return <WeatherDashboard />
```

## Known Issues & Limitations

- **NHL API Delay**: The NHL API has a 30-60 second delay from real-time. Auto-refresh is set to 60 seconds to balance freshness with API load.
- **Production Deployment**: Proxy configuration works in development. For production, you'll need to set up a backend server or use serverless functions to proxy API requests.
- **TMDb API Key**: Required for the Movies dashboard. Get a free key at themoviedb.org.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Visit [Vercel](https://vercel.com) and import your repository
3. Add environment variable: `VITE_TMDB_API_KEY`
4. Vercel will automatically detect Vite and configure build settings

**Note**: You'll need to set up serverless functions or rewrites to handle API proxying in production.

### Deploy to Netlify

1. Push your code to GitHub
2. Visit [Netlify](https://netlify.com) and create a new site from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variable: `VITE_TMDB_API_KEY`
6. Configure redirects in `netlify.toml` for API proxying

## Technologies Used

### Frontend
- **React 19** - UI library with hooks
- **Vite 7** - Build tool and dev server
- **Axios** - HTTP client for API requests
- **CSS3** - Modern styling with flexbox and grid
- **ESLint** - Code quality and linting

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **MongoDB** - NoSQL database for data persistence
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin resource sharing middleware
- **dotenv** - Environment variable management

## API Data Sources

- [NHL API](https://api-web.nhle.com) - Official NHL data
- [ESPN API](https://site.api.espn.com) - NFL and MLB scores and standings
- [Queue-Times](https://queue-times.com) - Disney wait times
- [ThemeParks.Wiki](https://api.themeparks.wiki) - Theme park schedules
- [TMDb](https://www.themoviedb.org) - Movie database

## Future Enhancement Ideas

- NBA integration
- Weather dashboard with forecasts and radar
- Universal Studios wait times
- Movie showtimes for local theaters
- Traffic/commute information
- Calendar integration
- Smart home controls integration

## License

This project is open source and available under the MIT License.
