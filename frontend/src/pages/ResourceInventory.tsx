import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, RefreshCw, Globe, MapPin } from 'lucide-react'
import { useVanguardStore } from '../store/useVanguardStore'
import { CleanInventory } from '../components/CleanModePages'

const API = 'http://localhost:8000/api/v1'

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const ITEM = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const TABS = ['EC2', 'S3', 'RDS', 'Lambda', 'VPC', 'Elastic IPs', 'Load Balancers']

function StateBadge({ state }: { state: string }) {
  const color =
    state === 'running' || state === 'available' || state === 'active' ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' :
    state === 'stopped' ? 'text-rose-300 bg-rose-500/15 border-rose-500/30' :
    'text-amber-300 bg-amber-500/15 border-amber-500/30'
  return <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${color}`}>{state}</span>
}

function UptimeBadge({ seconds }: { seconds: number }) {
  if (!seconds) return <span className="text-slate-400 text-xs">—</span>
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return <span className="font-mono text-xs text-white">{d}d {h}h {m}m</span>
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
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-400" />
            <span>AWS Multi-Service Resource Inventory</span>
          </h1>
          <p className="text-xs text-sky-200/70 mt-1">
            {inv ? `Cataloguing ${inv.total_resources} resources · ${inv.idle_resources} idle assets · Scanned ${inv.regions_scanned.join(', ')}` : 'Scanning infrastructure assets…'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setAllRegions(!allRegions); fetchInventory(!allRegions) }}
            className={`btn-pill-secondary text-xs py-2 px-3.5 ${allRegions ? 'border-sky-400 text-sky-300 bg-sky-500/20' : ''}`}
          >
            {allRegions ? <Globe className="w-3.5 h-3.5 text-sky-300" /> : <MapPin className="w-3.5 h-3.5 text-slate-400" />}
            <span>{allRegions ? 'All AWS Regions' : 'Primary Region (us-east-1)'}</span>
          </button>

          <button
            onClick={() => fetchInventory()}
            disabled={inventoryLoading}
            className="btn-pill-primary text-xs py-2 px-4 shadow-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${inventoryLoading ? 'animate-spin' : ''}`} />
            <span>{inventoryLoading ? 'Scanning…' : 'Refresh'}</span>
          </button>
        </div>
      </motion.div>

      {/* ── Summary Candy Cards ───────────────────────────────────────────── */}
      {inv && (
        <motion.div variants={STAGGER} initial="hidden" animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'EC2', value: inv.ec2_instances.length, icon: '🖥️' },
            { label: 'S3', value: inv.s3_buckets.length, icon: '🪣' },
            { label: 'RDS', value: inv.rds_instances.length, icon: '🗄️' },
            { label: 'Lambda', value: inv.lambda_functions.length, icon: '⚡' },
            { label: 'VPCs', value: inv.vpcs.length, icon: '🌐' },
            { label: 'Elastic IPs', value: inv.elastic_ips.length, icon: '📌' },
            { label: 'Load Balancers', value: inv.load_balancers.length, icon: '⚖️' },
          ].map(({ label, value, icon }) => (
            <motion.div
              key={label}
              variants={ITEM}
              className={`glass-cloud-card p-3.5 cursor-pointer transition-all rounded-2xl ${tab === label ? 'bg-sky-500/20 border-sky-400/40 shadow-md' : 'hover:bg-white/10'}`}
              onClick={() => setTab(label)}
            >
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-xl font-display font-bold text-white">{value}</div>
              <div className="text-[10px] font-mono text-slate-300 uppercase mt-0.5">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Tab Pills ────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 p-1 bg-white/5 border border-white/10 rounded-full w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Main Tab Content ──────────────────────────────────────────────── */}
      {inventoryLoading && !inv && (
        <div className="glass-cloud-card rounded-3xl p-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-sky-400" />
          <span>Cataloguing AWS cloud inventory…</span>
        </div>
      )}

      {inv && tab === 'EC2' && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-3">
          {inv.ec2_instances.map(i => (
            <motion.div
              key={i.instance_id}
              variants={ITEM}
              className="glass-cloud-card p-4.5 cursor-pointer hover:bg-white/10 transition-all rounded-2xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-lg">
                    🖥️
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{(i.tags as Record<string, string>)['Name'] || i.instance_id}</div>
                    <div className="text-xs text-slate-400 font-mono">{i.instance_id} · {i.region}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:block">
                    <div className="text-[10px] text-slate-400 font-mono">TYPE</div>
                    <div className="text-xs font-mono font-semibold text-white">{i.instance_type}</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-[10px] text-slate-400 font-mono">UPTIME</div>
                    <UptimeBadge seconds={i.uptime_seconds} />
                  </div>
                  <StateBadge state={i.state} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {inv && tab === 'S3' && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-3">
          {inv.s3_buckets.map(b => (
            <motion.div
              key={b.name}
              variants={ITEM}
              className="glass-cloud-card p-4.5 flex flex-wrap items-center justify-between gap-3 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-lg">
                  🪣
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{b.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{b.region} · {formatBytes(b.total_size_bytes)} · {b.object_count} objects</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  b.public_access_blocked ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/15' : 'text-rose-300 border-rose-500/30 bg-rose-500/15'
                }`}>
                  {b.public_access_blocked ? '🔒 PUBLIC BLOCKED' : '⚠️ PUBLIC READ'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {b.encryption}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {inv && tab === 'RDS' && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-3">
          {inv.rds_instances.map(r => (
            <motion.div
              key={r.instance_id}
              variants={ITEM}
              className="glass-cloud-card p-4.5 flex flex-wrap items-center justify-between gap-3 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-lg">
                  🗄️
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{r.instance_id}</div>
                  <div className="text-xs text-slate-400 font-mono">{r.engine} {r.engine_version} · {r.instance_class}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StateBadge state={r.status} />
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  r.publicly_accessible ? 'text-rose-300 border-rose-500/30 bg-rose-500/15' : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/15'
                }`}>
                  {r.publicly_accessible ? '⚠️ PUBLIC ACCESS' : '🔒 PRIVATE VPC'}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
