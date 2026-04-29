import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
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
  const { findings, markFindingRemediated, mockMode } = useVanguardStore()
  const active = findings.filter(f => !f.is_remediated)
  const fixed  = findings.filter(f => f.is_remediated)

  const [cards, setCards] = useState<RemCard[]>(() =>
    active.map(f => ({ finding: f, result: null, loading: false, expanded: false }))
  )
  const [tab, setTab] = useState<'active' | 'fixed'>('active')
  const [confirmModal, setConfirmModal] = useState<{finding_id: string; finding_title: string} | null>(null)

  // Sync cards when findings change
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
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="w-6 h-6 text-warn" /> Auto-Remediator
          </h1>
          <p className="text-sm text-muted mt-1">
            Dry-run mode is {' '}
            <span className="text-teal font-mono">ON</span>
            {' '}— changes preview without touching AWS
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`text-xs font-mono px-3 py-1.5 rounded border ${
            mockMode ? 'text-teal border-teal/30 bg-teal/10' : 'text-danger border-danger/30 bg-danger/10'
          }`}>
            {mockMode ? '🔵 MOCK — Safe to apply' : '🔴 LIVE — Real AWS changes'}
          </span>
        </div>
      </motion.div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-5 p-1 glass rounded-lg w-fit">
        {(['active', 'fixed'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === t ? 'bg-accent/20 text-accent' : 'text-muted hover:text-bright'
            }`}
          >
            {t === 'active' ? `⚠️ Active (${active.length})` : `✅ Fixed (${fixed.length})`}
          </button>
        ))}
      </div>

      {/* ── Finding cards ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {tab === 'active' ? (
            displayCards.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="glass rounded-xl p-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-bright">All clean!</h3>
                <p className="text-sm text-muted mt-1">Run a scan to see findings to remediate</p>
              </motion.div>
            ) : displayCards.map(card => (
              <motion.div
                key={card.finding.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="glass rounded-xl overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={card.finding.severity} />
                      <span className="text-[10px] font-mono text-muted bg-white/5 px-2 py-0.5 rounded">
                        {card.finding.service}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-bright">{card.finding.title}</h3>
                    <p className="text-xs font-mono text-muted mt-0.5 truncate">{card.finding.resource}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-mono font-bold number-glow"
                        style={{ color: card.finding.risk_score >= 85 ? '#ef4444' : card.finding.risk_score >= 65 ? '#f97316' : '#f59e0b' }}>
                        {card.finding.risk_score}
                      </div>
                      <div className="text-[9px] font-mono text-muted">RISK</div>
                    </div>

                    <button
                      onClick={() => card.result ? updateCard(card.finding.id, { expanded: !card.expanded }) : handleViewFix(card.finding)}
                      disabled={card.loading}
                      className="btn-ghost text-xs"
                    >
                      {card.loading ? '⏳' : card.result ? (card.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : 'View Fix'}
                    </button>

                    <button
                      onClick={() => mockMode
                        ? handleApplyFix(card.finding.id)
                        : setConfirmModal({ finding_id: card.finding.id, finding_title: card.finding.title })
                      }
                      disabled={card.loading}
                      className="btn-danger text-xs"
                    >
                      {card.loading ? '⏳' : 'Apply Fix'}
                    </button>
                  </div>
                </div>

                {/* Diff viewer */}
                <AnimatePresence>
                  {card.expanded && card.result && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-4">
                        <DiffViewer result={card.result} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            fixed.map(f => (
              <motion.div key={f.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass rounded-xl p-4 flex items-center gap-3 opacity-70">
                <CheckCircle className="w-5 h-5 text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-bright">{f.title}</div>
                  <div className="text-xs font-mono text-muted">{f.resource}</div>
                </div>
                <SeverityBadge severity={f.severity} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Confirm modal (live mode) ────────────────────────────────────── */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-md w-full border border-danger/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-danger" />
                <h2 className="text-lg font-bold text-danger">Live AWS Change</h2>
              </div>
              <p className="text-sm text-muted mb-2">This will apply the fix to your <strong className="text-bright">live AWS environment</strong>:</p>
              <p className="text-sm font-mono text-bright mb-6 p-3 bg-white/5 rounded-lg">{confirmModal.finding_title}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={() => handleApplyFix(confirmModal.finding_id)} className="btn-danger flex-1">
                  Confirm Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
