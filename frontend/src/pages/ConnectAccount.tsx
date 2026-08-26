import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, CheckCircle, XCircle, Loader, Eye, EyeOff, Sparkles, Code2, ShieldCheck, Key } from 'lucide-react'
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
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-sky-400" />
            <span>Platform Configuration & AWS Credentials</span>
          </h1>
          <p className="text-xs text-sky-200/70 mt-1">
            Manage your AWS authentication, Gemini AI keys, region scope, and display preferences
          </p>
        </div>
      </motion.div>

      {/* ── Display Mode & Safety Controls ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Developer Mode */}
        <div
          onClick={() => setCleanMode(false)}
          className={`p-5 rounded-3xl border cursor-pointer transition-all ${!cleanMode
            ? 'glass-cloud-card bg-sky-500/20 border-sky-400/50 shadow-lg shadow-sky-500/20'
            : 'glass-cloud-card opacity-60 hover:opacity-100'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <Code2 className={`w-5 h-5 ${!cleanMode ? 'text-sky-300' : 'text-slate-400'}`} />
              <span className="text-sm font-bold text-white">Engineering Mode</span>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!cleanMode ? 'border-sky-400 bg-sky-400' : 'border-slate-500'}`}>
              {!cleanMode && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Full telemetry — raw ARNs, port numbers, before/after diff code viewers, and WebSocket packets.
          </p>
        </div>

        {/* Clean Mode */}
        <div
          onClick={() => setCleanMode(true)}
          className={`p-5 rounded-3xl border cursor-pointer transition-all ${cleanMode
            ? 'glass-cloud-card bg-indigo-500/20 border-indigo-400/50 shadow-lg shadow-indigo-500/20'
            : 'glass-cloud-card opacity-60 hover:opacity-100'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className={`w-5 h-5 ${cleanMode ? 'text-indigo-300' : 'text-slate-400'}`} />
              <span className="text-sm font-bold text-white">Executive Clean Mode</span>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${cleanMode ? 'border-indigo-400 bg-indigo-400' : 'border-slate-500'}`}>
              {cleanMode && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Simplified plain-English summaries without technical jargon. Designed for security managers and reviewers.
          </p>
        </div>
      </div>

      {/* ── AWS Credentials & Authentication Form ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-cloud-card p-6 space-y-5 rounded-3xl"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider">AWS IAM Credentials</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Stored locally in backend .env</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">AWS Access Key ID</label>
            <input
              type="text"
              value={form.aws_access_key_id}
              onChange={e => setField('aws_access_key_id', e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:border-sky-400 focus:bg-white/15 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">AWS Secret Access Key</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={form.aws_secret_access_key}
                onChange={e => setField('aws_secret_access_key', e.target.value)}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:border-sky-400 focus:bg-white/15 focus:outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">Default Region</label>
              <select
                value={form.aws_default_region}
                onChange={e => setField('aws_default_region', e.target.value)}
                className="w-full bg-slate-900 border border-white/15 rounded-2xl px-4 py-2.5 text-xs font-mono text-white focus:border-sky-400 focus:outline-none transition-all"
              >
                {REGIONS.map(r => <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">Google Gemini API Key</label>
              <input
                type="password"
                value={form.gemini_api_key}
                onChange={e => setField('gemini_api_key', e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:border-sky-400 focus:bg-white/15 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Connected to AWS Account: <strong>{result.account_id}</strong> ({result.user_arn})</span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleConnect}
            disabled={loading}
            className="btn-pill-primary text-xs py-2.5 px-6 shadow-lg"
          >
            {loading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{loading ? 'Verifying AWS Credentials…' : 'Save & Connect AWS'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
