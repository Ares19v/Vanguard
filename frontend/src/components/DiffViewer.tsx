import type { RemediationResult } from '../store/useVanguardStore'

interface Props {
  result: RemediationResult
}

function renderValue(v: unknown, path = ''): React.ReactNode {
  if (v === null || v === undefined) return <span className="text-muted">null</span>
  if (typeof v === 'boolean') return <span className={v ? 'text-success' : 'text-danger'}>{String(v)}</span>
  if (typeof v === 'number')  return <span className="text-accent">{v}</span>
  if (typeof v === 'string')  return <span className="text-yellow-300">"{v}"</span>
  if (typeof v === 'object') {
    return (
      <div className="pl-4 border-l border-border">
        {Object.entries(v as Record<string, unknown>).map(([k, val]) => (
          <div key={k} className="flex gap-2">
            <span className="text-teal shrink-0">{k}:</span>
            {renderValue(val, path + '.' + k)}
          </div>
        ))}
      </div>
    )
  }
  return <span>{String(v)}</span>
}

export default function DiffViewer({ result }: Props) {
  const beforeKeys = Object.keys(result.before)
  const allKeys    = Array.from(new Set([...beforeKeys, ...Object.keys(result.after)]))

  return (
    <div className="space-y-3">
      {/* Status banner */}
      <div className={`
        text-xs font-mono px-3 py-2 rounded border
        ${result.status === 'dry_run_preview'
          ? 'text-teal border-teal/30 bg-teal/10'
          : result.status === 'applied'
          ? 'text-success border-success/30 bg-success/10'
          : 'text-danger border-danger/30 bg-danger/10'
        }
      `}>
        {result.status === 'dry_run_preview' ? '🔵 DRY RUN PREVIEW' : result.status === 'applied' ? '✅ APPLIED' : '❌ FAILED'}
        {' — '}{result.message}
      </div>

      {/* Diff grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Before */}
        <div>
          <div className="text-[10px] font-mono text-muted mb-1 tracking-wider">◀ BEFORE</div>
          <div className="terminal text-xs max-h-48 overflow-auto space-y-0.5">
            {allKeys.map(k => (
              <div key={k} className="diff-del">
                <span className="text-muted mr-2">{k}:</span>
                {renderValue(result.before[k])}
              </div>
            ))}
          </div>
        </div>

        {/* After */}
        <div>
          <div className="text-[10px] font-mono text-muted mb-1 tracking-wider">▶ AFTER</div>
          <div className="terminal text-xs max-h-48 overflow-auto space-y-0.5">
            {allKeys.map(k => (
              <div key={k} className="diff-add">
                <span className="text-muted mr-2">{k}:</span>
                {renderValue(result.after[k])}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commands */}
      {result.commands_executed.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-muted mb-1 tracking-wider">⚡ COMMANDS</div>
          <div className="terminal text-xs space-y-1">
            {result.commands_executed.map((cmd, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-muted shrink-0">$</span>
                <span className="text-success break-all">{cmd}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
