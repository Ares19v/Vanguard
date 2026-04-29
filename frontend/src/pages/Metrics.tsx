import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, RefreshCw, AlertTriangle } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { useVanguardStore } from '../store/useVanguardStore'
import type { ResourceMetrics } from '../store/useVanguardStore'
import { CleanMetrics } from '../components/CleanModePages'

const API = 'http://localhost:8000/api/v1'
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const PERIODS = ['1h', '6h', '24h', '7d']

const RESOURCE_OPTIONS = [
  { id: 'i-0a1b2c3d4e5f6a7b8', label: 'web-server-prod-01 (EC2)', type: 'ec2' },
  { id: 'i-1b2c3d4e5f6a7b8c9', label: 'api-server-prod-02 (EC2)', type: 'ec2' },
  { id: 'i-3d4e5f6a7b8c9d0e1', label: 'ml-worker-prod-01 (EC2)', type: 'ec2' },
  { id: 'prod-mysql-01',       label: 'prod-mysql-01 (RDS)',       type: 'rds' },
  { id: 'analytics-pg-02',     label: 'analytics-pg-02 (RDS)',     type: 'rds' },
  { id: 'process-user-uploads',label: 'process-user-uploads (Lambda)', type: 'lambda' },
  { id: 'old-migration-script',label: 'old-migration-script (Lambda)', type: 'lambda' },
]

