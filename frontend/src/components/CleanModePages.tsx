/**
 * Clean Mode pages — simplified plain-English views for non-technical users.
 * Each component wraps an existing page's data in a simpler UI.
 */

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { InventoryData, CostData, IAMData } from '../store/useVanguardStore'

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const ITEM = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

// ─────────────────────────────────────────────────────────────────────────────
// Big friendly status card
// ─────────────────────────────────────────────────────────────────────────────
function BigCard({
  emoji, title, subtitle, color = 'emerald', onClick
}: {
  emoji: string; title: string; subtitle: string; color?: string; onClick?: () => void
}) {
  return (
    <motion.div
      variants={ITEM}
      onClick={onClick}
      className={`glass rounded-2xl p-6 cursor-pointer hover:bg-white/[0.05] transition-colors border ${
        color === 'red'    ? 'border-red-400/20'    :
        color === 'yellow' ? 'border-yellow-400/20'  :
        color === 'blue'   ? 'border-blue-400/20'    :
        color === 'purple' ? 'border-purple-400/20'  :
                             'border-emerald-400/20'
      }`}
    >
      <div className="text-4xl mb-3">{emoji}</div>
      <div className={`text-xl font-bold mb-1 ${
        color === 'red'    ? 'text-red-400'    :
        color === 'yellow' ? 'text-yellow-400'  :
        color === 'blue'   ? 'text-blue-400'    :
        color === 'purple' ? 'text-purple-400'  :
                             'text-emerald-400'
      }`}>{title}</div>
      <div className="text-sm text-muted leading-relaxed">{subtitle}</div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Clean Security Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export function CleanDashboard({
  score, critical, high, medium, low, findings
}: {
  score: number; critical: number; high: number; medium: number; low: number
  findings: Array<{ severity: string; title: string; description: string; service: string }>
}) {
  const navigate = useNavigate()
  const totalProblems = critical + high + medium + low
  const statusEmoji = score < 30 ? '🟢' : score < 60 ? '🟡' : '🔴'
  const statusText  = score < 30 ? 'Looking Good' : score < 60 ? 'Some Issues' : 'Needs Attention'
  const statusColor = score < 30 ? 'emerald' : score < 60 ? 'yellow' : 'red'

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="text-6xl mb-3">{statusEmoji}</div>
        <h1 className="text-3xl font-bold text-bright">Your Cloud is {statusText}</h1>
        <p className="text-muted mt-2 text-lg">
          {totalProblems === 0
            ? 'No security issues found. Everything looks secure.'
            : `We found ${totalProblems} thing${totalProblems !== 1 ? 's' : ''} that need${totalProblems === 1 ? 's' : ''} your attention.`}
        </p>
      </motion.div>

      <motion.div variants={STAGGER} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 mb-8">
        <BigCard emoji="🔴" title={`${critical} Critical`}
          subtitle={critical === 0 ? 'No urgent problems' : `${critical} issue${critical !== 1 ? 's' : ''} that need immediate fixing`}
          color={critical > 0 ? 'red' : 'emerald'} onClick={() => navigate('/scanner')} />
        <BigCard emoji="🟠" title={`${high} High`}
          subtitle={high === 0 ? 'No major problems' : `${high} issue${high !== 1 ? 's' : ''} to fix soon`}
          color={high > 0 ? 'yellow' : 'emerald'} onClick={() => navigate('/scanner')} />
        <BigCard emoji="🟡" title={`${medium} Medium`}
          subtitle={medium === 0 ? 'No medium problems' : `${medium} issue${medium !== 1 ? 's' : ''} worth reviewing`}
          color={medium > 0 ? 'yellow' : 'emerald'} onClick={() => navigate('/scanner')} />
        <BigCard emoji="🔵" title={`${low} Low`}
          subtitle={low === 0 ? 'No low-level issues' : `${low} minor thing${low !== 1 ? 's' : ''} to be aware of`}
          color={low > 0 ? 'blue' : 'emerald'} onClick={() => navigate('/scanner')} />
      </motion.div>

      {findings.length > 0 && (
        <motion.div variants={ITEM} className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-bright mb-4">🚨 Most Important Issue Right Now</h2>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="font-semibold text-bright mb-1">{findings[0].title}</div>
            <p className="text-sm text-muted leading-relaxed">{findings[0].description}</p>
            <button onClick={() => navigate('/remediate')}
              className="mt-3 btn-danger text-sm">Fix This Issue</button>
          </div>
        </motion.div>
      )}

      {totalProblems === 0 && (
        <motion.div variants={ITEM} className="glass rounded-2xl p-8 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <div className="text-xl font-bold text-emerald-400 mb-2">All Clear!</div>
          <p className="text-muted">Run a scan to check your cloud security status.</p>
          <button onClick={() => navigate('/scanner')} className="mt-4 btn-primary">Run Security Check</button>
        </motion.div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Clean Inventory
// ─────────────────────────────────────────────────────────────────────────────
export function CleanInventory({ inventory }: { inventory: InventoryData }) {
  const navigate = useNavigate()

  const runningEC2 = inventory.ec2_instances.filter(i => i.state === 'running').length
  const stoppedEC2 = inventory.ec2_instances.filter(i => i.state === 'stopped').length
  const totalStorage = inventory.s3_buckets.reduce((a, b) => a + b.total_size_gb, 0)
  const publicBuckets = inventory.s3_buckets.filter(b => !b.public_access_blocked).length
  const idleResources = inventory.idle_resources

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-bright mb-2">☁️ What's Running</h1>
        <p className="text-muted text-lg">Here's everything that's active in your cloud account right now.</p>
      </motion.div>

      <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-4">
        <BigCard emoji="🖥️"
          title={`${runningEC2} Server${runningEC2 !== 1 ? 's' : ''} Running`}
          subtitle={`${stoppedEC2 > 0 ? `${stoppedEC2} stopped (still may cost money).` : 'All servers are active.'} These are the computers that run your apps.`}
          color={stoppedEC2 > 0 ? 'yellow' : 'emerald'}
          onClick={() => navigate('/inventory')} />

        <BigCard emoji="🪣"
          title={`${inventory.s3_buckets.length} Storage Buckets — ${totalStorage >= 1024 ? `${(totalStorage/1024).toFixed(1)} TB` : `${totalStorage.toFixed(0)} GB`} total`}
          subtitle={publicBuckets > 0
            ? `⚠️ ${publicBuckets} bucket${publicBuckets !== 1 ? 's' : ''} are publicly accessible — anyone on the internet can read them. This may be a security risk.`
            : 'All your file storage is private and secure. No public access.'}
          color={publicBuckets > 0 ? 'red' : 'emerald'}
          onClick={() => navigate('/inventory')} />

        <BigCard emoji="🗄️"
          title={`${inventory.rds_instances.length} Database${inventory.rds_instances.length !== 1 ? 's' : ''}`}
          subtitle={`${inventory.rds_instances.filter(r => r.publicly_accessible).length > 0
            ? '⚠️ Some databases are accessible from the internet — check if this is intentional.'
            : 'All databases are private and not directly accessible from the internet.'}`}
          color={inventory.rds_instances.filter(r => r.publicly_accessible).length > 0 ? 'yellow' : 'emerald'}
          onClick={() => navigate('/inventory')} />

        <BigCard emoji="⚡"
          title={`${inventory.lambda_functions.length} Automated Task${inventory.lambda_functions.length !== 1 ? 's' : ''}`}
          subtitle="Small programs that run automatically when needed. They only cost money when they run."
          color="blue"
          onClick={() => navigate('/inventory')} />

        {idleResources > 0 && (
          <BigCard emoji="💸"
            title={`${idleResources} Resource${idleResources !== 1 ? 's' : ''} Not Being Used`}
            subtitle="These are things that are turned on but doing nothing — they're costing you money for no reason. Go to Costs to see what to turn off."
            color="red"
            onClick={() => navigate('/costs')} />
        )}
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Clean Costs
// ─────────────────────────────────────────────────────────────────────────────
export function CleanCosts({ costs }: { costs: CostData }) {
  const navigate = useNavigate()
  const onTrack = costs.forecasted_month_total <= costs.last_month_total * 1.1

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-bright mb-2">💰 Your Cloud Bill</h1>
        <p className="text-muted text-lg">A simple breakdown of what you're spending.</p>
      </motion.div>

      <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-4">
        <BigCard emoji="📅"
          title={`$${costs.mtd_total.toFixed(2)} spent so far this month`}
          subtitle={`You're on track to spend $${costs.forecasted_month_total.toFixed(2)} by the end of the month. Last month you spent $${costs.last_month_total.toFixed(2)}.`}
          color={onTrack ? 'emerald' : 'yellow'} />

        <BigCard emoji={onTrack ? '👍' : '📈'}
          title={onTrack ? 'Spending is normal' : 'Spending is higher than usual'}
          subtitle={`Compared to last month, you're spending ${Math.abs(costs.mtd_change_pct).toFixed(0)}% ${costs.mtd_change_pct > 0 ? 'more' : 'less'}.`}
          color={onTrack ? 'emerald' : 'yellow'} />

        {costs.total_estimated_waste > 0 && (
          <BigCard emoji="🗑️"
            title={`You could save $${costs.total_estimated_waste.toFixed(2)}/month`}
            subtitle={`There are ${costs.idle_resources.length} thing${costs.idle_resources.length !== 1 ? 's' : ''} running that don't appear to be doing anything. Turning them off could save you money.`}
            color="red"
            onClick={() => navigate('/inventory')} />
        )}

        <motion.div variants={ITEM} className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-bright mb-4">🏷️ Where's the money going?</h2>
          <div className="space-y-3">
            {costs.by_service.slice(0, 5).map((s, i) => (
              <div key={s.service} className="flex items-center gap-4">
                <div className="text-muted w-5 text-sm">{i + 1}.</div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-bright">
                      {s.service.replace('Amazon ', '').replace('AWS ', '')}
                    </span>
                    <span className="text-sm font-mono text-emerald-400">${s.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full">
                    <div className="h-2 bg-emerald-400 rounded-full" style={{ width: `${s.percentage}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {costs.idle_resources.length > 0 && (
          <motion.div variants={ITEM} className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-bright mb-4">💡 Things You Could Turn Off</h2>
            <div className="space-y-3">
              {costs.idle_resources.map(r => (
                <div key={r.resource_id} className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="font-semibold text-bright text-sm mb-1">
                    {r.resource_type === 'EC2' ? '🖥️ A server' :
                     r.resource_type === 'RDS' ? '🗄️ A database' :
                     r.resource_type === 'ElasticIP' ? '📌 A reserved address' :
                     r.resource_type}: {r.resource_id}
                  </div>
                  <p className="text-xs text-muted mb-1">{r.reason}</p>
                  <p className="text-xs text-emerald-400">💡 {r.recommendation} — saves ${r.estimated_monthly_waste.toFixed(2)}/month</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Clean Metrics
// ─────────────────────────────────────────────────────────────────────────────
export function CleanMetrics({ metricsMap }: { metricsMap: Record<string, { avg_cpu?: number; max_cpu?: number; is_idle: boolean; resource_type: string }> }) {
  const resources = Object.entries(metricsMap)

  const LABELS: Record<string, string> = {
    'i-0a1b2c3d4e5f6a7b8': 'Main Web Server',
    'i-1b2c3d4e5f6a7b8c9': 'API Server',
    'i-3d4e5f6a7b8c9d0e1': 'ML Processing Server',
    'prod-mysql-01': 'Main Database',
    'analytics-pg-02': 'Analytics Database',
    'process-user-uploads': 'File Upload Handler',
    'old-migration-script': 'Old Migration Script',
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-bright mb-2">📊 Performance</h1>
        <p className="text-muted text-lg">How hard are your servers and services working right now?</p>
      </motion.div>

      {resources.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center text-muted">
          <div className="text-4xl mb-3">📊</div>
          <p>Go to the Metrics page to load performance data for a resource.</p>
        </div>
      )}

      <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-4">
        {resources.map(([id, m]) => {
          const cpu = m.avg_cpu ?? 0
          const busy = cpu > 60
          const idle = cpu < 5 || m.is_idle
          const label = LABELS[id] || id

          return (
            <motion.div key={id} variants={ITEM} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-base font-bold text-bright">{label}</div>
                  <div className="text-xs text-muted capitalize">{m.resource_type}</div>
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-lg ${
                  idle  ? 'bg-yellow-400/15 text-yellow-400' :
                  busy  ? 'bg-red-400/15 text-red-400' :
                          'bg-emerald-400/15 text-emerald-400'
                }`}>
                  {idle ? '😴 Idle' : busy ? '🔥 Busy' : '✅ Normal'}
                </span>
              </div>

              {m.avg_cpu != null && (
                <div>
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>How busy is it?</span>
                    <span className="font-mono">{cpu.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        busy  ? 'bg-red-400' :
                        idle  ? 'bg-yellow-400' :
                                'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(cpu, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted mt-1.5">
                    {idle  ? '⚠️ This is barely doing anything — you might be overpaying for it.' :
                     busy  ? '⚠️ This is working very hard — consider upgrading it.' :
                             '✅ This is running at a healthy level.'}
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Clean IAM
// ─────────────────────────────────────────────────────────────────────────────
export function CleanIAM({ iamData }: { iamData: IAMData }) {
  const usersNoMfa = iamData.users.filter(u => u.console_access && !u.mfa_enabled)
  const admins     = iamData.users.filter(u => u.is_admin)
  const oldKeys    = iamData.users.filter(u =>
    u.access_keys.some(k => {
      const lastUsed = (k as Record<string, string>).last_used
      if (!lastUsed) return false
      const days = (Date.now() - new Date(lastUsed).getTime()) / 86400000
      return days > 90
    })
  )

  const overallRisk = usersNoMfa.length > 0 || admins.length > 2 || oldKeys.length > 0

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-bright mb-2">👥 Who Has Access</h1>
        <p className="text-muted text-lg">A plain-English summary of who can access your AWS account and whether it looks safe.</p>
      </motion.div>

      <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-4">
        <BigCard emoji="👤"
          title={`${iamData.total_users} People Have Access`}
          subtitle={`${admins.length} of them have full admin access (can do anything). ${iamData.total_users - admins.length} have limited access.`}
          color={admins.length > 2 ? 'yellow' : 'emerald'} />

        {usersNoMfa.length > 0 ? (
          <BigCard emoji="🔓"
            title={`${usersNoMfa.length} Account${usersNoMfa.length !== 1 ? 's' : ''} Without 2-Step Verification`}
            subtitle={`These people log in to the console but haven't set up two-factor authentication (2FA / MFA). This means if their password is stolen, anyone can log in as them. Fix this urgently.`}
            color="red" />
        ) : (
          <BigCard emoji="🔒"
            title="Everyone has 2-Step Verification"
            subtitle="All users who log in to the console have two-factor authentication enabled. This is great for security."
            color="emerald" />
        )}

        {oldKeys.length > 0 && (
          <BigCard emoji="🗝️"
            title={`${oldKeys.length} Old Access Key${oldKeys.length !== 1 ? 's' : ''} Found`}
            subtitle="Some people have API keys that haven't been used in over 90 days. Old unused keys are a security risk — they should be deleted."
            color="yellow" />
        )}

        <motion.div variants={ITEM} className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-bright mb-4">👥 The Full Team</h2>
          <div className="space-y-3">
            {iamData.users.map(u => (
              <div key={u.user_id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03]">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${u.is_admin ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-muted'}`}>
                  {u.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-bright text-sm">{u.username}</div>
                  <div className="text-xs text-muted">
                    {u.is_admin ? '🔴 Full admin access' : '🟢 Limited access'}
                    {u.console_access ? ' · Can log in via website' : ' · API access only'}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!u.mfa_enabled && u.console_access && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-red-400/15 text-red-400">⚠ No 2FA</span>
                  )}
                  {u.mfa_enabled && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-400/15 text-emerald-400">🔒 2FA On</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {overallRisk ? (
          <motion.div variants={ITEM} className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <div className="font-bold text-red-400 mb-1">⚠️ Action Required</div>
            <p className="text-sm text-muted">There are some access-related security issues that should be fixed. The most important one is enabling 2-factor authentication for all users who log in to the console.</p>
          </motion.div>
        ) : (
          <motion.div variants={ITEM} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="font-bold text-emerald-400 mb-1">✅ Access Looks Good</div>
            <p className="text-sm text-muted">All the people with access to your account appear to have good security practices in place.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
