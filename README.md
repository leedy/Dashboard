# Dashboard App

A modern, responsive dashboard application built with React and Vite. This app provides multiple real-time dashboard views displaying live sports data, theme park wait times, and entertainment information - perfect for a TV display or home dashboard.

## Features

### 🏒 NHL Dashboard
- **Today's Games**: Live NHL games with real-time scores, period information, and game clock
- **Division Standings**: Current NHL standings organized by division
- **Player Stats**: Click any team name to view detailed player statistics including goals, assists, points, and plus/minus
- **Auto-Refresh**: Game data updates every 60 seconds automatically
- **Team Logos**: Full team logo support including new franchises (Utah Hockey Club/Mammoth)

### 🏈 NFL Dashboard
- **Today's Games**: Live NFL games with real-time scores, quarter, and game clock
- **Division Standings**: Current NFL standings organized by division (AFC/NFC East, West, North, South)
- **Live Updates**: Game scores refresh every 60 seconds
- **Favorite Team Highlighting**: Your favorite team is visually highlighted in the games list

### 🏰 Disney World Dashboard
- **Live Wait Times**: Real-time ride wait times for all Disney World parks
- **Park Hours**: Operating hours including special ticketed events (Halloween parties, etc.)
- **Four Parks**: Magic Kingdom, Epcot, Hollywood Studios, and Animal Kingdom
- **Visual Indicators**: Color-coded wait times (green for walk-on, red for long waits)
- **By Land**: Wait times organized by themed lands within each park

### 🎬 Upcoming Movies Dashboard
- **Theatrical Releases**: Upcoming movie releases with posters and release dates
- **TMDb Integration**: Powered by The Movie Database API
- **Movie Details**: View posters, titles, and release information

### 🎮 General Features
- **Responsive Design**: Optimized for TV displays and all screen sizes
- **Fixed Header Navigation**: Easy dashboard switching with always-visible navigation
- **Space-Optimized Layout**: Maximized content area with minimal chrome
- **Live Data**: All sports and theme park data updates in real-time

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd dashboard-app
```

2. Install dependencies:
```bash
npm install
```

### Running Locally

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

**Note**: The development server includes proxy configuration for CORS handling. API requests to NHL, NFL, Disney, and TMDb are automatically proxied.

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

3. **Queue-Times API** (queue-times.com) - No API key required
   - Disney World wait times

4. **ThemeParks.Wiki API** (api.themeparks.wiki) - No API key required
   - Disney park operating hours and schedules

5. **TMDb API** (api.themoviedb.org) - **Requires API key**
   - Movie information and posters
   - Get your free API key at: https://www.themoviedb.org/settings/api

### Setting Up TMDb API Key

Create a `.env` file in the project root:
```env
VITE_TMDB_API_KEY=your_api_key_here
```

## Proxy Configuration

The app uses Vite's proxy feature to handle CORS issues with external APIs. Configuration is in `vite.config.js`:

```javascript
server: {
  proxy: {
    '/api/nhl': {
      target: 'https://api-web.nhle.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/nhl/, ''),
      configure: (proxy) => {
        // No-cache headers to ensure fresh data
      }
    },
    '/api/nfl': { /* ESPN NFL API */ },
    '/api/queue-times': { /* Disney wait times */ }
  }
}
```

## Project Structure

```
dashboard-app/
├── src/
│   ├── components/
│   │   ├── dashboards/           # Dashboard components
│   │   │   ├── TodaysGames.jsx   # NHL/NFL live games
│   │   │   ├── Standings.jsx     # NHL/NFL standings
│   │   │   ├── DisneyDashboard.jsx
│   │   │   ├── UpcomingMovies.jsx
│   │   │   ├── PlayerStats.jsx   # NHL player stats modal
│   │   │   └── *.css             # Component styles
│   │   └── layout/               # Layout components
│   │       ├── Layout.jsx
│   │       └── Layout.css
│   ├── App.jsx                   # Main app component
│   ├── App.css
│   ├── index.css                 # Global styles
│   └── main.jsx                  # App entry point
├── public/                       # Static assets
├── vite.config.js               # Vite configuration with proxies
├── .env                         # Environment variables (API keys)
└── package.json
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

- **React 19** - UI library with hooks
- **Vite 7** - Build tool and dev server
- **Axios** - HTTP client for API requests
- **CSS3** - Modern styling with flexbox and grid
- **ESLint** - Code quality and linting

## API Data Sources

- [NHL API](https://api-web.nhle.com) - Official NHL data
- [ESPN API](https://site.api.espn.com) - NFL scores and standings
- [Queue-Times](https://queue-times.com) - Disney wait times
- [ThemeParks.Wiki](https://api.themeparks.wiki) - Theme park schedules
- [TMDb](https://www.themoviedb.org) - Movie database

## Future Enhancement Ideas

- NBA and MLB integration
- Weather dashboard with forecasts and radar
- Universal Studios wait times
- Movie showtimes for local theaters
- Traffic/commute information
- Calendar integration
- Smart home controls integration

## License

This project is open source and available under the MIT License.
