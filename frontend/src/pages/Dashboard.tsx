
import { motion } from 'framer-motion'
import {
  ShieldCheck, AlertTriangle, Activity, Terminal,
  TrendingUp, Layers
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import { useVanguardStore } from '../store/useVanguardStore'
import { useScan } from '../hooks/useScan'
import RiskRing from '../components/RiskRing'
import SeverityBadge from '../components/SeverityBadge'
import { useNavigate } from 'react-router-dom'
import { CleanDashboard } from '../components/CleanModePages'

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const ITEM = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const SERVICES = [
  { name: 'S3',         icon: '🪣', color: '#f59e0b' },
  { name: 'IAM',        icon: '🔑', color: '#ef4444' },
  { name: 'EC2',        icon: '🖥️', color: '#3b82f6' },
  { name: 'RDS',        icon: '🗄️', color: '#8b5cf6' },
  { name: 'CloudTrail', icon: '📋', color: '#06b6d4' },
  { name: 'GuardDuty',  icon: '👁️', color: '#10b981' },
]

const CHART_DATA = [
  { name: '6h ago', score: 0  },
  { name: '5h ago', score: 12 },
  { name: '4h ago', score: 28 },
  { name: '3h ago', score: 55 },
  { name: '2h ago', score: 71 },
  { name: '1h ago', score: 78 },
  { name: 'Now',    score: 0  },
]

export default function Dashboard() {
  const { findings, overallScore, scanStatus, lastScanMode, scanDuration, threatEvents, cleanMode } = useVanguardStore()
  const { triggerScan } = useScan()
  const navigate = useNavigate()

  const critical = findings.filter(f => f.severity === 'CRITICAL').length
  const high     = findings.filter(f => f.severity === 'HIGH').length
  const medium   = findings.filter(f => f.severity === 'MEDIUM').length
  const low      = findings.filter(f => f.severity === 'LOW').length

  // Fill real score into chart (don't mutate const)
  const chartData = CHART_DATA.map((d, i) =>
    i === CHART_DATA.length - 1 ? { ...d, score: overallScore } : d
  )

  const topFinding = findings.find(f => f.severity === 'CRITICAL') || findings[0]
  const recentThreats = threatEvents.slice(0, 5)

  if (cleanMode) {
    return <CleanDashboard score={overallScore} critical={critical} high={high} medium={medium} low={low} findings={findings} />
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-bright flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-accent" />
            Security Overview
          </h1>
          <p className="text-sm text-muted mt-1">
            {lastScanMode === 'mock' ? '🔵 Mock Environment' : '🔴 Live AWS Environment'}
            {scanDuration > 0 && <span className="ml-2">· Scanned in {scanDuration}s</span>}
          </p>
        </div>
        <button
          onClick={triggerScan}
          disabled={scanStatus === 'running'}
          className="btn-primary flex items-center gap-2"
        >
          <Terminal className="w-4 h-4" />
          {scanStatus === 'running' ? 'Scanning…' : 'Run Scan'}
        </button>
      </motion.div>

      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* ── Row 1: Risk ring + stat cards ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Risk ring card */}
          <motion.div variants={ITEM} className="glass rounded-2xl p-6 lg:col-span-1 flex flex-col items-center gap-4">
            <div className="text-xs font-mono text-muted tracking-widest">RISK POSTURE</div>
            <RiskRing score={overallScore} size={160} />
            <div className="text-center">
              <div className="text-sm font-semibold text-bright">{findings.length} findings</div>
              <div className="text-xs text-muted">{findings.filter(f => f.is_remediated).length} remediated</div>
            </div>
          </motion.div>

          {/* Stat cards */}
          <motion.div variants={ITEM} className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'CRITICAL', value: critical, color: '#ef4444', icon: AlertTriangle },
              { label: 'HIGH',     value: high,     color: '#f97316', icon: TrendingUp   },
              { label: 'MEDIUM',   value: medium,   color: '#f59e0b', icon: Activity     },
              { label: 'LOW',      value: low,      color: '#3b82f6', icon: Layers       },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="metric-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted">{label}</span>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div
                  className="text-4xl font-mono font-bold number-glow"
                  style={{ color }}
                >
                  {value}
                </div>
                <div className="text-xs text-muted">
                  {value === 0 ? 'All clear' : `${value} finding${value !== 1 ? 's' : ''}`}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Row 2: Risk trend + services ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Risk trend chart */}
          <motion.div variants={ITEM} className="glass rounded-2xl p-5 lg:col-span-2">
            <div className="text-xs font-mono text-muted tracking-wider mb-4">📈 RISK SCORE TREND</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="url(#riskGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Services scanned */}
          <motion.div variants={ITEM} className="glass rounded-2xl p-5">
            <div className="text-xs font-mono text-muted tracking-wider mb-4">🔍 SERVICES SCANNED</div>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map(({ name, icon, color }) => {
                const svcFindings = findings.filter(f => f.service === name).length
                return (
                  <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-pointer"
                    onClick={() => navigate('/scanner')}
                  >
                    <span className="text-base">{icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-bright">{name}</div>
                      <div className="text-[10px] font-mono" style={{ color }}>
                        {svcFindings} {svcFindings === 1 ? 'issue' : 'issues'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Row 3: Top finding + recent threats ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top finding */}
          <motion.div variants={ITEM} className="glass rounded-2xl p-5">
            <div className="text-xs font-mono text-muted tracking-wider mb-4">
              🚨 TOP PRIORITY FINDING
            </div>
            {topFinding ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={topFinding.severity} size="md" />
                  <span className="text-xs font-mono text-muted">{topFinding.service}</span>
                </div>
                <h3 className="text-sm font-semibold text-bright">{topFinding.title}</h3>
                <p className="text-xs text-muted leading-relaxed line-clamp-3">{topFinding.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate('/remediate')}
                    className="btn-danger text-xs flex items-center gap-1"
                  >
                    Fix Now
                  </button>
                  <button
                    onClick={() => navigate('/scanner')}
                    className="btn-ghost text-xs"
                  >
                    View All
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted">
                <ShieldCheck className="w-8 h-8 mb-2 text-success" />
                <span className="text-sm">Run a scan to see findings</span>
              </div>
            )}
          </motion.div>

          {/* Recent threat events */}
          <motion.div variants={ITEM} className="glass rounded-2xl p-5">
            <div className="text-xs font-mono text-muted tracking-wider mb-4">
              📡 LIVE THREAT EVENTS
            </div>
            <div className="space-y-2">
              {recentThreats.length > 0 ? recentThreats.map(evt => (
                <div key={evt.event_id} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-white/[0.02]">
                  <div className={`shrink-0 ${evt.severity === 'CRITICAL' || evt.severity === 'HIGH' ? 'dot-critical' : 'dot-warn'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-muted truncate">{evt.source_ip} → :{evt.target_port}</div>
                    <div className="text-[10px] text-muted/60">{evt.event_type} · {evt.geo.country}</div>
                  </div>
                  <SeverityBadge severity={evt.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'} />
                </div>
              )) : (
                <div className="text-xs text-muted text-center py-8">
                  Connecting to threat feed…
                </div>
              )}
            </div>
            {recentThreats.length > 0 && (
              <button onClick={() => navigate('/threats')} className="btn-ghost text-xs w-full mt-3">
                View Live Feed →
              </button>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
