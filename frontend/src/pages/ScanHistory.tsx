import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Archive, Download, ChevronRight, History } from 'lucide-react'
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-light-card p-6 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-950 flex items-center gap-2.5">
            <History className="w-6 h-6 text-slate-800" />
            <span>Audit Trail & Historical Archives</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable SQLite audit logs of all historical security scans and posture evaluations
          </p>
        </div>

        {scanHistory.length > 0 && (
          <button onClick={exportCSV} className="btn-pill-white text-xs">
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        )}
      </motion.div>

      {scanHistory.length === 0 ? (
        <div className="glass-light-card p-16 text-center">
          <Archive className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-slate-900">No scan history recorded</h3>
          <p className="text-xs text-slate-500 mt-1">Run an audit scan to establish baseline security tracking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Table */}
          <div className="xl:col-span-8">
            <div className="glass-light-card overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/60 font-mono text-[11px] text-slate-600 uppercase">
                    {['Timestamp', 'Mode', 'Score', 'Critical', 'High', 'Total', 'Duration', ''].map(h => (
                      <th key={h} className="px-4 py-3.5 font-bold tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {scanHistory.map((row, i) => (
                    <motion.tr
                      key={row.scan_id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => openDetail(row)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50/90 ${
                        selected?.scan_id === row.scan_id ? 'bg-slate-100/90 font-semibold' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5 text-slate-900 font-medium">{formatDate(row.timestamp)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          row.mode === 'mock'
                            ? 'text-sky-700 border-sky-300 bg-sky-50'
                            : 'text-rose-700 border-rose-300 bg-rose-50'
                        }`}>
                          {row.mode.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold font-display text-sm text-slate-900">
                          {Math.round(row.overall_score)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-rose-600 font-bold">{row.critical_count}</td>
                      <td className="px-4 py-3.5 text-amber-600 font-bold">{row.high_count}</td>
                      <td className="px-4 py-3.5 text-slate-600">{row.finding_count}</td>
                      <td className="px-4 py-3.5 text-slate-500">{row.duration_seconds}s</td>
                      <td className="px-4 py-3.5 text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="xl:col-span-4">
            {selected ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-light-card p-6 space-y-5">
                <div>
                  <div className="text-xs font-mono text-slate-600 tracking-wider mb-1 uppercase font-bold">Audit Detail</div>
                  <div className="text-[10px] font-mono text-slate-500 break-all">{selected.scan_id}</div>
                </div>

                <div className="flex justify-center my-2">
                  <RiskRing score={selected.overall_score} size={110} animate={false} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  {[
                    { label: 'Critical', value: selected.critical_count, text: 'text-rose-600' },
                    { label: 'High',     value: selected.high_count,     text: 'text-amber-600' },
                    { label: 'Medium',   value: selected.medium_count,   text: 'text-yellow-600' },
                    { label: 'Low',      value: selected.low_count,      text: 'text-blue-600' },
                  ].map(({ label, value, text }) => (
                    <div key={label} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <div className="text-[10px] text-slate-500 uppercase font-mono">{label}</div>
                      <div className={`text-xl font-display font-extrabold mt-0.5 ${text}`}>{value}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase mb-2 font-semibold">Services Audited</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.services_scanned.map(s => (
                      <span key={s} className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass-light-card p-12 text-center text-slate-500">
                <ChevronRight className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <span className="text-xs">Select any historical audit row to inspect full score metrics</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
