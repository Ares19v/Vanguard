import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, RefreshCw } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { useVanguardStore } from '../store/useVanguardStore'
import { CleanMetrics } from '../components/CleanModePages'

const API = 'http://localhost:8000/api/v1'
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }

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
    <div className="glass-cloud-card p-4.5 rounded-2xl">
      <div className="text-xs font-mono text-sky-300 font-semibold mb-3">{label}</div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="t" tick={{ fill: '#94a3b8', fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }}
            tickFormatter={v => `${v}${displayUnit}`} width={50} />
          <Tooltip
            contentStyle={{
              background: 'rgba(10, 25, 48, 0.95)',
              borderColor: 'rgba(147, 197, 253, 0.3)',
              borderRadius: '14px',
              fontSize: '11px',
            }}
            formatter={(v: any) => [`${v}${displayUnit}`, label]}
          />
          {refLine && <ReferenceLine y={refLine} stroke="#f97316" strokeDasharray="4 4" />}
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Metrics() {
  const { metricsMap, metricsLoading, setMetrics, setMetricsLoading, cleanMode } = useVanguardStore()
  const [selectedRes, setSelectedRes] = useState(RESOURCE_OPTIONS[0])
  const [period, setPeriod] = useState('24h')

  const fetchMetrics = async (res = selectedRes, p = period) => {
    setMetricsLoading(true)
    try {
      const r = await fetch(`${API}/metrics/${res.id}?resource_type=${res.type}&period=${p}`)
      setMetrics(res.id, await r.json())
    } finally { setMetricsLoading(false) }
  }

  useEffect(() => { fetchMetrics(selectedRes, period) }, [selectedRes, period])
  const m = metricsMap[selectedRes.id]

  if (cleanMode) return <CleanMetrics metricsMap={metricsMap} />

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-sky-400" />
            <span>AWS CloudWatch Real-Time Metrics</span>
          </h1>
          <p className="text-xs text-sky-200/70 mt-1">
            Live utilization, network throughput, error rates, and resource saturation telemetry
          </p>
        </div>

        <button
          onClick={() => fetchMetrics()}
          disabled={metricsLoading}
          className="btn-pill-primary text-xs py-2 px-4 shadow-lg"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${metricsLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </motion.div>

      {/* ── Filter Controls ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 p-1 bg-white/5 border border-white/10 rounded-full">
          {RESOURCE_OPTIONS.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRes(r)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedRes.id === r.id
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-full">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                period === p
                  ? 'bg-sky-500/30 text-sky-300 border border-sky-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Metric Visualizations ─────────────────────────────────────────── */}
      {m && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {m.cpu_utilization && (
              <MetricChart
                data={m.cpu_utilization}
                label="🖥️ CPU Utilization"
                color="#38bdf8"
                unit="Percent"
                refLine={80}
              />
            )}
            {m.network_in_bytes && (
              <MetricChart
                data={m.network_in_bytes}
                label="📥 Network Inbound Traffic"
                color="#10b981"
                unit="Bytes"
              />
            )}
            {m.network_out_bytes && (
              <MetricChart
                data={m.network_out_bytes}
                label="📤 Network Outbound Traffic"
                color="#818cf8"
                unit="Bytes"
              />
            )}
            {m.disk_read_bytes && (
              <MetricChart
                data={m.disk_read_bytes}
                label="💾 Disk Read IOPS"
                color="#f59e0b"
                unit="Bytes"
              />
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
