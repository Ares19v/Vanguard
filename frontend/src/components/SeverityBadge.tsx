import type { Finding } from '../store/useVanguardStore'

interface Props {
  severity: Finding['severity']
  size?: 'sm' | 'md'
}

const CONFIG: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: 'CRITICAL', cls: 'badge-critical' },
  HIGH:     { label: 'HIGH',     cls: 'badge-high'     },
  MEDIUM:   { label: 'MED',      cls: 'badge-medium'   },
  LOW:      { label: 'LOW',      cls: 'badge-low'       },
  INFO:     { label: 'INFO',     cls: 'badge-info'      },
}

export default function SeverityBadge({ severity, size = 'sm' }: Props) {
  const cfg = CONFIG[severity] || CONFIG.INFO
  return (
    <span className={`${cfg.cls} ${size === 'md' ? 'text-sm px-3 py-1' : ''}`}>
      {cfg.label}
    </span>
  )
}
