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
  S3: '🪣', IAM: '🔑', EC2: '🖥️', RDS: '🗄️', CloudTrail: '📋', GuardDuty: '👁️',
  Lambda: '⚡', VPC: '🌐', ECS: '📦', CloudFront: '🚀', ELB: '⚖️'
}

export default function FindingCard({ finding, showActions = true, onRemediate }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { setActiveFinding, dryRun } = useVanguardStore()
  const navigate = useNavigate()

  const handleExplainAI = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveFinding(finding)
    navigate('/ai')
  }

  const handleRemediateClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemediate) {
      onRemediate(finding)
    } else {
      navigate('/remediate')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-cloud-card overflow-hidden transition-all duration-300 ${
        finding.is_remediated ? 'opacity-65 border-emerald-500/30' : ''
      }`}
    >
      {/* ── Card Header ─────────────────────────────────────────────────── */}
      <div
        className="flex items-start sm:items-center justify-between gap-3 p-4.5 cursor-pointer hover:bg-white/[0.04] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          {/* Service Icon with soft pill backdrop */}
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl shrink-0 shadow-inner">
            {SERVICE_ICONS[finding.service] || '🔒'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <SeverityBadge severity={finding.severity} size="sm" />
              <span className="text-[11px] font-mono text-sky-300 bg-sky-500/15 border border-sky-400/25 px-2.5 py-0.5 rounded-full">
                {finding.service}
              </span>
              {finding.is_remediated ? (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border text-emerald-300 border-emerald-500/40 bg-emerald-500/20">
                  ✓ REMEDIATED
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400">
                  {finding.region || 'us-east-1'}
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-white group-hover:text-sky-200 transition-colors leading-snug">
              {finding.title}
            </h3>

            <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
              Resource: {finding.resource}
            </p>
          </div>
        </div>

        {/* Right: Risk score & expand indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div
              className="text-lg font-display font-extrabold tracking-tight"
              style={{
                color: finding.risk_score >= 85 ? '#ef4444'
                  : finding.risk_score >= 65 ? '#f97316'
                  : finding.risk_score >= 40 ? '#fbbf24'
                  : '#38bdf8'
              }}
            >
              {finding.risk_score}
            </div>
            <div className="text-[9px] font-mono text-slate-400 tracking-wider">RISK SCORE</div>
          </div>

          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            className="p-1.5 rounded-full bg-white/5 text-slate-400 shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </div>
      </div>

      {/* ── Expanded Details ────────────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/10 bg-black/20"
          >
            <div className="p-5 space-y-4 text-xs">
              {/* Description */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-semibold block mb-1">
                  Vulnerability Description
                </span>
                <p className="text-slate-300 leading-relaxed bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  {finding.description}
                </p>
              </div>

              {/* Resource ARN if available */}
              {finding.resource_arn && (
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-white/5 px-3 py-2 rounded-xl">
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{finding.resource_arn}</span>
                </div>
              )}

              {/* Step-by-step remediation plan */}
              {finding.remediation_steps && finding.remediation_steps.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold block mb-2">
                    🛠️ Recommended Remediation Steps
                  </span>
                  <ol className="space-y-2">
                    {finding.remediation_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-slate-300 leading-relaxed font-mono text-[11px]">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Action Buttons */}
              {showActions && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                    <span>Target: {dryRun ? '🔒 Safe Dry-Run' : '⚡ Live Execution'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExplainAI}
                      className="btn-pill-secondary text-xs py-2 px-3.5"
                    >
                      <Bot className="w-3.5 h-3.5 text-sky-300" />
                      <span>Ask AI Consultant</span>
                    </button>

                    {!finding.is_remediated && (
                      <button
                        onClick={handleRemediateClick}
                        className="btn-pill-accent text-xs py-2 px-4 shadow-md"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Preview & Remediate</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
