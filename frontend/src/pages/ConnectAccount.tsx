import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, CheckCircle, XCircle, Loader, Eye, EyeOff, Globe, MapPin, Sparkles, Code2 } from 'lucide-react'
import { useVanguardStore } from '../store/useVanguardStore'

const API = 'http://localhost:8000/api/v1'

const REGIONS = [
  'us-east-1','us-east-2','us-west-1','us-west-2',
  'eu-west-1','eu-west-2','eu-central-1',
  'ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-south-1',
]

interface ConnectResult {
  success: boolean
  account_id: string
  account_alias?: string
  user_arn: string
  message: string
}

export default function ConnectAccount() {
  const { cleanMode, setCleanMode } = useVanguardStore()
  const [form, setForm] = useState({
    aws_access_key_id: '',
    aws_secret_access_key: '',
    aws_default_region: 'us-east-1',
    aws_session_token: '',
    gemini_api_key: '',
    mock_mode: false,
    dry_run: true,
    save_to_env: true,
    scan_all_regions: false,
  })
  const [showSecret, setShowSecret] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<ConnectResult | null>(null)
  const [error, setError]       = useState('')
  const [currentSettings, setCurrentSettings] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    fetch(`${API}/settings`).then(r => r.json()).then(setCurrentSettings).catch(() => {})
  }, [])

  const handleConnect = async () => {
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await fetch(`${API}/settings/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          aws_session_token: form.aws_session_token || undefined,
          gemini_api_key: form.gemini_api_key || undefined,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail || 'Connection failed')
      setResult(d)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally { setLoading(false) }
  }

  const setField = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-bright flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" /> Settings
        </h1>
        <p className="text-sm text-muted mt-1">Manage your AWS connection, display preferences, and scan configuration.</p>
      </motion.div>

      {/* ── DISPLAY MODE TOGGLE ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
        className="glass rounded-2xl p-5 mb-6">
        <div className="text-xs font-mono text-muted tracking-wider mb-4">DISPLAY MODE</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Developer Mode */}
          <div
            onClick={() => setCleanMode(false)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${!cleanMode
              ? 'border-blue-400/40 bg-blue-400/10'
              : 'border-border bg-white/[0.02] hover:bg-white/[0.04]'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Code2 className={`w-5 h-5 ${!cleanMode ? 'text-blue-400' : 'text-muted'}`} />
                <span className={`text-sm font-semibold ${!cleanMode ? 'text-bright' : 'text-muted'}`}>Developer Mode</span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!cleanMode ? 'border-blue-400 bg-blue-400' : 'border-muted'}`}>
                {!cleanMode && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-xs text-muted">Full technical detail — instance IDs, ARNs, CIDR blocks, raw metrics. Built for engineers.</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {['Instance IDs', 'CIDR blocks', 'ARNs', 'Raw metrics'].map(t => (
                <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-300">{t}</span>
              ))}
            </div>
          </div>

          {/* Clean Mode */}
          <div
            onClick={() => setCleanMode(true)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${cleanMode
              ? 'border-violet-400/40 bg-violet-400/10'
              : 'border-border bg-white/[0.02] hover:bg-white/[0.04]'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-5 h-5 ${cleanMode ? 'text-violet-400' : 'text-muted'}`} />
                <span className={`text-sm font-semibold ${cleanMode ? 'text-bright' : 'text-muted'}`}>Clean Mode</span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${cleanMode ? 'border-violet-400 bg-violet-400' : 'border-muted'}`}>
                {cleanMode && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
            <p className="text-xs text-muted">Simplified view in plain English. No jargon — built for non-technical users who just want to see the big picture.</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {['Plain English', 'Simple status', 'No IDs', 'Easy to read'].map(t => (
                <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-400/10 text-violet-300">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <motion.div
          key={String(cleanMode)}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${cleanMode ? 'bg-violet-400/10 text-violet-300' : 'bg-blue-400/10 text-blue-300'}`}
        >
          {cleanMode
            ? <><Sparkles className="w-3.5 h-3.5" /> Clean Mode is ON — the entire interface is now simplified</>
            : <><Code2 className="w-3.5 h-3.5" /> Developer Mode is ON — full technical detail shown (default)</>
          }
        </motion.div>
      </motion.div>

      {/* Current status */}
      {currentSettings && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass rounded-2xl p-5 mb-6">
          <div className="text-xs font-mono text-muted tracking-wider mb-3">CURRENT STATUS</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Mode', value: currentSettings.mock_mode ? '🔵 Mock' : '🔴 Live', color: currentSettings.mock_mode ? '#06b6d4' : '#ef4444' },
              { label: 'Dry Run', value: currentSettings.dry_run ? 'On' : 'Off', color: currentSettings.dry_run ? '#10b981' : '#f97316' },
              { label: 'AWS Connected', value: currentSettings.aws_connected ? 'Yes' : 'No', color: currentSettings.aws_connected ? '#10b981' : '#64748b' },
              { label: 'Region', value: String(currentSettings.aws_default_region), color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.03] rounded-xl p-3">
                <div className="text-[10px] text-muted font-mono mb-1">{s.label}</div>
                <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AWS Credentials form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="glass rounded-2xl p-6 space-y-5">

        <div className="text-xs font-mono text-muted tracking-wider">AWS CREDENTIALS</div>

        <div>
          <label className="text-xs font-mono text-muted block mb-1.5">AWS Access Key ID</label>
          <input
            type="text"
            value={form.aws_access_key_id}
            onChange={e => setField('aws_access_key_id', e.target.value)}
            placeholder="AKIAIOSFODNN7EXAMPLE"
            className="w-full bg-white/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-bright placeholder:text-muted/40 focus:border-emerald-400 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-muted block mb-1.5">AWS Secret Access Key</label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={form.aws_secret_access_key}
              onChange={e => setField('aws_secret_access_key', e.target.value)}
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              className="w-full bg-white/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-bright placeholder:text-muted/40 focus:border-emerald-400 focus:outline-none transition-colors pr-10"
            />
            <button onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-bright">
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-mono text-muted block mb-1.5">Default Region</label>
            <select
              value={form.aws_default_region}
              onChange={e => setField('aws_default_region', e.target.value)}
              className="w-full bg-white/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm text-bright focus:border-emerald-400 focus:outline-none transition-colors"
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-mono text-muted block mb-1.5">Session Token (optional)</label>
            <input
              type="text"
              value={form.aws_session_token}
              onChange={e => setField('aws_session_token', e.target.value)}
              placeholder="For temporary credentials"
              className="w-full bg-white/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-bright placeholder:text-muted/40 focus:border-emerald-400 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-muted block mb-1.5">Gemini API Key (optional — for AI Consultant)</label>
          <input
            type="password"
            value={form.gemini_api_key}
            onChange={e => setField('gemini_api_key', e.target.value)}
            placeholder="AIzaSy…"
            className="w-full bg-white/[0.04] border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-bright placeholder:text-muted/40 focus:border-emerald-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="border-t border-border pt-4">
          <div className="text-xs font-mono text-muted tracking-wider mb-3">SCAN SETTINGS</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'mock_mode',        label: '🔵 Mock Mode',    desc: 'Use simulated data (no real API calls)',         color: 'cyan' },
              { key: 'dry_run',          label: '🛡 Dry Run',      desc: 'Preview remediations before executing',          color: 'emerald' },
              { key: 'save_to_env',      label: '💾 Save to .env', desc: 'Persist credentials to backend config file',    color: 'purple' },
              { key: 'scan_all_regions', label: '🌐 All Regions',  desc: 'Scan all AWS regions (slower, more complete)',   color: 'blue' },
            ].map(({ key, label, desc, color }) => (
              <div key={key}
                onClick={() => setField(key, !form[key as keyof typeof form])}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${form[key as keyof typeof form]
                  ? `border-${color}-400/30 bg-${color}-400/10`
                  : 'border-border bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-bright">{label}</span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form[key as keyof typeof form] ? `border-${color}-400 bg-${color}-400` : 'border-muted'}`}>
                    {form[key as keyof typeof form] && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-[10px] text-muted mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-xl border ${form.scan_all_regions ? 'border-blue-400/20 bg-blue-400/5' : 'border-border bg-white/[0.02]'}`}>
          {form.scan_all_regions ? <Globe className="w-4 h-4 text-blue-400" /> : <MapPin className="w-4 h-4 text-muted" />}
          <span className="text-xs text-muted">
            {form.scan_all_regions
              ? 'All regions mode: inventory and scans will cover all AWS regions (may be slower)'
              : `Single region mode: only scanning ${form.aws_default_region}`}
          </span>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-emerald-400">Connected Successfully</div>
              <div className="text-xs text-muted mt-1 space-y-0.5">
                <div>Account ID: <span className="font-mono text-bright">{result.account_id}</span></div>
                {result.account_alias && <div>Alias: <span className="font-mono text-bright">{result.account_alias}</span></div>}
                <div>Identity: <span className="font-mono text-bright">{result.user_arn}</span></div>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-red-400">Connection Failed</div>
              <div className="text-xs text-muted mt-1 font-mono">{error}</div>
            </div>
          </motion.div>
        )}

        <button
          onClick={handleConnect}
          disabled={loading || !form.aws_access_key_id || !form.aws_secret_access_key}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {loading ? 'Validating credentials…' : 'Connect AWS Account'}
        </button>
      </motion.div>
    </div>
  )
}
