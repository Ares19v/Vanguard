import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Activity, Globe } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useVanguardStore } from '../store/useVanguardStore'
import SeverityBadge from '../components/SeverityBadge'

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#3b82f6', INFO: '#6b7280'
}

const EVENT_ICONS: Record<string, string> = {
  PORT_SCAN:        '🔍',
  BRUTE_FORCE:      '🔨',
  DATA_EXFIL:       '📤',
  C2_BEACON:        '📡',
  LATERAL_MOVEMENT: '↔️',
  RECON:            '🛰️',
  PRIVILEGE_ESC:    '⬆️',
}

export default function ThreatFeed() {
  const { threatEvents, isWsConnected, threatEventCount } = useVanguardStore()
  const feedRef = useRef<HTMLDivElement>(null)

  // Count by event type for bar chart
  const typeCounts = Object.fromEntries(
    Object.keys(EVENT_ICONS).map(t => [t, 0])
  )
  threatEvents.forEach(e => {
    if (typeCounts[e.event_type] !== undefined) typeCounts[e.event_type]++
  })
  const chartData = Object.entries(typeCounts).map(([name, count]) => ({
    name: name.replace('_', ' '),
    count,
  }))

  // Events per minute estimate
  const eventsPerMin = Math.round(threatEventCount / Math.max(1, threatEvents.length / 60))

  const criticalCount = threatEvents.filter(e => e.severity === 'CRITICAL').length
  const highCount     = threatEvents.filter(e => e.severity === 'HIGH').length

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wifi className="w-6 h-6 text-teal" /> Live Threat Feed
          </h1>
          <p className="text-sm text-muted mt-1">
            Real-time network threat detection stream
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isWsConnected
            ? <><div className="dot-online" /><span className="text-xs font-mono text-success">LIVE</span></>
            : <><WifiOff className="w-4 h-4 text-danger" /><span className="text-xs font-mono text-danger">RECONNECTING</span></>
          }
        </div>
      </motion.div>

      {/* ── Stat bar ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        {[
          { label: 'Total Events',   value: threatEventCount, color: '#3b82f6', icon: Activity },
          { label: 'Critical',       value: criticalCount,    color: '#ef4444', icon: Activity },
          { label: 'High',           value: highCount,        color: '#f97316', icon: Activity },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="metric-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted">{label}</span>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="text-3xl font-mono font-bold number-glow" style={{ color }}>
              {value}
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Live feed ───────────────────────────────────────────────── */}
        <div className="xl:col-span-2">
          <div className="text-xs font-mono text-muted mb-2 tracking-wider">📡 INCOMING EVENTS (newest first)</div>
          <div ref={feedRef} className="glass rounded-xl h-[520px] overflow-y-auto divide-y divide-border">
            {threatEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted">
                <Wifi className="w-10 h-10 mb-3 opacity-30" />
                <span className="text-sm">Connecting to threat stream…</span>
              </div>
            ) : (
              threatEvents.slice(0, 200).map((evt, i) => (
                <motion.div
                  key={evt.event_id}
                  initial={i < 3 ? { opacity: 0, x: -8 } : false}
                  animate={i < 3 ? { opacity: 1, x: 0 } : undefined}
                  className={`flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors ${
                    evt.severity === 'CRITICAL' ? 'bg-danger/5 border-l-2 border-danger -ml-0 pl-4' : ''
                  }`}
                >
                  <span className="text-base shrink-0">{EVENT_ICONS[evt.event_type] || '⚡'}</span>

                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-4">
                    <div className="font-mono text-xs text-bright truncate">
                      {evt.source_ip}:{evt.source_port}
                    </div>
                    <div className="font-mono text-xs text-muted truncate">
                      → {evt.target_ip}:{evt.target_port}
                    </div>
                    <div className="text-[10px] text-muted">{evt.event_type.replace('_', ' ')}</div>
                    <div className="text-[10px] text-muted flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" />
                      {evt.geo.country} · {evt.geo.city}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted">{evt.protocol}</span>
                    <SeverityBadge severity={evt.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'} />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* ── Chart panel ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <div className="text-xs font-mono text-muted mb-3 tracking-wider">📊 EVENTS BY TYPE</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'JetBrains Mono' }} width={88} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top source IPs */}
          <div className="glass rounded-xl p-4">
            <div className="text-xs font-mono text-muted mb-3 tracking-wider">🌍 TOP THREAT SOURCES</div>
            {Object.entries(
              threatEvents.reduce<Record<string, number>>((acc, e) => {
                acc[`${e.source_ip} (${e.geo.country})`] = (acc[`${e.source_ip} (${e.geo.country})`] || 0) + 1
                return acc
              }, {})
            )
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([ip, count]) => (
                <div key={ip} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-xs font-mono text-muted truncate">{ip}</span>
                  <span className="text-xs font-mono text-teal shrink-0 ml-2">{count}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
