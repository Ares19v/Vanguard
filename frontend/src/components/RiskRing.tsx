import { motion } from 'framer-motion'

interface Props {
  score: number       // 0–100
  size?: number       // SVG size in px (default 120)
  animate?: boolean
}

const RADIUS = 44
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function scoreToColor(score: number): { stroke: string; label: string } {
  if (score >= 85) return { stroke: '#ef4444', label: 'CRITICAL' }
  if (score >= 65) return { stroke: '#f97316', label: 'ELEVATED' }
  if (score >= 40) return { stroke: '#eab308', label: 'MODERATE' }
  if (score >= 15) return { stroke: '#38bdf8', label: 'GOOD'     }
  return { stroke: '#10b981', label: 'SECURE' }
}

export default function RiskRing({ score, size = 120, animate = true }: Props) {
  const { stroke, label } = scoreToColor(score)
  const progress    = Math.max(0, Math.min(score, 100))
  const offset      = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE
  const cx          = size / 2
  const cy          = size / 2
  const strokeWidth = 6

  return (
    <div className="relative flex items-center justify-center select-none shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Progress Arc */}
        <motion.circle
          cx={cx} cy={cy} r={RADIUS}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={animate ? { strokeDashoffset: CIRCUMFERENCE } : { strokeDashoffset: offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.0, ease: 'easeOut' }}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>

      {/* Center Score Display */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <motion.span
          className="font-display font-black text-white tracking-tight"
          style={{ fontSize: size * 0.28 }}
          initial={animate ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {Math.round(score)}
        </motion.span>
        <span className="font-mono text-[9px] font-bold tracking-widest text-slate-400 mt-0.5">
          {label}
        </span>
      </div>
    </div>
  )
}
