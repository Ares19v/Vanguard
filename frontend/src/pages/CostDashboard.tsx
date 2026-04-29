import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Cell
} from 'recharts'
import { useVanguardStore } from '../store/useVanguardStore'
import { CleanCosts } from '../components/CleanModePages'

const API = 'http://localhost:8000/api/v1'
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const ITEM = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const SERVICE_COLORS = [
  '#3b82f6','#8b5cf6','#f59e0b','#10b981','#06b6d4','#ec4899','#f97316','#84cc16','#a78bfa','#fb923c'
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
    <div className="p-6 flex items-center justify-center h-64">
      <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
    </div>
  )

  const c = costs

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bright flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" /> Cost & Billing
          </h1>
          <p className="text-sm text-muted mt-1">
            {c ? `${c.period_start} → ${c.period_end} · ${c.currency}` : ''}
          </p>
        </div>
        <button onClick={fetchCosts} disabled={costsLoading}
          className="btn-primary flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${costsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {c && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-6">

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Month-to-Date', value: `$${c.mtd_total.toFixed(2)}`,
                sub: `${c.mtd_change_pct > 0 ? '+' : ''}${c.mtd_change_pct.toFixed(1)}% vs last month`,
                icon: DollarSign, color: '#10b981',
                trend: c.mtd_change_pct > 0 ? 'up' : 'down'
              },
              {
                label: 'Forecasted Total', value: `$${c.forecasted_month_total.toFixed(2)}`,
                sub: `Last month: $${c.last_month_total.toFixed(2)}`,
                icon: TrendingUp, color: '#3b82f6', trend: null
              },
              {
                label: 'Estimated Waste', value: `$${c.total_estimated_waste.toFixed(2)}/mo`,
                sub: `${c.idle_resources.length} idle resources`,
                icon: AlertTriangle, color: '#f97316', trend: null
              },
              {
                label: 'Top Service', value: c.by_service[0]?.service.replace('Amazon ', '').replace('AWS ', '') ?? '—',
                sub: `$${c.by_service[0]?.amount.toFixed(2)} (${c.by_service[0]?.percentage}%)`,
                icon: DollarSign, color: '#8b5cf6', trend: null
              },
            ].map(({ label, value, sub, icon: Icon, color, trend }) => (
              <motion.div key={label} variants={ITEM} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted">{label}</span>
                  <div className="flex items-center gap-1">
                    {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-red-400" />}
                    {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />}
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                </div>
                <div className="text-2xl font-mono font-bold" style={{ color }}>{value}</div>
                <div className="text-xs text-muted mt-1">{sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Daily trend + by-service charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div variants={ITEM} className="glass rounded-2xl p-5">
              <div className="text-xs font-mono text-muted tracking-wider mb-4">📈 DAILY SPEND TREND (30 DAYS)</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={c.daily_trend}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }}
                    tickFormatter={d => d.slice(5)} interval={4} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, 'Spend']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#costGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div variants={ITEM} className="glass rounded-2xl p-5">
              <div className="text-xs font-mono text-muted tracking-wider mb-4">🏷️ COST BY SERVICE</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={c.by_service.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="service" width={130}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={s => s.replace('Amazon ', '').replace('AWS ', '')} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, 'MTD']}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {c.by_service.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Idle / waste resources */}
          <motion.div variants={ITEM} className="glass rounded-2xl p-5">
            <div className="text-xs font-mono text-muted tracking-wider mb-4">
              ⚠️ IDLE RESOURCES — ESTIMATED WASTE: <span className="text-orange-400">${c.total_estimated_waste.toFixed(2)}/mo</span>
            </div>
            <div className="space-y-3">
              {c.idle_resources.map(r => (
                <div key={r.resource_id} className="flex items-start gap-4 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                  <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-bright">{r.resource_id}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded border text-orange-400 border-orange-400/20 bg-orange-400/10">{r.resource_type}</span>
                      {r.estimated_monthly_waste > 0 && (
                        <span className="text-[10px] font-mono text-red-400 ml-auto">-${r.estimated_monthly_waste.toFixed(2)}/mo</span>
                      )}
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{r.reason}</p>
                    <p className="text-xs text-emerald-400 mt-1">💡 {r.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top resource costs */}
          <motion.div variants={ITEM} className="glass rounded-2xl p-5">
            <div className="text-xs font-mono text-muted tracking-wider mb-4">💰 TOP RESOURCES BY COST</div>
            <div className="space-y-2">
              {c.top_resource_costs.map((r, i) => (
                <div key={String(r.id)} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]">
                  <div className="text-xs font-mono text-muted w-5">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-bright">{String(r.name)}</div>
                    <div className="text-xs text-muted font-mono">{String(r.type)} · {String(r.id)}</div>
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-400">${Number(r.monthly).toFixed(2)}/mo</div>
                </div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      )}
    </div>
  )
}
