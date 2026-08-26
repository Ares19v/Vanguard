import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Play, Download, Sparkles, Eye, RefreshCw } from 'lucide-react'
import { useVanguardStore } from '../store/useVanguardStore'
import { useScan } from '../hooks/useScan'
import SeverityBadge from '../components/SeverityBadge'
import { useNavigate } from 'react-router-dom'

const SERVICES = ['S3', 'IAM', 'EC2', 'RDS', 'CloudTrail', 'GuardDuty']

const LOG_COLORS: Record<string, string> = {
  CRITICAL: '#f87171',
  HIGH:     '#fb923c',
  MEDIUM:   '#facc15',
  LOW:      '#93c5fd',
  INFO:     '#94a3b8',
  OK:       '#34d399',
}

interface LogLine {
  id: string
  type: 'service' | 'finding' | 'ok' | 'error' | 'info'
  text: string
  severity?: string
}

export default function Scanner() {
  const { findings, scanStatus, overallScore, mockMode } = useVanguardStore()
  const { triggerScan } = useScan()
  const [logs, setLogs] = useState<LogLine[]>([])
  const [streaming, setStreaming] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  const addLog = (line: Omit<LogLine, 'id'>) => {
    setLogs(prev => [...prev, { ...line, id: Math.random().toString(36).slice(2) }])
  }

  const handleScan = async () => {
    setLogs([])
    setStreaming(true)

    addLog({ type: 'info', text: '▶ Initialising Vanguard ASOC scanner core…', severity: 'INFO' })
    addLog({ type: 'info', text: `  Target: ${mockMode ? 'Mock AWS Environment (Simulated 123456789012)' : 'Live AWS Account (Boto3 API)'}`, severity: 'INFO' })
    await delay(300)

    try {
      const res = await fetch('/api/v1/scan/stream')
      if (!res.body) { setStreaming(false); return }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let lastService = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const raw = decoder.decode(value, { stream: true })
        for (const line of raw.split('\n')) {
          const trimmed = line.replace(/^data:\s*/, '').trim()
          if (!trimmed) continue
          try {
            const payload = JSON.parse(trimmed)
            if (payload.done) {
              addLog({ type: 'ok', text: `\n✔ Scan completed successfully. ${findings.length} findings catalogued. Overall Risk: ${overallScore.toFixed(0)}/100`, severity: 'OK' })
              break
            }
            if (payload.service !== lastService) {
              lastService = payload.service
              addLog({ type: 'service', text: `\n[*] Auditing AWS ${payload.service} configuration…`, severity: 'INFO' })
            }
            const f = payload.finding
            addLog({
              type: 'finding',
              text: `    ├── [${f.severity}] ${f.title}`,
              severity: f.severity,
            })
          } catch { }
        }
      }
    } catch (err) {
      addLog({ type: 'error', text: `[!] Scan stream error: ${err}`, severity: 'CRITICAL' })
    }

    await triggerScan()
    setStreaming(false)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(findings, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `vanguard-audit-${Date.now()}.json`
    a.click()
  }

  const byService = SERVICES.map(s => ({
    service: s,
    findings: findings.filter(f => f.service === s),
  }))

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
            <Terminal className="w-6 h-6 text-slate-800" />
            <span>AWS Security Vulnerability Scanner</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {scanStatus === 'running' || streaming ? '⚡ Real-time telemetry streaming from cloud services…'
              : scanStatus === 'done' ? `✓ Scan complete — ${findings.length} findings identified`
              : 'Enumerate your AWS attack surface across IAM, S3, EC2, RDS, and CloudTrail'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {findings.length > 0 && (
            <button onClick={exportJSON} className="btn-pill-white text-xs py-2 px-3.5">
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          )}

          <button
            onClick={handleScan}
            disabled={scanStatus === 'running' || streaming}
            className="btn-pill-dark text-xs py-2.5 px-5 shadow-lg"
          >
            {streaming ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white" />
            )}
            <span>{streaming ? 'Scanning Cloud…' : 'Start Audit Scan'}</span>
          </button>
        </div>
      </motion.div>

      {/* ── Main Scan Workspace ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Terminal Output */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-7 flex flex-col space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase">
              Live Scanner Telemetry Stream
            </span>
            <span className="text-[11px] font-mono text-slate-500">SSE / Streaming API</span>
          </div>

          <div
            ref={terminalRef}
            className="p-5 h-[500px] overflow-y-auto font-mono text-xs text-emerald-400 bg-slate-950 border border-slate-800 relative rounded-3xl shadow-2xl"
          >
            {streaming && <div className="scan-line" />}
            {logs.length === 0 ? (
              <div className="text-slate-400 flex flex-col justify-center h-full items-center text-center">
                <Terminal className="w-12 h-12 text-slate-600 mb-3" />
                <p className="font-semibold text-white">Vanguard ASOC Audit Engine Ready</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Click <strong className="text-white">Start Audit Scan</strong> to stream live vulnerability detection.
                </p>
              </div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className="whitespace-pre-wrap leading-relaxed py-0.5"
                  style={{ color: log.severity ? LOG_COLORS[log.severity] || '#34d399' : '#34d399' }}
                >
                  {log.text}
                </div>
              ))
            )}
            {streaming && <span className="text-emerald-400 animate-pulse inline-block ml-1">▋</span>}
          </div>
        </motion.div>

        {/* Findings Tree */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-5 flex flex-col space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase">
              Catalogued Attack Surface
            </span>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">{findings.length} findings</span>
          </div>

          <div className="glass-light-card p-4 h-[500px] overflow-y-auto space-y-3">
            {findings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
                <Sparkles className="w-10 h-10 text-slate-400 mb-2 opacity-60" />
                <p className="text-sm font-semibold text-slate-900">No active scan findings</p>
                <p className="text-xs text-slate-500 mt-1">Audit results will organize here by AWS service</p>
              </div>
            ) : (
              byService.map(({ service, findings: svcFindings }) => (
                <ServiceNode key={service} service={service} findings={svcFindings} />
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

interface NodeFinding { id: string; severity: string; title: string; resource: string }
function ServiceNode({ service, findings }: { service: string; findings: NodeFinding[] }) {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()
  const icons: Record<string, string> = { S3:'🪣', IAM:'🔑', EC2:'🖥️', RDS:'🗄️', CloudTrail:'📋', GuardDuty:'👁️' }
  const hasCritical = (findings as any[]).some(f => f.severity === 'CRITICAL')

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full text-left text-xs p-3 hover:bg-slate-50 transition-colors"
      >
        <span className="text-lg">{icons[service] || '📁'}</span>
        <span className="font-bold text-slate-900 text-sm">{service}</span>
        {(findings as any[]).length > 0 ? (
          <span className={`ml-auto text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
            hasCritical ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-amber-700 bg-amber-50 border border-amber-200'
          }`}>
            {(findings as any[]).length} issue{(findings as any[]).length !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="ml-auto text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ✓ Clean
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (findings as any[]).length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100 bg-slate-50/70 p-2.5 space-y-1.5"
          >
            {(findings as any[]).map((f: any) => (
              <div
                key={f.id}
                onClick={() => navigate('/remediate')}
                className="flex items-start gap-2 p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer"
              >
                <SeverityBadge severity={f.severity} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{f.title}</p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">{f.resource}</p>
                </div>
                <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }
