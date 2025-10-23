import { useState } from 'react'
import Layout from './components/layout/Layout'
import SportsDashboard from './components/dashboards/SportsDashboard'
import WeatherDashboard from './components/dashboards/WeatherDashboard'
import './App.css'

function App() {
  const [currentDashboard, setCurrentDashboard] = useState('sports')

  const renderDashboard = () => {
    switch (currentDashboard) {
      case 'sports':
        return <SportsDashboard />
      case 'weather':
        return <WeatherDashboard />
      case 'disney':
        return <div>Disney Dashboard - Coming Soon!</div>
      default:
        return <SportsDashboard />
    }
  }

  return (
    <Layout
      currentDashboard={currentDashboard}
      onDashboardChange={setCurrentDashboard}
    >
      {renderDashboard()}
    </Layout>
  )
}

export default App
