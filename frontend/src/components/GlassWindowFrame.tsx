import React from 'react'
import { Play, RefreshCw } from 'lucide-react'
import { useVanguardStore } from '../store/useVanguardStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { useScan } from '../hooks/useScan'

interface GlassWindowFrameProps {
  children: React.ReactNode
}

export default function GlassWindowFrame({ children }: GlassWindowFrameProps) {
  const {
    mockMode,
    toggleMockMode,
    scanStatus
  } = useVanguardStore()

  const { triggerScan } = useScan()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { to: '/dashboard', label: 'Detection' },
    { to: '/scanner', label: 'Console Logs' },
    { to: '/threats', label: 'Threat Radar' },
    { to: '/ai', label: 'AI Copilot' },
    { to: '/history', label: 'Audit Trail' },
  ]

  const isScanning = scanStatus === 'running'

  return (
    <div className="relative z-30 w-full min-h-screen flex flex-col justify-between">
      {/* ── Top Navigation Bar (Matching Reference Aesthetic) ─────────────── */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Left: Vanguard Typography Brand */}
        <div
          onClick={() => navigate('/dashboard')}
          className="cursor-pointer group flex items-center gap-2 select-none"
        >
          {/* Subtle cloud icon */}
          <span className="text-xl">☁️</span>
          <span className="vanguard-wordmark-logo text-lg sm:text-xl font-bold tracking-tight">
            Vanguard
          </span>
        </div>

        {/* Center / Right: Clean Links & Actions */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.map(({ to, label }) => {
              const isActive = location.pathname === to
              return (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className={`transition-colors ${
                    isActive ? 'text-slate-950 font-semibold' : 'hover:text-slate-950'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </nav>

          {/* Mode Pill (Mock / Live) */}
          <button
            onClick={toggleMockMode}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/70 hover:bg-white border border-black/5 text-slate-700 shadow-sm transition-all"
            title="Toggle between simulated and live AWS environment"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${mockMode ? 'bg-sky-500' : 'bg-rose-500'}`} />
            <span>{mockMode ? 'Mock Simulation' : 'Live AWS'}</span>
          </button>

          {/* Primary Action Button (Black Pill matching reference) */}
          <button
            onClick={() => triggerScan()}
            disabled={isScanning}
            className="btn-pill-dark text-xs sm:text-sm py-2 px-5"
          >
            {isScanning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-white" />
            )}
            <span>{isScanning ? 'Detecting…' : 'Run Detection'}</span>
          </button>
        </div>
      </header>

      {/* ── Main Viewport Area ────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {children}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
        <p className="font-medium">Vanguard — Autonomous Cloud Threat Detection & Incident Defense</p>
      </footer>
    </div>
  )
}
