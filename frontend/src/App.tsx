import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Scanner from './pages/Scanner'
import ThreatFeed from './pages/ThreatFeed'
import Remediator from './pages/Remediator'
import AIConsultant from './pages/AIConsultant'
import ScanHistory from './pages/ScanHistory'
import ResourceInventory from './pages/ResourceInventory'
import CostDashboard from './pages/CostDashboard'
import Metrics from './pages/Metrics'
import IAMExplorer from './pages/IAMExplorer'
import ConnectAccount from './pages/ConnectAccount'
import { useWebSocket } from './hooks/useWebSocket'
import { useScan } from './hooks/useScan'

export default function App() {
  useWebSocket()
  const { fetchHistory } = useScan()

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/"          element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scanner"   element={<Scanner />} />
          <Route path="/threats"   element={<ThreatFeed />} />
          <Route path="/remediate" element={<Remediator />} />
          <Route path="/ai"        element={<AIConsultant />} />
          <Route path="/history"   element={<ScanHistory />} />
          <Route path="/inventory" element={<ResourceInventory />} />
          <Route path="/costs"     element={<CostDashboard />} />
          <Route path="/metrics"   element={<Metrics />} />
          <Route path="/iam"       element={<IAMExplorer />} />
          <Route path="/connect"   element={<ConnectAccount />} />
        </Routes>
      </main>
    </div>
  )
}
