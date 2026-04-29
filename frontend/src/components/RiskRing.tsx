import { motion } from 'framer-motion'

interface Props {
  score: number       // 0–100
  size?: number       // SVG size in px (default 160)
  animate?: boolean
}

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function scoreToColor(score: number): string {
  if (score >= 85) return '#ef4444'
  if (score >= 65) return '#f97316'
  if (score >= 40) return '#f59e0b'
  if (score >= 15) return '#3b82f6'
  return '#10b981'
}

function scoreToLabel(score: number): string {
  if (score >= 85) return 'CRITICAL'
  if (score >= 65) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  if (score >= 15) return 'LOW'
  return 'SECURE'
}

export default function RiskRing({ score, size = 160, animate = true }: Props) {
  const color       = scoreToColor(score)
  const label       = scoreToLabel(score)
  const progress    = Math.max(0, Math.min(score, 100))
  const offset      = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE
  const cx          = size / 2
  const cy          = size / 2
  const strokeWidth = 8

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Outer glow ring */}
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', filter: `drop-shadow(0 0 12px ${color}66)` }}
      >
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={cx} cy={cy} r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={animate ? { strokeDashoffset: CIRCUMFERENCE } : { strokeDashoffset: offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>

      {/* Score text */}
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="font-mono font-bold number-glow"
          style={{ color, fontSize: size * 0.19 }}
          initial={animate ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Math.round(score)}
        </motion.span>
        <span className="font-mono text-[10px] text-muted tracking-widest">{label}</span>
      </div>
    </div>
  )
}