function MetricChart({
  data, label, color, unit, refLine
}: {
  data: { timestamp: string; value: number }[]
  label: string
  color: string
  unit: string
  refLine?: number
}) {
  const formatted = data.map(d => ({
    t: d.timestamp.slice(11, 16),
    v: unit === 'Bytes' ? +(d.value / 1024 / 1024).toFixed(2) : +d.value.toFixed(2)
  }))
  const displayUnit = unit === 'Bytes' ? 'MB' : unit === 'Percent' ? '%' : unit
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-xs font-mono text-muted mb-3">{label}</div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }}
            tickFormatter={v => `${v}${displayUnit}`} width={50} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
            formatter={(v: any) => [`${v}${displayUnit}`, label]}
          />
          {refLine && <ReferenceLine y={refLine} stroke="#f97316" strokeDasharray="4 4" />}
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Metrics() {
  const { metricsMap, metricsLoading, setMetrics, setMetricsLoading, cleanMode } = useVanguardStore()
  const [resourceId, setResourceId] = useState(RESOURCE_OPTIONS[0].id)
  const [period, setPeriod] = useState('24h')

  const fetchMetrics = async (id = resourceId, p = period) => {
    setMetricsLoading(true)
    try {
      const r = await fetch(`${API}/metrics/${id}?period=${p}`)
      const d: ResourceMetrics = await r.json()
      setMetrics(id, d)
    } finally { setMetricsLoading(false) }
  }

  useEffect(() => { fetchMetrics() }, [])

  const current = metricsMap[resourceId]
  const selectedOption = RESOURCE_OPTIONS.find(r => r.id === resourceId)!

  if (cleanMode) return <CleanMetrics metricsMap={metricsMap as Record<string, { avg_cpu?: number; max_cpu?: number; is_idle: boolean; resource_type: string }>} />

  const handleChange = (id: string) => {
    setResourceId(id)
    fetchMetrics(id, period)
  }
  const handlePeriod = (p: string) => {
    setPeriod(p)
    fetchMetrics(resourceId, p)
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bright flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" /> Resource Metrics
          </h1>
          <p className="text-sm text-muted mt-1">CloudWatch performance data</p>
        </div>
        <button onClick={() => fetchMetrics()} disabled={metricsLoading}
          className="btn-primary flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${metricsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={resourceId}
          onChange={e => handleChange(e.target.value)}
          className="bg-panel border border-border text-bright text-sm rounded-lg px-3 py-2 focus:border-cyan-400 focus:outline-none"
        >
          {RESOURCE_OPTIONS.map(o => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => handlePeriod(p)}
              className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${period === p ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30' : 'text-muted hover:text-bright hover:bg-white/5 border border-border'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Idle warning */}
      {current?.is_idle && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-6">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
          <div>
            <span className="text-sm font-semibold text-yellow-400">Resource appears idle</span>
            <p className="text-xs text-muted mt-0.5">
              Avg CPU: {current.avg_cpu?.toFixed(1)}% over {period}. Consider downsizing or terminating.
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary stats */}
      {current && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
            {selectedOption.type === 'ec2' && [
              { label: 'Avg CPU', value: current.avg_cpu != null ? `${current.avg_cpu.toFixed(1)}%` : '—', color: (current.avg_cpu ?? 0) > 80 ? '#ef4444' : (current.avg_cpu ?? 0) < 5 ? '#f59e0b' : '#10b981' },
              { label: 'Max CPU', value: current.max_cpu != null ? `${current.max_cpu.toFixed(1)}%` : '—', color: '#3b82f6' },
              { label: 'Status', value: current.is_idle ? 'IDLE' : 'ACTIVE', color: current.is_idle ? '#f59e0b' : '#10b981' },
              { label: 'Period', value: period, color: '#8b5cf6' },
            ].map(s => (
              <motion.div key={s.label} variants={ITEM} className="glass rounded-xl p-4">
                <div className="text-xs font-mono text-muted mb-1">{s.label}</div>
                <div className="text-xl font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
              </motion.div>
            ))}
            {selectedOption.type === 'lambda' && [
              { label: 'Invocations (24h)', value: current.invocations.reduce((a, b) => a + b.value, 0).toFixed(0), color: '#10b981' },
              { label: 'Errors (24h)', value: current.errors.reduce((a, b) => a + b.value, 0).toFixed(0), color: '#ef4444' },
              { label: 'Status', value: current.is_idle ? 'IDLE' : 'ACTIVE', color: current.is_idle ? '#f59e0b' : '#10b981' },
              { label: 'Period', value: period, color: '#8b5cf6' },
            ].map(s => (
              <motion.div key={s.label} variants={ITEM} className="glass rounded-xl p-4">
                <div className="text-xs font-mono text-muted mb-1">{s.label}</div>
                <div className="text-xl font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* EC2 charts */}
          {selectedOption.type === 'ec2' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <motion.div variants={ITEM}><MetricChart data={current.cpu_utilization} label="CPU Utilization" color="#3b82f6" unit="Percent" refLine={80} /></motion.div>
              <motion.div variants={ITEM}><MetricChart data={current.network_in_bytes} label="Network In" color="#10b981" unit="Bytes" /></motion.div>
              <motion.div variants={ITEM}><MetricChart data={current.network_out_bytes} label="Network Out" color="#8b5cf6" unit="Bytes" /></motion.div>
              <motion.div variants={ITEM}><MetricChart data={current.disk_write_bytes} label="Disk Write" color="#f59e0b" unit="Bytes" /></motion.div>
            </div>
          )}

          {/* RDS charts */}
          {selectedOption.type === 'rds' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <motion.div variants={ITEM}><MetricChart data={current.cpu_utilization} label="CPU Utilization" color="#8b5cf6" unit="Percent" refLine={80} /></motion.div>
              <motion.div variants={ITEM}><MetricChart data={current.db_connections} label="DB Connections" color="#06b6d4" unit="Count" /></motion.div>
            </div>
          )}

          {/* Lambda charts */}
          {selectedOption.type === 'lambda' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <motion.div variants={ITEM}><MetricChart data={current.invocations} label="Invocations" color="#10b981" unit="Count" /></motion.div>
              <motion.div variants={ITEM}><MetricChart data={current.errors} label="Errors" color="#ef4444" unit="Count" /></motion.div>
              <motion.div variants={ITEM}><MetricChart data={current.duration_ms} label="Duration (ms)" color="#3b82f6" unit="ms" /></motion.div>
              <motion.div variants={ITEM}><MetricChart data={current.throttles} label="Throttles" color="#f97316" unit="Count" /></motion.div>
            </div>
          )}
        </motion.div>
      )}

      {metricsLoading && !current && (
        <div className="glass rounded-2xl p-12 text-center text-muted">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
          Loading metrics…
        </div>
      )}
    </div>
  )
}
