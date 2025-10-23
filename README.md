# Dashboard App

A modern, responsive dashboard application built with React and Vite. This app provides multiple dashboard views for different types of information, starting with a Sports Info dashboard.

## Features

- **Sports Info Dashboard**: View recent games, upcoming games, and standings for NFL, NBA, and MLB
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode Support**: Automatically adapts to your system's color scheme preference
- **Modular Architecture**: Easy to add new dashboards and extend functionality

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
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

### Building for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
dashboard-app/
├── src/
│   ├── components/
│   │   ├── dashboards/      # Individual dashboard components
│   │   │   ├── SportsDashboard.jsx
│   │   │   └── SportsDashboard.css
│   │   └── layout/          # Layout components
│   │       ├── Layout.jsx
│   │       └── Layout.css
│   ├── App.jsx              # Main app component
│   ├── App.css
│   ├── index.css            # Global styles
│   └── main.jsx             # App entry point
├── public/                  # Static assets
├── index.html
└── package.json
```

## Adding New Dashboards

To add a new dashboard:

1. Create a new component in `src/components/dashboards/`:
```jsx
// src/components/dashboards/WeatherDashboard.jsx
function WeatherDashboard() {
  return <div>Weather Dashboard Content</div>
}
export default WeatherDashboard
```

2. Update `src/components/layout/Layout.jsx` to include the new dashboard in the navigation:
```jsx
const dashboards = [
  { id: 'sports', name: 'Sports Info', available: true },
  { id: 'weather', name: 'Weather', available: true }, // Change to true
  // ... other dashboards
]
```

3. Update `src/App.jsx` to render the new dashboard:
```jsx
import WeatherDashboard from './components/dashboards/WeatherDashboard'

// In the renderDashboard function:
case 'weather':
  return <WeatherDashboard />
```

## Connecting to Real APIs

The Sports Dashboard currently uses sample data. To connect to real sports APIs:

1. Consider these API options:
   - [ESPN API](http://www.espn.com/apis/devcenter/docs/)
   - [The Sports DB](https://www.thesportsdb.com/api.php)
   - [SportsData.io](https://sportsdata.io/)
   - [API-SPORTS](https://api-sports.io/)

2. Install axios for API calls:
```bash
npm install axios
```

3. Update the dashboard to fetch real data using `useEffect` and `useState`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Visit [Vercel](https://vercel.com) and import your repository
3. Vercel will automatically detect Vite and configure the build settings

### Deploy to Netlify

1. Push your code to GitHub
2. Visit [Netlify](https://netlify.com) and create a new site from Git
3. Build command: `npm run build`
4. Publish directory: `dist`

### Deploy to GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Update `vite.config.js` to set the base path:
```js
export default defineConfig({
  base: '/dashboard-app/',
  // ... other config
})
```

3. Add deploy scripts to `package.json`:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

4. Deploy:
```bash
npm run deploy
```

## Future Dashboard Ideas

- Weather Dashboard (forecasts, radar, alerts)
- Disney Info Dashboard (park wait times, showtimes)
- Finance Dashboard (stocks, crypto)
- News Dashboard (headlines, RSS feeds)
- Calendar/Tasks Dashboard
- Social Media Dashboard

## Technologies Used

- **React 19** - UI library
- **Vite 7** - Build tool and dev server
- **CSS3** - Styling with modern features
- **ESLint** - Code quality

## License

This project is open source and available under the MIT License.
