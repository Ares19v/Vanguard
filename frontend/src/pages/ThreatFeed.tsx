import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Activity, Globe, ShieldAlert, Radio, AlertOctagon } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { useVanguardStore } from '../store/useVanguardStore'
import SeverityBadge from '../components/SeverityBadge'

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

  const criticalCount = threatEvents.filter(e => e.severity === 'CRITICAL').length
  const highCount     = threatEvents.filter(e => e.severity === 'HIGH').length

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-light-card p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-950 flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-slate-800" />
            <span>Global Threat Radar & Telemetry Stream</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time simulated network beacons, brute-force intrusions, and exfiltration attempts
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200">
          {isWsConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono font-bold text-slate-800">Live Telemetry Stream</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-xs font-mono font-bold text-rose-700">Reconnecting Feed…</span>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Stat Bar ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Inbound Packets', value: threatEventCount, text: 'text-slate-900', icon: Activity, iconColor: 'text-indigo-600' },
          { label: 'Critical Threat Vectors', value: criticalCount, text: 'text-rose-600', icon: ShieldAlert, iconColor: 'text-rose-600' },
          { label: 'High Priority Alerts', value: highCount, text: 'text-amber-600', icon: AlertOctagon, iconColor: 'text-amber-600' },
        ].map(({ label, value, text, icon: Icon, iconColor }) => (
          <div key={label} className="glass-light-card p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">{label}</span>
              <div className={`text-3xl font-display font-extrabold mt-1 ${text}`}>
                {value}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200">
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* ── Live Stream Table ───────────────────────────────────────── */}
        <div className="xl:col-span-8 flex flex-col space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase">
              Live Network Attack Telemetry
            </span>
            <span className="text-[11px] font-mono text-slate-500">Auto-streaming latest 200 events</span>
          </div>

          <div ref={feedRef} className="glass-light-card h-[500px] overflow-y-auto divide-y divide-slate-100">
            {threatEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Wifi className="w-10 h-10 mb-2 opacity-40 animate-pulse" />
                <span className="text-xs text-slate-500">Connecting to live threat telemetry…</span>
              </div>
            ) : (
              threatEvents.slice(0, 200).map((evt, i) => (
                <motion.div
                  key={evt.event_id || i}
                  initial={i < 3 ? { opacity: 0, x: -6 } : false}
                  animate={i < 3 ? { opacity: 1, x: 0 } : undefined}
                  className={`flex items-center gap-3.5 px-5 py-3 hover:bg-slate-50 transition-colors ${
                    evt.severity === 'CRITICAL' ? 'bg-rose-50/50 border-l-2 border-rose-500' : ''
                  }`}
                >
                  <span className="text-base shrink-0 p-1.5 rounded-xl bg-slate-100">
                    {EVENT_ICONS[evt.event_type] || '⚡'}
                  </span>

                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5">
                    <div className="font-mono text-xs font-bold text-slate-900 truncate">
                      {evt.source_ip}:{evt.source_port}
                    </div>
                    <div className="font-mono text-xs font-medium text-slate-700 truncate">
                      → {evt.target_ip}:{evt.target_port}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{evt.event_type.replace('_', ' ')}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <span>{evt.geo?.country || 'Unknown'} · {evt.geo?.city || 'Origin'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      {evt.protocol}
                    </span>
                    <SeverityBadge severity={evt.severity as any} size="sm" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* ── Visual Analytics Side Panel ─────────────────────────────── */}
        <div className="xl:col-span-4 space-y-4">
          <div className="glass-light-card p-5">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-800 tracking-wider mb-3">
              📊 Threat Vector Breakdown
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: -15, right: 10, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#334155', fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 500 }} width={95} />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      borderColor: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      color: '#0f172a'
                    }}
                    itemStyle={{ color: '#090d16', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" fill="#090d16" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Threat Origins */}
          <div className="glass-light-card p-5">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-800 tracking-wider mb-3">
              🌍 Top Geographic Origins
            </h3>
            <div className="space-y-2">
              {Object.entries(
                threatEvents.reduce<Record<string, number>>((acc, e) => {
                  const key = `${e.source_ip} (${e.geo?.country || 'Unknown'})`
                  acc[key] = (acc[key] || 0) + 1
                  return acc
                }, {})
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([origin, count]) => (
                  <div key={origin} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono">
                    <span className="text-slate-800 truncate font-medium">{origin}</span>
                    <span className="text-slate-900 font-bold ml-2 bg-slate-200 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
