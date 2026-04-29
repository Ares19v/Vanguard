import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Play, Download } from 'lucide-react'
import { useVanguardStore } from '../store/useVanguardStore'
import { useScan } from '../hooks/useScan'
import SeverityBadge from '../components/SeverityBadge'

const SERVICES = ['S3', 'IAM', 'EC2', 'RDS', 'CloudTrail', 'GuardDuty']

const LOG_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#f59e0b',
  LOW:      '#3b82f6',
  INFO:     '#6b7280',
  OK:       '#10b981',
}

interface LogLine {
  id: string
  type: 'service' | 'finding' | 'ok' | 'error' | 'info'
  text: string
  severity?: string
}

export default function Scanner() {
  const { findings, scanStatus, overallScore } = useVanguardStore()
  const { triggerScan } = useScan()
  const [logs, setLogs] = useState<LogLine[]>([])
  const [streaming, setStreaming] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Auto-scroll terminal
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

    addLog({ type: 'info', text: '▶  Initialising Vanguard ASOC scanner…', severity: 'INFO' })
    addLog({ type: 'info', text: `   Mode: ${useVanguardStore.getState().mockMode ? 'MOCK (simulated AWS)' : 'LIVE (real AWS)'}`, severity: 'INFO' })
    await delay(400)

    // Simulate SSE stream
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
            addLog({ type: 'ok', text: `\n✔  Scan complete. ${findings.length} findings. Overall Risk: ${overallScore}/100`, severity: 'OK' })
            break
          }
          if (payload.service !== lastService) {
            lastService = payload.service
            addLog({ type: 'service', text: `\n[*] Scanning ${payload.service}…`, severity: 'INFO' })
          }
          const f = payload.finding
          addLog({
            type: 'finding',
            text: `    ├── ${f.severity.padEnd(8)} ${f.title}`,
            severity: f.severity,
          })
        } catch { }
      }
    }

    // Also trigger the actual scan to populate store
    await triggerScan()
    setStreaming(false)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(findings, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `vanguard-scan-${Date.now()}.json`
    a.click()
  }

  // Group findings by service
  const byService = SERVICES.map(s => ({
    service: s,
    findings: findings.filter(f => f.service === s),
  }))

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Terminal className="w-6 h-6 text-accent" /> AWS Scanner
          </h1>
          <p className="text-sm text-muted mt-1">
            {scanStatus === 'running' ? '⚡ Scan in progress…'
              : scanStatus === 'done' ? `✓ Scan complete — ${findings.length} findings`
              : 'Run a scan to enumerate your AWS attack surface'}
          </p>
        </div>
        <div className="flex gap-2">
          {findings.length > 0 && (
            <button onClick={exportJSON} className="btn-ghost flex items-center gap-1.5 text-sm">
              <Download className="w-4 h-4" /> Export JSON
            </button>
          )}
          <button
            onClick={handleScan}
            disabled={scanStatus === 'running' || streaming}
            className="btn-primary flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {streaming ? 'Scanning…' : 'Run Scan'}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Terminal output ──────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="text-xs font-mono text-muted mb-2 tracking-wider">SCAN OUTPUT</div>
          <div
            ref={terminalRef}
            className="terminal h-[480px] overflow-y-auto relative"
          >
            {streaming && <div className="scan-line" />}
            {logs.length === 0 ? (
              <span className="text-muted/50">
                {`> vanguard scan --target aws --all-services`}
                <br />
                {`> Press "Run Scan" to begin...`}
              </span>
            ) : (
              logs.map(log => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-pre-wrap"
                  style={{ color: log.severity ? LOG_COLORS[log.severity] || '#22c55e' : '#22c55e' }}
                >
                  {log.text}
                </motion.div>
              ))
            )}
            {streaming && <span className="text-green-400 animate-pulse">█</span>}
          </div>
        </motion.div>

        {/* ── Resource tree ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <div className="text-xs font-mono text-muted mb-2 tracking-wider">FINDINGS TREE</div>
          <div className="glass rounded-xl h-[480px] overflow-y-auto p-4 space-y-2">
            {findings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted">
                <Terminal className="w-10 h-10 mb-3 opacity-30" />
                <span className="text-sm">No scan results yet</span>
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

interface NodeFinding { id: string; severity: string; title: string }
function ServiceNode({ service, findings }: { service: string; findings: NodeFinding[] }) {
  const [open, setOpen] = useState(true)
  const icons: Record<string, string> = { S3:'🪣', IAM:'🔑', EC2:'🖥️', RDS:'🗄️', CloudTrail:'📋', GuardDuty:'👁️' }
  const hasCritical = (findings as any[]).some(f => f.severity === 'CRITICAL')

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left text-sm py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <span>{icons[service] || '📁'}</span>
        <span className="font-semibold text-bright">{service}</span>
        {(findings as any[]).length > 0 ? (
          <span className={`ml-auto text-xs font-mono px-1.5 py-0.5 rounded ${hasCritical ? 'text-danger bg-danger/10' : 'text-warn bg-warn/10'}`}>
            {(findings as any[]).length} issue{(findings as any[]).length !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="ml-auto text-xs font-mono text-success">✓ clean</span>
        )}
      </button>
      <AnimatePresence>
        {open && (findings as any[]).length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-6 border-l border-border pl-3 space-y-1"
          >
            {(findings as any[]).map((f: any) => (
              <div key={f.id} className="flex items-start gap-2 py-1">
                <SeverityBadge severity={f.severity} />
                <span className="text-xs text-muted leading-relaxed">{f.title}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }
