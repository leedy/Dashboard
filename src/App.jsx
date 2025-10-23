import { useState } from 'react'
import Layout from './components/layout/Layout'
import SportsDashboard from './components/dashboards/SportsDashboard'
import './App.css'

function App() {
  const [currentDashboard, setCurrentDashboard] = useState('sports')

  const renderDashboard = () => {
    switch (currentDashboard) {
      case 'sports':
        return <SportsDashboard />
      case 'weather':
        return <div>Weather Dashboard - Coming Soon!</div>
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
