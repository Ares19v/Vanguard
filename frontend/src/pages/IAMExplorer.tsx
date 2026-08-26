import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, RefreshCw, Lock } from 'lucide-react'
import { useVanguardStore } from '../store/useVanguardStore'
import type { IAMUser, IAMRole } from '../store/useVanguardStore'
import { CleanIAM } from '../components/CleanModePages'

const API = 'http://localhost:8000/api/v1'
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

function MfaBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
      enabled
        ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/15'
        : 'text-rose-300 border-rose-500/30 bg-rose-500/15'
    }`}>
      {enabled ? '🔒 MFA ACTIVE' : '⚠ NO MFA'}
    </span>
  )
}

export default function IAMExplorer() {
  const { iamData, iamLoading, setIAM, setIAMLoading, cleanMode } = useVanguardStore()
  const [tab, setTab] = useState<'users' | 'roles' | 'policy'>('users')
  const [, setSelectedItem] = useState<IAMUser | IAMRole | null>(null)

  const fetchIAM = async () => {
    setIAMLoading(true)
    try {
      const r = await fetch(`${API}/iam`)
      setIAM(await r.json())
    } finally { setIAMLoading(false) }
  }

  useEffect(() => { fetchIAM() }, [])
  const d = iamData

  if (cleanMode && d) return <CleanIAM iamData={d} />

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-400" />
            <span>AWS IAM & Access Governance Explorer</span>
          </h1>
          <p className="text-xs text-sky-200/70 mt-1">
            {d ? `Auditing ${d.total_users} users · ${d.roles.length} roles · ${d.users_without_mfa} users without MFA` : 'Loading IAM credentials…'}
          </p>
        </div>

        <button
          onClick={fetchIAM}
          disabled={iamLoading}
          className="btn-pill-primary text-xs py-2 px-4 shadow-lg"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${iamLoading ? 'animate-spin' : ''}`} />
          <span>Refresh IAM</span>
        </button>
      </motion.div>

      {d && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-6">
          {/* ── Stat Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div variants={ITEM} className="glass-cloud-card p-4.5">
              <span className="text-xs font-mono text-slate-400 uppercase">IAM Users</span>
              <div className="text-3xl font-display font-extrabold text-white mt-1">{d.total_users}</div>
              <div className="text-xs text-slate-400 mt-1.5 font-mono">{d.users.length} active profiles</div>
            </motion.div>

            <motion.div variants={ITEM} className="glass-cloud-card p-4.5 border-rose-500/25">
              <span className="text-xs font-mono text-rose-300 uppercase">Users Without MFA</span>
              <div className="text-3xl font-display font-extrabold text-rose-400 mt-1">{d.users_without_mfa}</div>
              <div className="text-xs text-rose-300/80 mt-1.5 font-mono">High vulnerability risk</div>
            </motion.div>

            <motion.div variants={ITEM} className="glass-cloud-card p-4.5 border-amber-500/25">
              <span className="text-xs font-mono text-amber-300 uppercase">Admin Users</span>
              <div className="text-3xl font-display font-extrabold text-amber-400 mt-1">{d.admin_users}</div>
              <div className="text-xs text-amber-300/80 mt-1.5 font-mono">Elevated permissions</div>
            </motion.div>

            <motion.div variants={ITEM} className="glass-cloud-card p-4.5">
              <span className="text-xs font-mono text-slate-400 uppercase">IAM Roles</span>
              <div className="text-3xl font-display font-extrabold text-sky-300 mt-1">
                {d.roles.length}
              </div>
              <div className="text-xs text-slate-400 mt-1.5 font-mono">Role definitions active</div>
            </motion.div>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-full w-fit">
            {[
              { key: 'users', label: `Users (${d.users.length})` },
              { key: 'roles', label: `Roles (${d.roles.length})` },
              { key: 'policy', label: 'Password Policy' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  tab === t.key
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab Content ───────────────────────────────────────────────── */}
          {tab === 'users' && (
            <div className="space-y-3">
              {d.users.map(u => (
                <div
                  key={u.username}
                  onClick={() => setSelectedItem(u)}
                  className="glass-cloud-card p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-white/10 transition-all rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-lg">
                      👤
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{u.username}</h4>
                      <p className="text-xs font-mono text-slate-400">Created: {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MfaBadge enabled={u.mfa_enabled} />
                    {u.is_admin && (
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full text-rose-300 border border-rose-500/30 bg-rose-500/15">
                        ⚡ ADMIN
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border text-slate-300 border-white/10 bg-white/5">
                      {u.access_keys.length} Access Key(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'roles' && (
            <div className="space-y-3">
              {d.roles.map(r => (
                <div
                  key={r.role_name}
                  onClick={() => setSelectedItem(r)}
                  className="glass-cloud-card p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-white/10 transition-all rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-lg">
                      🔑
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{r.role_name}</h4>
                      <p className="text-xs font-mono text-slate-400 truncate max-w-sm">{r.arn}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {r.attached_policies.length} Policies
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'policy' && d.password_policy && (
            <div className="glass-cloud-card p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-400" />
                <span>Account Password Security Baseline</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(d.password_policy).map(([key, val]) => (
                  <div key={key} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
                    <div className="text-slate-400 font-mono text-[10px] uppercase">{key.replace(/_/g, ' ')}</div>
                    <div className="text-sm font-bold text-white mt-1">
                      {typeof val === 'boolean' ? (val ? '✅ Enabled' : '❌ Disabled') : String(val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
