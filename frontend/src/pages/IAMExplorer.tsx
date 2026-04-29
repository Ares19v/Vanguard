import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, RefreshCw, ShieldAlert, ShieldCheck, Key, AlertTriangle } from 'lucide-react'
import { useVanguardStore } from '../store/useVanguardStore'
import type { IAMUser, IAMRole } from '../store/useVanguardStore'
import { CleanIAM } from '../components/CleanModePages'

const API = 'http://localhost:8000/api/v1'
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

function MfaBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${enabled ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' : 'text-red-400 border-red-400/20 bg-red-400/10'}`}>
      {enabled ? '🔒 MFA' : '⚠ NO MFA'}
    </span>
  )
}

export default function IAMExplorer() {
  const { iamData, iamLoading, setIAM, setIAMLoading, cleanMode } = useVanguardStore()
  const [tab, setTab] = useState<'users' | 'roles' | 'policy'>('users')
  const [drawer, setDrawer] = useState<IAMUser | IAMRole | null>(null)

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
    <div className="p-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-bright flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-400" /> IAM Explorer
          </h1>
          <p className="text-sm text-muted mt-1">
            {d ? `${d.total_users} users · ${d.roles.length} roles · ${d.users_without_mfa} without MFA` : 'Loading…'}
          </p>
        </div>
        <button onClick={fetchIAM} disabled={iamLoading}
          className="btn-primary flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${iamLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {d && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-6">

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: d.total_users, icon: Users, color: '#3b82f6' },
              { label: 'Admin Users', value: d.admin_users, icon: ShieldAlert, color: '#ef4444' },
              { label: 'No MFA', value: d.users_without_mfa, icon: Key, color: '#f97316' },
              { label: 'Console No MFA', value: d.users_with_console_no_mfa, icon: AlertTriangle, color: '#f59e0b' },
            ].map(({ label, value, icon: Icon, color }) => (
              <motion.div key={label} variants={ITEM} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted">{label}</span>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="text-3xl font-mono font-bold" style={{ color }}>{value}</div>
              </motion.div>
            ))}
          </div>

          {/* Password policy alert */}
          {d.password_policy && (
            <motion.div variants={ITEM} className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-semibold text-yellow-400">Weak Password Policy Detected</span>
                <div className="text-xs text-muted mt-1 flex flex-wrap gap-2">
                  {[
                    ['Min Length', String((d.password_policy as Record<string,unknown>).minimum_length)],
                    ['Uppercase', String((d.password_policy as Record<string,unknown>).require_uppercase)],
                    ['Symbols', String((d.password_policy as Record<string,unknown>).require_symbols)],
                    ['Max Age', String((d.password_policy as Record<string,unknown>).max_age_days ?? 'None')],
                    ['Reuse Prevention', String((d.password_policy as Record<string,unknown>).prevent_reuse ?? 'None')],
                  ].map(([k, v]) => (
                    <span key={k} className="font-mono bg-white/5 px-2 py-0.5 rounded">{k}: <span className={v === 'false' || v === 'None' ? 'text-red-400' : 'text-bright'}>{v}</span></span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-1">
            {(['users', 'roles', 'policy'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all ${tab === t ? 'bg-rose-500/20 text-rose-400 border border-rose-400/30' : 'text-muted hover:text-bright hover:bg-white/5'}`}>
                {t === 'policy' ? 'Password Policy' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Users */}
          {tab === 'users' && (
            <div className="space-y-2">
              {d.users.map(u => (
                <motion.div key={u.user_id} variants={ITEM}
                  className="glass rounded-xl p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
                  onClick={() => setDrawer(u)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${u.is_admin ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-muted'}`}>
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-bright flex items-center gap-2">
                          {u.username}
                          {u.is_admin && <span className="text-[10px] font-mono px-2 py-0.5 rounded border text-red-400 border-red-400/20 bg-red-400/10">ADMIN</span>}
                        </div>
                        <div className="text-xs text-muted">{u.arn}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden md:block text-right">
                        <div className="text-xs text-muted">Last Login</div>
                        <div className="text-xs font-mono text-bright">
                          {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      <div className="hidden md:block text-right">
                        <div className="text-xs text-muted">Keys</div>
                        <div className="text-xs font-mono text-bright">{u.access_keys.length}</div>
                      </div>
                      <MfaBadge enabled={u.mfa_enabled} />
                      {u.console_access
                        ? <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded border text-blue-400 border-blue-400/20 bg-blue-400/10">CONSOLE</span>
                        : <span className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded border text-muted border-border">API ONLY</span>
                      }
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Roles */}
          {tab === 'roles' && (
            <div className="space-y-2">
              {d.roles.map(r => (
                <motion.div key={r.role_id} variants={ITEM}
                  className="glass rounded-xl p-4 cursor-pointer hover:bg-white/[0.04] transition-colors"
                  onClick={() => setDrawer(r)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-bright">{r.role_name}</div>
                        <div className="text-xs text-muted line-clamp-1">{r.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:block text-right">
                        <div className="text-xs text-muted">Last Used</div>
                        <div className="text-xs font-mono text-bright">
                          {r.last_used ? new Date(r.last_used).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      <div className="hidden md:block text-right">
                        <div className="text-xs text-muted">Policies</div>
                        <div className="text-xs font-mono text-bright">{r.attached_policies.length}</div>
                      </div>
                      <div className="hidden sm:flex gap-1 flex-wrap max-w-48">
                        {r.trust_policy_principals.slice(0, 2).map(p => (
                          <span key={p} className="text-[10px] font-mono px-2 py-0.5 rounded border text-cyan-400 border-cyan-400/20 bg-cyan-400/10">
                            {p.split('.')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Password Policy */}
          {tab === 'policy' && d.password_policy && (
            <motion.div variants={ITEM} className="glass rounded-2xl p-6">
              <div className="text-xs font-mono text-muted tracking-wider mb-4">🔐 ACCOUNT PASSWORD POLICY</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(d.password_policy as Record<string, unknown>).map(([k, v]) => {
                  const isGood = v === true || (typeof v === 'number' && v > 0)
                  const isBad  = v === false || v === null
                  return (
                    <div key={k} className={`p-3 rounded-xl border ${isBad ? 'border-red-500/20 bg-red-500/5' : isGood ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border bg-white/[0.02]'}`}>
                      <div className="text-xs font-mono text-muted mb-1">{k.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className={`text-sm font-bold font-mono ${isBad ? 'text-red-400' : isGood ? 'text-emerald-400' : 'text-muted'}`}>
                        {v === null ? 'Not set' : String(v)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setDrawer(null)}>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-lg bg-panel border-l border-border overflow-y-auto h-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-bright">
                  {'username' in drawer ? drawer.username : drawer.role_name}
                </h2>
                <button onClick={() => setDrawer(null)} className="text-muted hover:text-bright text-xl">×</button>
              </div>
              <div className="space-y-3">
                {Object.entries(drawer).map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <div className="text-xs font-mono text-muted w-40 shrink-0 pt-0.5">{k}</div>
                    <div className="text-xs text-bright break-all font-mono">
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
