import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import CelestialBackground from './components/CelestialBackground'
import GlassWindowFrame from './components/GlassWindowFrame'

import Dashboard from './pages/Dashboard'
import Scanner from './pages/Scanner'
import ThreatFeed from './pages/ThreatFeed'
import Remediator from './pages/Remediator'
import AIConsultant from './pages/AIConsultant'
import ScanHistory from './pages/ScanHistory'
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
    <div className="relative min-h-screen text-slate-100 selection:bg-sky-500 selection:text-white flex flex-col justify-between">
      {/* ── Dynamic Starfield & Anime Cloudscape Background ─────────────── */}
      <CelestialBackground />

      {/* ── Main Floating Glass OS Command Center ────────────────────────── */}
      <div className="flex-1 w-full flex items-center justify-center">
        <GlassWindowFrame>
          <Routes>
            <Route path="/"          element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scanner"   element={<Scanner />} />
            <Route path="/remediate" element={<Remediator />} />
            <Route path="/threats"   element={<ThreatFeed />} />
            <Route path="/ai"        element={<AIConsultant />} />
            <Route path="/history"   element={<ScanHistory />} />
            <Route path="/connect"   element={<ConnectAccount />} />
            {/* Fallback routes */}
            <Route path="*"          element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </GlassWindowFrame>
      </div>
    </div>
  )
}
