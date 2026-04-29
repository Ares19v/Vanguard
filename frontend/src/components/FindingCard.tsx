import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ExternalLink, Bot, Wrench } from 'lucide-react'
import type { Finding } from '../store/useVanguardStore'
import SeverityBadge from './SeverityBadge'
import { useVanguardStore } from '../store/useVanguardStore'
import { useNavigate } from 'react-router-dom'

interface Props {
  finding: Finding
  showActions?: boolean
  onRemediate?: (f: Finding) => void
}

const SERVICE_ICONS: Record<string, string> = {
  S3: '🪣', IAM: '🔑', EC2: '🖥️', RDS: '🗄️', CloudTrail: '📋', GuardDuty: '👁️'
}

export default function FindingCard({ finding, showActions = true, onRemediate }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { setActiveFinding } = useVanguardStore()
  const navigate = useNavigate()

  const handleExplainAI = () => {
    setActiveFinding(finding)
    navigate('/ai')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl overflow-hidden transition-all duration-300 ${
        finding.is_remediated ? 'opacity-60' : ''
      }`}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Service icon */}
        <span className="text-xl shrink-0 mt-0.5">
          {SERVICE_ICONS[finding.service] || '🔒'}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={finding.severity} />
            <span className="text-[10px] font-mono text-muted bg-white/5 px-2 py-0.5 rounded">
              {finding.service}
            </span>
            {finding.is_remediated && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border text-success border-success/30 bg-success/10">
                ✓ FIXED
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-bright mt-1 leading-snug pr-4">
            {finding.title}
          </h3>
          <p className="text-xs text-muted font-mono truncate mt-0.5">
            {finding.resource}
          </p>
        </div>

        {/* Risk score */}
        <div className="text-right shrink-0">
          <div
            className="text-xl font-mono font-bold number-glow"
            style={{
              color: finding.risk_score >= 85 ? '#ef4444'
                : finding.risk_score >= 65 ? '#f97316'
                : finding.risk_score >= 40 ? '#f59e0b'
                : '#3b82f6'
            }}
          >
            {finding.risk_score}
          </div>
          <div className="text-[9px] font-mono text-muted">RISK</div>
        </div>

        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          className="text-muted shrink-0 mt-1"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </div>

      {/* ── Expanded details ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">

              {/* Description */}
              <p className="text-sm text-muted leading-relaxed">{finding.description}</p>

              {/* Resource ARN */}
              {finding.resource_arn && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3 h-3 text-muted shrink-0" />
                  <span className="text-xs font-mono text-muted break-all">
                    {finding.resource_arn}
                  </span>
                </div>
              )}

              {/* Remediation steps */}
              <div>
                <div className="text-xs font-mono text-accent mb-2 tracking-wider">
                  ▸ REMEDIATION STEPS
                </div>
                <ol className="space-y-1.5">
                  {finding.remediation_steps.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-xs font-mono text-muted shrink-0">{i + 1}.</span>
                      <span className="text-xs text-muted font-mono leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Actions */}
              {showActions && !finding.is_remediated && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleExplainAI}
                    className="flex items-center gap-1.5 btn-ghost text-xs"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Ask AI
                  </button>
                  {onRemediate && (
                    <button
                      onClick={() => onRemediate(finding)}
                      className="flex items-center gap-1.5 btn-primary text-xs"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      View Fix
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
