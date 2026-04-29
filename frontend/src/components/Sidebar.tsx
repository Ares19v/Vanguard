import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, Terminal, Wifi, Wrench, Bot, Archive,
  ChevronLeft, ChevronRight, Layers, DollarSign,
  Activity, Users, Settings, Sparkles
} from 'lucide-react'
import { useVanguardStore } from '../store/useVanguardStore'

const NAV_SECURITY_DEV   = [
  { to: '/dashboard', icon: ShieldCheck, label: 'Dashboard',    labelClean: 'Overview'          },
  { to: '/scanner',   icon: Terminal,    label: 'Scanner',      labelClean: 'Security Check'    },
  { to: '/threats',   icon: Wifi,        label: 'Threat Feed',  labelClean: 'Live Alerts'       },
  { to: '/remediate', icon: Wrench,      label: 'Remediator',   labelClean: 'Fix Issues'        },
  { to: '/ai',        icon: Bot,         label: 'AI Consultant',labelClean: 'AI Helper'         },
  { to: '/history',   icon: Archive,     label: 'Scan History', labelClean: 'History'           },
]

const NAV_INFRA_DEV = [
  { to: '/inventory', icon: Layers,      label: 'Inventory',    labelClean: 'My Resources'      },
  { to: '/costs',     icon: DollarSign,  label: 'Cost & Billing',labelClean: 'My Bills'         },
  { to: '/metrics',   icon: Activity,    label: 'Metrics',      labelClean: 'Performance'       },
  { to: '/iam',       icon: Users,       label: 'IAM Explorer', labelClean: 'Team Access'       },
]

const NAV_BOTTOM = [
  { to: '/connect', icon: Settings, label: 'AWS Settings', labelClean: 'Settings' },
]

export default function Sidebar() {
  const { sidebarExpanded, toggleSidebar, isWsConnected, mockMode, cleanMode } = useVanguardStore()
  const location = useLocation()

  const NAV_SECURITY = NAV_SECURITY_DEV.map(n => ({ ...n, label: cleanMode ? n.labelClean : n.label }))
  const NAV_INFRA    = NAV_INFRA_DEV.map(n  => ({ ...n, label: cleanMode ? n.labelClean : n.label }))

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarExpanded ? 220 : 64 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-screen border-r border-border bg-panel shrink-0 z-50"
    >
      {/* ── Logo ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border overflow-hidden">
        <div className="relative shrink-0">
          <ShieldCheck className="w-7 h-7 text-accent" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>
        <AnimatePresence>
          {sidebarExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="text-sm font-semibold tracking-widest text-bright whitespace-nowrap">
                VANGUARD
              </div>
              <div className="text-[10px] font-mono text-muted whitespace-nowrap">
                ASOC v1.0
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav items ───────────────────────────────────────────────────── */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden px-2 space-y-1">

        {/* Security group */}
        <AnimatePresence>
          {sidebarExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-2 pb-1 pt-1 text-[9px] font-mono text-muted/50 tracking-widest uppercase">
              Security
            </motion.div>
          )}
        </AnimatePresence>
        {NAV_SECURITY.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to
          return (
            <NavLink key={to} to={to}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                  transition-colors duration-200 group overflow-hidden
                  ${isActive
                    ? 'bg-accent/15 text-accent border-r-2 border-accent -mr-2 pr-5'
                    : 'text-muted hover:text-bright hover:bg-white/5'
                  }
                `}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-accent' : ''}`} />
                <AnimatePresence>
                  {sidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          )
        })}

        {/* Infrastructure group */}
        <div className="pt-3" />
        <AnimatePresence>
          {sidebarExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-2 pb-1 pt-1 text-[9px] font-mono text-muted/50 tracking-widest uppercase">
              Infrastructure
            </motion.div>
          )}
        </AnimatePresence>
        {NAV_INFRA.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to
          return (
            <NavLink key={to} to={to}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                  transition-colors duration-200 group overflow-hidden
                  ${isActive
                    ? 'bg-purple-500/15 text-purple-400 border-r-2 border-purple-400 -mr-2 pr-5'
                    : 'text-muted hover:text-bright hover:bg-white/5'
                  }
                `}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-purple-400' : ''}`} />
                <AnimatePresence>
                  {sidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          )
        })}

        {/* Settings group */}
        <div className="pt-3" />
        {NAV_BOTTOM.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to
          return (
            <NavLink key={to} to={to}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                  transition-colors duration-200 overflow-hidden
                  ${isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border-r-2 border-emerald-400 -mr-2 pr-5'
                    : 'text-muted hover:text-bright hover:bg-white/5'
                  }
                `}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
                <AnimatePresence>
                  {sidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          )
        })}
      </nav>


      {/* ── Status footer ───────────────────────────────────────────────── */}
      <div className="border-t border-border p-3 space-y-2 overflow-hidden">
        {/* Mode badges */}
        <AnimatePresence>
          {sidebarExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 flex-wrap"
            >
              <span className={`
                text-[10px] font-mono px-2 py-0.5 rounded border
                ${mockMode
                  ? 'text-teal border-teal/30 bg-teal/10'
                  : 'text-danger border-danger/30 bg-danger/10'
                }
              `}>
                {mockMode ? '🔵 MOCK' : '🔴 LIVE'}
              </span>
              {cleanMode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border text-violet-400 border-violet-400/30 bg-violet-400/10 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />CLEAN
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Online status */}
        <div className="flex items-center gap-2 px-1">
          <div className={isWsConnected ? 'dot-online' : 'dot-warn'} />
          <AnimatePresence>
            {sidebarExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-mono text-muted whitespace-nowrap"
              >
                VANGUARD // {isWsConnected ? 'ONLINE' : 'RECONNECTING'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Toggle button ───────────────────────────────────────────────── */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
          bg-panel border border-border flex items-center justify-center
          hover:border-accent hover:text-accent transition-colors z-10"
      >
        {sidebarExpanded
          ? <ChevronLeft className="w-3 h-3" />
          : <ChevronRight className="w-3 h-3" />
        }
      </button>
    </motion.aside>
  )
}
