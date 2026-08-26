import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Cell
} from 'recharts'
import { useVanguardStore } from '../store/useVanguardStore'
import { CleanCosts } from '../components/CleanModePages'

const API = 'http://localhost:8000/api/v1'
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const SERVICE_COLORS = [
  '#38bdf8', '#818cf8', '#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#f97316', '#a78bfa'
]

export default function CostDashboard() {
  const { costs, costsLoading, setCosts, setCostsLoading, cleanMode } = useVanguardStore()

  const fetchCosts = async () => {
    setCostsLoading(true)
    try {
      const r = await fetch(`${API}/costs`)
      setCosts(await r.json())
    } finally { setCostsLoading(false) }
  }

  useEffect(() => { fetchCosts() }, [])

  if (cleanMode && costs) return <CleanCosts costs={costs} />

  if (costsLoading && !costs) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mb-2" />
      <span className="text-xs">Analyzing AWS Cost Explorer billing metrics…</span>
    </div>
  )

  const c = costs

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span>AWS Cloud Cost & Waste Intelligence</span>
          </h1>
          <p className="text-xs text-sky-200/70 mt-1">
            {c ? `Billing Cycle: ${c.period_start} → ${c.period_end} · Currency: ${c.currency}` : 'Real-time Cost Explorer Telemetry'}
          </p>
        </div>

        <button
          onClick={fetchCosts}
          disabled={costsLoading}
          className="btn-pill-primary text-xs py-2 px-4 shadow-lg"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${costsLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Billing</span>
        </button>
      </motion.div>

      {c && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-6">
          {/* ── Metric Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={ITEM} className="glass-cloud-card p-5">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">MTD Total Spend</span>
              <div className="text-3xl font-display font-extrabold text-white mt-1">
                ${c.mtd_total.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-400 mt-2 font-mono">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+${c.forecasted_month_total.toFixed(2)} projected EOM</span>
              </div>
            </motion.div>

            <motion.div variants={ITEM} className="glass-cloud-card p-5 border-amber-500/25">
              <span className="text-xs font-mono text-amber-300 uppercase tracking-wider">Identified Waste</span>
              <div className="text-3xl font-display font-extrabold text-amber-400 mt-1">
                ${c.total_estimated_waste.toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-2 font-mono">
                {c.idle_resources.length} unattached / idle assets
              </div>
            </motion.div>

            <motion.div variants={ITEM} className="glass-cloud-card p-5">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Daily Avg Burn</span>
              <div className="text-3xl font-display font-extrabold text-white mt-1">
                ${(c.mtd_total / 30).toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-2 font-mono">
                Per 24-hour cycle
              </div>
            </motion.div>

            <motion.div variants={ITEM} className="glass-cloud-card p-5 border-emerald-500/25">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Potential Savings</span>
              <div className="text-3xl font-display font-extrabold text-emerald-400 mt-1">
                ${c.total_estimated_waste.toFixed(2)}/mo
              </div>
              <div className="text-xs text-emerald-300/80 mt-2 font-mono">
                By cleaning idle resources
              </div>
            </motion.div>
          </div>

          {/* ── Charts Grid ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Daily Trend */}
            <motion.div variants={ITEM} className="glass-cloud-card p-5 rounded-3xl">
              <h3 className="text-xs font-mono font-semibold uppercase text-sky-300 tracking-wider mb-4">
                📈 30-Day Daily Spend Trend
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={c.daily_trend}>
                    <defs>
                      <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(10, 25, 48, 0.95)',
                        borderColor: 'rgba(147, 197, 253, 0.3)',
                        borderRadius: '14px',
                        fontSize: '11px',
                      }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#costGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Service Breakdown */}
            <motion.div variants={ITEM} className="glass-cloud-card p-5 rounded-3xl">
              <h3 className="text-xs font-mono font-semibold uppercase text-sky-300 tracking-wider mb-4">
                📊 Spend By AWS Service
              </h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={c.by_service} layout="vertical" margin={{ left: 15, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <YAxis dataKey="service" type="category" tick={{ fill: '#bae6fd', fontSize: 9 }} width={85} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(10, 25, 48, 0.95)',
                        borderColor: 'rgba(147, 197, 253, 0.3)',
                        borderRadius: '14px',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                      {c.by_service.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={SERVICE_COLORS[index % SERVICE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* ── Idle Waste Table ──────────────────────────────────────────── */}
          <motion.div variants={ITEM} className="glass-cloud-card p-5 rounded-3xl">
            <h3 className="text-xs font-mono font-semibold uppercase text-amber-300 tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Idle Resources Identified for Cost Optimization</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-3">Resource ID</th>
                    <th className="pb-3">Service</th>
                    <th className="pb-3">Reason</th>
                    <th className="pb-3 text-right">Est. Monthly Waste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {c.idle_resources.map((res, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-semibold text-white">{res.resource_id}</td>
                      <td className="py-3 text-sky-300">{res.resource_type}</td>
                      <td className="py-3 text-slate-400">{res.reason || 'Unattached / Idle'}</td>
                      <td className="py-3 text-right font-bold text-amber-400">${res.estimated_monthly_waste.toFixed(2)}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
