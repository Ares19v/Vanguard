import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, RefreshCw, Globe, MapPin } from 'lucide-react'
import { useVanguardStore } from '../store/useVanguardStore'
import { CleanInventory } from '../components/CleanModePages'

const API = 'http://localhost:8000/api/v1'

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const TABS = ['EC2', 'S3', 'RDS', 'Lambda', 'VPC', 'Elastic IPs', 'Load Balancers']

function StateBadge({ state }: { state: string }) {
  const color =
    state === 'running' || state === 'available' || state === 'active' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
    state === 'stopped' || state === 'stopped' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
  return <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${color}`}>{state}</span>
}

function UptimeBadge({ seconds }: { seconds: number }) {
  if (!seconds) return <span className="text-muted text-xs">—</span>
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return <span className="font-mono text-xs text-bright">{d}d {h}h {m}m</span>
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function ResourceInventory() {
  const { inventory, inventoryLoading, setInventory, setInventoryLoading, cleanMode } = useVanguardStore()
  const [tab, setTab] = useState('EC2')
  const [allRegions, setAllRegions] = useState(false)
  const [drawer, setDrawer] = useState<Record<string, unknown> | null>(null)

  const fetchInventory = async (ar = allRegions) => {
    setInventoryLoading(true)
    try {
      const r = await fetch(`${API}/inventory?all_regions=${ar}`)
      const d = await r.json()
      setInventory(d)
    } finally {
      setInventoryLoading(false)
    }
  }

  useEffect(() => { fetchInventory() }, [])

  const inv = inventory

  if (cleanMode && inv) return <CleanInventory inventory={inv} />

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bright flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-400" /> Resource Inventory
          </h1>
          <p className="text-sm text-muted mt-1">
            {inv ? `${inv.total_resources} resources · ${inv.idle_resources} idle · scanned ${inv.regions_scanned.join(', ')}` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setAllRegions(!allRegions); fetchInventory(!allRegions) }}
            className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all ${allRegions ? 'border-purple-400/40 text-purple-400 bg-purple-400/10' : 'border-border text-muted hover:text-bright'}`}
          >
            {allRegions ? <Globe className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
            {allRegions ? 'All Regions' : 'Single Region'}
          </button>
          <button onClick={() => fetchInventory()} disabled={inventoryLoading}
            className="btn-primary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${inventoryLoading ? 'animate-spin' : ''}`} />
            {inventoryLoading ? 'Scanning…' : 'Refresh'}
          </button>
        </div>
      </motion.div>

      {/* Summary cards */}
      {inv && (
        <motion.div variants={STAGGER} initial="hidden" animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: 'EC2', value: inv.ec2_instances.length, icon: '🖥️', color: '#3b82f6' },
            { label: 'S3', value: inv.s3_buckets.length, icon: '🪣', color: '#f59e0b' },
            { label: 'RDS', value: inv.rds_instances.length, icon: '🗄️', color: '#8b5cf6' },
            { label: 'Lambda', value: inv.lambda_functions.length, icon: '⚡', color: '#10b981' },
            { label: 'VPCs', value: inv.vpcs.length, icon: '🌐', color: '#06b6d4' },
            { label: 'Elastic IPs', value: inv.elastic_ips.length, icon: '📌', color: '#f97316' },
            { label: 'Load Balancers', value: inv.load_balancers.length, icon: '⚖️', color: '#ec4899' },
          ].map(({ label, value, icon, color }) => (
            <motion.div key={label} variants={ITEM}
              className="glass rounded-xl p-3 cursor-pointer hover:bg-white/[0.04] transition-colors"
              onClick={() => setTab(label === 'Elastic IPs' ? 'Elastic IPs' : label === 'Load Balancers' ? 'Load Balancers' : label)}>
              <div className="text-lg mb-1">{icon}</div>
              <div className="text-xl font-mono font-bold" style={{ color }}>{value}</div>
              <div className="text-[10px] text-muted">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${tab === t ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' : 'text-muted hover:text-bright hover:bg-white/5'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {inventoryLoading && !inv && (
        <div className="glass rounded-2xl p-12 text-center text-muted">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
          Scanning resources…
        </div>
      )}

      {inv && tab === 'EC2' && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-2">
          {inv.ec2_instances.map(i => (
            <motion.div key={i.instance_id} variants={ITEM}
              className="glass rounded-xl p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
              onClick={() => setDrawer(i as unknown as Record<string, unknown>)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🖥️</span>
                  <div>
                    <div className="font-semibold text-bright text-sm">{(i.tags as Record<string, string>)['Name'] || i.instance_id}</div>
                    <div className="text-xs text-muted font-mono">{i.instance_id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xs text-muted">Type</div>
                    <div className="text-xs font-mono text-bright">{i.instance_type}</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs text-muted">Uptime</div>
                    <UptimeBadge seconds={i.uptime_seconds} />
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs text-muted">CPU (avg)</div>
                    <div className={`text-xs font-mono ${(i.cpu_utilization ?? 0) > 80 ? 'text-red-400' : (i.cpu_utilization ?? 0) < 5 ? 'text-yellow-400' : 'text-bright'}`}>
                      {i.cpu_utilization != null ? `${i.cpu_utilization}%` : '—'}
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs text-muted">Est. Cost</div>
                    <div className="text-xs font-mono text-emerald-400">
                      {i.monthly_cost_estimate != null ? `$${i.monthly_cost_estimate}/mo` : '—'}
                    </div>
                  </div>
                  <StateBadge state={i.state} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {inv && tab === 'S3' && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-2">
          {inv.s3_buckets.map(b => (
            <motion.div key={b.name} variants={ITEM}
              className="glass rounded-xl p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
              onClick={() => setDrawer(b as unknown as Record<string, unknown>)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🪣</span>
                  <div>
                    <div className="font-semibold text-bright text-sm">{b.name}</div>
                    <div className="text-xs text-muted">{b.region}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xs text-muted">Size</div>
                    <div className="text-xs font-mono text-bright">{b.total_size_gb >= 1000 ? `${(b.total_size_gb/1024).toFixed(1)} TB` : `${b.total_size_gb} GB`}</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs text-muted">Objects</div>
                    <div className="text-xs font-mono text-bright">{b.object_count.toLocaleString()}</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs text-muted">Encryption</div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${b.encryption !== 'None' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' : 'text-red-400 border-red-400/20 bg-red-400/10'}`}>{b.encryption}</span>
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs text-muted">Public Access</div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${b.public_access_blocked ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' : 'text-red-400 border-red-400/20 bg-red-400/10'}`}>
                      {b.public_access_blocked ? 'Blocked' : '⚠ OPEN'}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs text-muted">Est. Cost</div>
                    <div className="text-xs font-mono text-emerald-400">{b.estimated_monthly_cost != null ? `$${b.estimated_monthly_cost}/mo` : '—'}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {inv && tab === 'RDS' && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-2">
          {inv.rds_instances.map(r => (
            <motion.div key={r.instance_id} variants={ITEM}
              className="glass rounded-xl p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
              onClick={() => setDrawer(r as unknown as Record<string, unknown>)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🗄️</span>
                  <div>
                    <div className="font-semibold text-bright text-sm">{r.instance_id}</div>
                    <div className="text-xs text-muted">{r.engine} {r.engine_version} · {r.instance_class}</div>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xs text-muted">Storage</div>
                    <div className="text-xs font-mono text-bright">{r.allocated_storage_gb} GB</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs text-muted">Multi-AZ</div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${r.multi_az ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' : 'text-muted border-border'}`}>{r.multi_az ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs text-muted">Public</div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${r.publicly_accessible ? 'text-red-400 border-red-400/20 bg-red-400/10' : 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10'}`}>{r.publicly_accessible ? '⚠ YES' : 'No'}</span>
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs text-muted">Est. Cost</div>
                    <div className="text-xs font-mono text-emerald-400">{r.monthly_cost_estimate != null ? `$${r.monthly_cost_estimate}/mo` : '—'}</div>
                  </div>
                  <StateBadge state={r.status} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {inv && tab === 'Lambda' && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-2">
          {inv.lambda_functions.map(f => (
            <motion.div key={f.function_name} variants={ITEM}
              className="glass rounded-xl p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
              onClick={() => setDrawer(f as unknown as Record<string, unknown>)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">⚡</span>
                  <div>
                    <div className="font-semibold text-bright text-sm">{f.function_name}</div>
                    <div className="text-xs text-muted">{f.runtime} · {f.memory_mb}MB · {f.timeout_seconds}s timeout</div>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xs text-muted">Invocations (24h)</div>
                    <div className="text-xs font-mono text-bright">{f.invocations_24h?.toLocaleString() ?? '—'}</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs text-muted">Errors (24h)</div>
                    <div className={`text-xs font-mono ${(f.errors_24h ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{f.errors_24h ?? '—'}</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs text-muted">Avg Duration</div>
                    <div className="text-xs font-mono text-bright">{f.avg_duration_ms != null ? `${f.avg_duration_ms.toFixed(0)}ms` : '—'}</div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs text-muted">Code Size</div>
                    <div className="text-xs font-mono text-muted">{formatBytes(f.code_size_bytes)}</div>
                  </div>
                  {(f.invocations_24h ?? 0) === 0 && <span className="text-[10px] font-mono px-2 py-0.5 rounded border text-yellow-400 border-yellow-400/20 bg-yellow-400/10">IDLE</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {inv && tab === 'VPC' && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-2">
          {inv.vpcs.map(v => (
            <motion.div key={v.vpc_id} variants={ITEM}
              className="glass rounded-xl p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
              onClick={() => setDrawer(v as unknown as Record<string, unknown>)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌐</span>
                  <div>
                    <div className="font-semibold text-bright text-sm">{(v.tags as Record<string, string>)['Name'] || v.vpc_id}</div>
                    <div className="text-xs text-muted font-mono">{v.vpc_id} · {v.cidr_block}</div>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs text-muted">Subnets</div>
                    <div className="text-xs font-mono text-bright">{v.subnet_count}</div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-xs text-muted">NAT GWs</div>
                    <div className="text-xs font-mono text-bright">{v.nat_gateways}</div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-xs text-muted">Security Groups</div>
                    <div className="text-xs font-mono text-bright">{v.security_groups}</div>
                  </div>
                  {v.is_default && <span className="text-[10px] font-mono px-2 py-0.5 rounded border text-yellow-400 border-yellow-400/20 bg-yellow-400/10">DEFAULT</span>}
                  <StateBadge state={v.state} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {inv && tab === 'Elastic IPs' && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-2">
          {inv.elastic_ips.map(e => (
            <motion.div key={e.allocation_id} variants={ITEM} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📌</span>
                  <div>
                    <div className="font-semibold text-bright text-sm font-mono">{e.public_ip}</div>
                    <div className="text-xs text-muted">{e.allocation_id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs text-muted">Associated With</div>
                    <div className="text-xs font-mono text-bright">{e.associated_instance || '—'}</div>
                  </div>
                  {e.is_idle
                    ? <span className="text-[10px] font-mono px-2 py-0.5 rounded border text-red-400 border-red-400/20 bg-red-400/10">⚠ IDLE — $3.60/mo waste</span>
                    : <span className="text-[10px] font-mono px-2 py-0.5 rounded border text-emerald-400 border-emerald-400/20 bg-emerald-400/10">IN USE</span>
                  }
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {inv && tab === 'Load Balancers' && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-2">
          {inv.load_balancers.map(lb => (
            <motion.div key={lb.name} variants={ITEM} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">⚖️</span>
                  <div>
                    <div className="font-semibold text-bright text-sm">{lb.name}</div>
                    <div className="text-xs text-muted font-mono">{lb.dns_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs text-muted">Type</div>
                    <div className="text-xs font-mono text-bright">{lb.lb_type.toUpperCase()}</div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-xs text-muted">Scheme</div>
                    <div className="text-xs font-mono text-bright">{lb.scheme}</div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-xs text-muted">Target Groups</div>
                    <div className="text-xs font-mono text-bright">{lb.target_group_count}</div>
                  </div>
                  <StateBadge state={lb.state} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Detail Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setDrawer(null)}>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-lg bg-panel border-l border-border overflow-y-auto h-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-bright">Resource Details</h2>
                <button onClick={() => setDrawer(null)} className="text-muted hover:text-bright text-xl">×</button>
              </div>
              <div className="space-y-3">
                {Object.entries(drawer).map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <div className="text-xs font-mono text-muted w-40 shrink-0 pt-0.5">{k}</div>
                    <div className="text-xs text-bright break-all">
                      {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
