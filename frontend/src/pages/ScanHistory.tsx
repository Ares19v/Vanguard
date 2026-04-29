import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Archive, Download, ChevronRight } from 'lucide-react'
import { useVanguardStore } from '../store/useVanguardStore'
import { useScan } from '../hooks/useScan'
import type { ScanSummary } from '../store/useVanguardStore'
import RiskRing from '../components/RiskRing'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export default function ScanHistory() {
  const { scanHistory } = useVanguardStore()
  const { fetchHistory, fetchScanById } = useScan()
  const [selected, setSelected] = useState<ScanSummary | null>(null)
  const [, setDetail]     = useState<any>(null)

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const openDetail = async (row: ScanSummary) => {
    setSelected(row)
    try {
      const full = await fetchScanById(row.scan_id)
      setDetail(full)
    } catch { setDetail(null) }
  }

  const exportCSV = () => {
    const headers = ['Scan ID', 'Timestamp', 'Mode', 'Overall Score', 'Critical', 'High', 'Medium', 'Low', 'Total', 'Duration']
    const rows = scanHistory.map(r => [
      r.scan_id, r.timestamp, r.mode, r.overall_score,
      r.critical_count, r.high_count, r.medium_count, r.low_count,
      r.finding_count, r.duration_seconds
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `vanguard-scan-history-${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Archive className="w-6 h-6 text-muted" /> Scan History
          </h1>
          <p className="text-sm text-muted mt-1">Audit trail of all security scans</p>
        </div>
        {scanHistory.length > 0 && (
          <button onClick={exportCSV} className="btn-ghost flex items-center gap-1.5 text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </motion.div>

      {scanHistory.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Archive className="w-12 h-12 text-muted/30 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-muted">No scan history yet</h3>
          <p className="text-sm text-muted/60 mt-1">Run your first scan to start building the audit trail</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Table */}
          <div className="xl:col-span-2">
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Timestamp', 'Mode', 'Score', 'Critical', 'High', 'Total', 'Duration'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-muted tracking-wider">
                        {h}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {scanHistory.map((row, i) => (
                    <motion.tr
                      key={row.scan_id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => openDetail(row)}
                      className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-white/[0.03] ${
                        selected?.scan_id === row.scan_id ? 'bg-accent/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted">{formatDate(row.timestamp)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          row.mode === 'mock'
                            ? 'text-teal border-teal/30 bg-teal/10'
                            : 'text-danger border-danger/30 bg-danger/10'
                        }`}>
                          {row.mode.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold" style={{
                          color: row.overall_score >= 65 ? '#ef4444' : row.overall_score >= 40 ? '#f59e0b' : '#10b981'
                        }}>
                          {row.overall_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-danger">{row.critical_count}</td>
                      <td className="px-4 py-3 font-mono text-warn">{row.high_count}</td>
                      <td className="px-4 py-3 font-mono text-muted">{row.finding_count}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">{row.duration_seconds}s</td>
                      <td className="px-4 py-3 text-muted">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          <div>
            {selected ? (
              <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-xl p-5 space-y-5">
                <div>
                  <div className="text-xs font-mono text-muted tracking-wider mb-1">SCAN DETAIL</div>
                  <div className="text-[10px] font-mono text-muted/60 break-all">{selected.scan_id}</div>
                </div>

                <div className="flex justify-center">
                  <RiskRing score={selected.overall_score} size={120} animate={false} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Critical', value: selected.critical_count, color: '#ef4444' },
                    { label: 'High',     value: selected.high_count,     color: '#f97316' },
                    { label: 'Medium',   value: selected.medium_count,   color: '#f59e0b' },
                    { label: 'Low',      value: selected.low_count,      color: '#3b82f6' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white/[0.03] rounded-lg p-3">
                      <div className="text-xs text-muted">{label}</div>
                      <div className="text-xl font-mono font-bold" style={{ color }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-[10px] font-mono text-muted mb-1">SERVICES</div>
                  <div className="flex flex-wrap gap-1">
                    {selected.services_scanned.map(s => (
                      <span key={s} className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-muted">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] font-mono text-muted">
                  Scanned in {selected.duration_seconds}s · {formatDate(selected.timestamp)}
                </div>
              </motion.div>
            ) : (
              <div className="glass rounded-xl p-8 text-center text-muted">
                <ChevronRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <span className="text-sm">Select a scan to view details</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
