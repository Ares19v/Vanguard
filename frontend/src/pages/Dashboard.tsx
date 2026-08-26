import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, RefreshCw, Zap, Bot,
  CheckCircle2, Globe, Key, Database, ChevronDown, ChevronUp, Layers
} from 'lucide-react'
import axios from 'axios'
import { useVanguardStore } from '../store/useVanguardStore'
import type { Finding, RemediationResult } from '../store/useVanguardStore'
import { useScan } from '../hooks/useScan'
import SeverityBadge from '../components/SeverityBadge'
import DiffViewer from '../components/DiffViewer'
import { useNavigate } from 'react-router-dom'

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const ITEM = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }

const MONITORED_SERVICES = [
  { name: 'Amazon S3', icon: '🪣', desc: 'Storage & ACLs' },
  { name: 'AWS IAM', icon: '🔑', desc: 'Privilege & Keys' },
  { name: 'Amazon EC2', icon: '🖥️', desc: 'Security Groups' },
  { name: 'Amazon RDS', icon: '🗄️', desc: 'DB Encryption' },
  { name: 'AWS CloudTrail', icon: '📋', desc: 'Audit Logging' },
  { name: 'AWS GuardDuty', icon: '👁️', desc: 'Threat Detection' },
]

export default function Dashboard() {
  const {
    findings,
    scanStatus,
    dryRun,
    setActiveFinding,
    markFindingRemediated
  } = useVanguardStore()

  const { triggerScan } = useScan()
  const navigate = useNavigate()
  const detectionsRef = useRef<HTMLElement>(null)

  const [category, setCategory] = useState<'all' | 'exposure' | 'iam' | 'storage' | 'fixed'>('all')
  const [showAll, setShowAll] = useState(false)
  const [diffResults, setDiffResults] = useState<Record<string, RemediationResult>>({})
  const [expandedDiffId, setExpandedDiffId] = useState<string | null>(null)
  const [loadingDiffId, setLoadingDiffId] = useState<string | null>(null)
  const [remediatingId, setRemediatingId] = useState<string | null>(null)

  const activeFindings = findings.filter(f => !f.is_remediated)
  const fixedFindings  = findings.filter(f => f.is_remediated)

  const filteredFindings = findings.filter(f => {
    if (category === 'fixed') return f.is_remediated
    if (f.is_remediated) return false

    if (category === 'exposure') return f.service === 'S3' || f.service === 'EC2'
    if (category === 'iam') return f.service === 'IAM'
    if (category === 'storage') return f.service === 'RDS' || f.service === 'CloudTrail' || f.service === 'GuardDuty'
    return true
  })

  // Show top 3 by default unless expanded or filtered
  const displayedFindings = showAll ? filteredFindings : filteredFindings.slice(0, 3)
  const hasMore = filteredFindings.length > 3

  const isScanning = scanStatus === 'running'

  const handleStartDetection = async () => {
    await triggerScan()
    setShowAll(true)
    setTimeout(() => {
      detectionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  const handleToggleDiff = async (f: Finding) => {
    if (expandedDiffId === f.id) {
      setExpandedDiffId(null)
      return
    }

    if (diffResults[f.id]) {
      setExpandedDiffId(f.id)
      return
    }

    setLoadingDiffId(f.id)
    try {
      const { data } = await axios.post<RemediationResult>(
        `/api/v1/remediate/${f.id}`,
        { dry_run: true }
      )
      setDiffResults(prev => ({ ...prev, [f.id]: data }))
      setExpandedDiffId(f.id)
    } catch {
      // ignore
    } finally {
      setLoadingDiffId(null)
    }
  }

  const handleFix = async (f: Finding) => {
    setRemediatingId(f.id)
    try {
      const { data } = await axios.post<RemediationResult>(
        `/api/v1/remediate/${f.id}`,
        { dry_run: dryRun }
      )
      setDiffResults(prev => ({ ...prev, [f.id]: data }))
      if (data.status === 'applied') {
        markFindingRemediated(f.id)
      }
    } catch {
      // ignore
    } finally {
      setRemediatingId(null)
    }
  }

  const handleAskAI = (f: Finding) => {
    setActiveFinding(f)
    navigate('/ai')
  }

  return (
    <div className="space-y-16">
      {/* ── 1. Editorial Hero Section (Exact Reference Layout) ─────────────── */}
      <section className="pt-8 pb-4 text-center max-w-3xl mx-auto space-y-6">
        {/* Top Tagline Pill */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 border border-black/5 text-xs font-medium text-slate-600 shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
          <span>Autonomous Threat Detection & Cloud Remediation</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-slate-950 leading-[1.12]"
        >
          We detect and eliminate cloud vulnerabilities
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed text-balance"
        >
          Continuous infrastructure auditing, instant exploit diagnosis, and automated 1-click remediation before competitors or attackers even notice.
        </motion.p>

        {/* Center Primary CTA Pill (Matching Reference) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="pt-2 flex items-center justify-center gap-4"
        >
          <button
            onClick={handleStartDetection}
            disabled={isScanning}
            className="btn-pill-dark text-sm sm:text-base py-3 px-8 shadow-xl"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{isScanning ? 'Running Live Detection…' : 'Start Live Detection'}</span>
          </button>
        </motion.div>

        {/* Monitored AWS Services Bar (Matching "TRUSTED BY" in Reference) */}
        <div className="pt-10">
          <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase font-semibold mb-4">
            Monitoring Core Cloud Infrastructure
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-70 grayscale hover:grayscale-0 transition-all">
            {MONITORED_SERVICES.map(s => (
              <div key={s.name} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span>{s.icon}</span>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Live Detection Stream & Actionable Queue ────────────────────── */}
      <section ref={detectionsRef} id="active-detections" className="space-y-6 max-w-4xl mx-auto scroll-mt-8">
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-4">
          <div>
            <h2 className="text-xl font-display font-semibold text-slate-950 flex items-center gap-2.5">
              <span>Active Detections</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                {activeFindings.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {showAll ? `Displaying all ${filteredFindings.length} detected risks` : `Showing top ${displayedFindings.length} prioritized detections`}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 p-1 bg-white/60 border border-black/5 rounded-full text-xs shadow-sm">
            {[
              { id: 'all', label: 'All', count: activeFindings.length, icon: null },
              { id: 'exposure', label: 'Public Ingress', count: activeFindings.filter(f => f.service === 'S3' || f.service === 'EC2').length, icon: Globe },
              { id: 'iam', label: 'Identity', count: activeFindings.filter(f => f.service === 'IAM').length, icon: Key },
              { id: 'storage', label: 'Data', count: activeFindings.filter(f => f.service === 'RDS' || f.service === 'CloudTrail' || f.service === 'GuardDuty').length, icon: Database },
              { id: 'fixed', label: 'Resolved', count: fixedFindings.length, icon: CheckCircle2 },
            ].map(tab => {
              const Icon = tab.icon
              const isActive = category === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCategory(tab.id as any)
                    setShowAll(false)
                  }}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Finding Cards List */}
        {filteredFindings.length === 0 ? (
          <div className="glass-light-card p-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-semibold text-slate-900">No vulnerabilities detected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your monitored AWS infrastructure meets secure posture baselines.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Scrollable Viewport when expanded */}
            <motion.div
              variants={STAGGER}
              initial="hidden"
              animate="show"
              className={`space-y-3.5 ${
                showAll && filteredFindings.length > 4
                  ? 'max-h-[620px] overflow-y-auto pr-1.5 rounded-2xl scrollbar-thin'
                  : ''
              }`}
            >
              {displayedFindings.map(f => {
                const isRemediating = remediatingId === f.id
                const isDiffOpen = expandedDiffId === f.id
                const isDiffLoading = loadingDiffId === f.id
                const diffResult = diffResults[f.id]

                return (
                  <motion.div
                    key={f.id}
                    variants={ITEM}
                    className={`glass-light-card p-6 transition-all ${
                      f.is_remediated ? 'opacity-65' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Vulnerability Meta */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-[280px]">
                        <div className="mt-0.5">
                          <SeverityBadge severity={f.severity} />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900">{f.title}</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                              {f.service}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">{f.description}</p>
                          
                          {/* Target Resource */}
                          <div className="text-xs font-mono text-slate-500 pt-1 truncate">
                            Target: <span className="text-slate-800 font-medium">{f.resource}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Strip */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* AI Copilot Button */}
                        <button
                          onClick={() => handleAskAI(f)}
                          className="btn-pill-white text-xs"
                          title="Investigate exploit risk with AI Copilot"
                        >
                          <Bot className="w-3.5 h-3.5 text-indigo-600" />
                          <span>AI Diagnosis</span>
                        </button>

                        {/* Diff Toggle */}
                        <button
                          onClick={() => handleToggleDiff(f)}
                          disabled={isDiffLoading}
                          className={`btn-pill-white text-xs ${isDiffOpen ? 'bg-slate-100 border-slate-300' : ''}`}
                        >
                          {isDiffLoading ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : isDiffOpen ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                          <span>{isDiffOpen ? 'Close Patch' : 'Inspect Patch'}</span>
                        </button>

                        {/* Execute Fix */}
                        {!f.is_remediated ? (
                          <button
                            onClick={() => handleFix(f)}
                            disabled={isRemediating}
                            className="btn-pill-dark text-xs py-2 px-4"
                          >
                            {isRemediating ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                            )}
                            <span>{isRemediating ? 'Fixing…' : (dryRun ? 'Simulate Fix' : '1-Click Fix')}</span>
                          </button>
                        ) : (
                          <span className="badge-fixed px-3 py-1">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Remediated
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Diff Drawer */}
                    <AnimatePresence>
                      {isDiffOpen && diffResult && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-5 pt-4 border-t border-slate-200/80 overflow-hidden"
                        >
                          <DiffViewer result={diffResult} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* ── Dropdown / Expand Toggle Bar ──────────────────────────────── */}
            {hasMore && (
              <div className="pt-2 flex flex-col items-center justify-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="btn-pill-white text-xs sm:text-sm py-2.5 px-6 shadow-sm border border-slate-300/80 hover:bg-slate-50 flex items-center gap-2 group transition-all"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 transition-colors" />
                  <span className="font-semibold text-slate-800">
                    {showAll
                      ? 'Collapse to Top 3 Detections'
                      : `View All ${filteredFindings.length} Detections (Scrollable)`}
                  </span>
                  {showAll ? (
                    <ChevronUp className="w-4 h-4 text-slate-600 group-hover:-translate-y-0.5 transition-transform" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600 group-hover:translate-y-0.5 transition-transform" />
                  )}
                </button>
                <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                  {showAll ? 'Scroll through all active threats above' : `${filteredFindings.length - 3} additional vulnerabilities hidden`}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
