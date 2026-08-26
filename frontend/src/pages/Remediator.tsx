import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, CheckCircle, AlertTriangle, Zap, Eye } from 'lucide-react'
import axios from 'axios'
import { useVanguardStore } from '../store/useVanguardStore'
import type { Finding, RemediationResult } from '../store/useVanguardStore'
import SeverityBadge from '../components/SeverityBadge'
import DiffViewer from '../components/DiffViewer'

interface RemCard {
  finding: Finding
  result: RemediationResult | null
  loading: boolean
  expanded: boolean
}

export default function Remediator() {
  const { findings, markFindingRemediated, mockMode, dryRun } = useVanguardStore()
  const active = findings.filter(f => !f.is_remediated)
  const fixed  = findings.filter(f => f.is_remediated)

  const [cards, setCards] = useState<RemCard[]>(() =>
    active.map(f => ({ finding: f, result: null, loading: false, expanded: false }))
  )
  const [tab, setTab] = useState<'active' | 'fixed'>('active')
  const [confirmModal, setConfirmModal] = useState<{finding_id: string; finding_title: string} | null>(null)

  const displayCards = cards.length === 0 && active.length > 0
    ? active.map(f => ({ finding: f, result: null, loading: false, expanded: false }))
    : cards

  const updateCard = (id: string, update: Partial<RemCard>) =>
    setCards(prev => prev.map(c => c.finding.id === id ? { ...c, ...update } : c))

  const handleViewFix = async (finding: Finding) => {
    updateCard(finding.id, { loading: true, expanded: true })
    try {
      const { data } = await axios.post<RemediationResult>(
        `/api/v1/remediate/${finding.id}`,
        { dry_run: true }
      )
      updateCard(finding.id, { result: data, loading: false })
    } catch {
      updateCard(finding.id, { loading: false })
    }
  }

  const handleApplyFix = async (finding_id: string) => {
    setConfirmModal(null)
    updateCard(finding_id, { loading: true })
    try {
      const { data } = await axios.post<RemediationResult>(
        `/api/v1/remediate/${finding_id}`,
        { dry_run: false }
      )
      updateCard(finding_id, { result: data, loading: false })
      if (data.status === 'applied') {
        markFindingRemediated(finding_id)
      }
    } catch {
      updateCard(finding_id, { loading: false })
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-light-card p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-950 flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-slate-800" />
            <span>Automated Remediation & Patch Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Safely preview before/after infrastructure diffs before applying changes to AWS
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className={`text-xs font-mono font-semibold px-3.5 py-1.5 rounded-full border ${
            dryRun ? 'text-slate-700 border-slate-300 bg-white' : 'text-rose-700 border-rose-300 bg-rose-50'
          }`}>
            {dryRun ? '🛡️ Dry-Run Safe' : '⚡ Live Execution Active'}
          </span>

          <span className="text-xs font-mono font-semibold px-3.5 py-1.5 rounded-full border text-slate-700 border-slate-300 bg-white">
            {mockMode ? '🔵 Mock Sandbox' : '🔴 Real AWS'}
          </span>
        </div>
      </motion.div>

      {/* ── Filter Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 p-1 bg-white/70 border border-slate-200 rounded-full w-fit shadow-sm">
        {(['active', 'fixed'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              tab === t
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            {t === 'active' ? `Pending Fixes (${active.length})` : `Remediated (${fixed.length})`}
          </button>
        ))}
      </div>

      {/* ── Remediation Cards List ───────────────────────────────────────── */}
      <div className="space-y-3.5">
        <AnimatePresence mode="popLayout">
          {tab === 'active' ? (
            displayCards.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass-light-card p-14 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3 opacity-80" />
                <h3 className="text-lg font-bold text-slate-900">All Clear — Zero Unfixed Vulnerabilities</h3>
                <p className="text-xs text-slate-500 mt-1">Run an audit scan to evaluate newly provisioned resources</p>
              </motion.div>
            ) : displayCards.map(card => (
              <motion.div
                key={card.finding.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="glass-light-card overflow-hidden"
              >
                {/* Card Top */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <SeverityBadge severity={card.finding.severity} size="sm" />
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md font-semibold">
                        {card.finding.service}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">{card.finding.title}</h3>
                    <p className="text-xs font-mono text-slate-500 truncate mt-1">{card.finding.resource}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => card.result ? updateCard(card.finding.id, { expanded: !card.expanded }) : handleViewFix(card.finding)}
                      disabled={card.loading}
                      className="btn-pill-white text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>{card.loading ? 'Loading…' : card.result ? (card.expanded ? 'Hide Diff' : 'View Diff') : 'Preview Patch'}</span>
                    </button>

                    <button
                      onClick={() => mockMode
                        ? handleApplyFix(card.finding.id)
                        : setConfirmModal({ finding_id: card.finding.id, finding_title: card.finding.title })
                      }
                      disabled={card.loading}
                      className="btn-pill-dark text-xs py-2 px-4"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{card.loading ? 'Applying…' : 'Apply Remediation'}</span>
                    </button>
                  </div>
                </div>

                {/* Diff Viewer Accordion */}
                <AnimatePresence>
                  {card.expanded && card.result && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-slate-200/80 bg-slate-50/70 p-5"
                    >
                      <DiffViewer result={card.result} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            fixed.map(f => (
              <motion.div key={f.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-light-card p-5 flex items-center gap-3.5 opacity-80 border-emerald-500/20">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{f.title}</div>
                  <div className="text-xs font-mono text-slate-500">{f.resource}</div>
                </div>
                <SeverityBadge severity={f.severity} size="sm" />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Live Confirmation Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 max-w-md w-full border border-slate-200 rounded-3xl shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900">Apply Live AWS Remediation</h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will programmatically modify your real AWS cloud resource:
              </p>
              <p className="text-xs font-mono text-slate-900 p-3 bg-slate-100 rounded-2xl border border-slate-200">
                {confirmModal.finding_title}
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setConfirmModal(null)} className="btn-pill-white flex-1 justify-center">
                  Cancel
                </button>
                <button
                  onClick={() => handleApplyFix(confirmModal.finding_id)}
                  className="btn-pill-dark flex-1 justify-center"
                >
                  Confirm & Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
