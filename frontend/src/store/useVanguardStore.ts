/**
 * Vanguard ASOC — Zustand global store
 * Slices: scan, threats, ai, ui, inventory, costs, metrics, iam
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Finding {
  id: string
  service: string
  title: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  resource: string
  resource_arn?: string
  risk_score: number
  remediation_steps: string[]
  is_remediated: boolean
  region: string
  account_id?: string
  metadata: Record<string, unknown>
  discovered_at: string
}

export interface ScanReport {
  scan_id: string
  timestamp: string
  findings: Finding[]
  overall_score: number
  mode: 'mock' | 'live'
  services_scanned: string[]
  duration_seconds: number
}

export interface ScanSummary {
  scan_id: string
  timestamp: string
  finding_count: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  overall_score: number
  mode: string
  duration_seconds: number
  services_scanned: string[]
}

export interface ThreatEvent {
  event_id: string
  source_ip: string
  source_port: number
  target_ip: string
  target_port: number
  protocol: string
  event_type: string
  severity: string
  timestamp: string
  geo: { lat: number; lon: number; country: string; city: string; isp?: string }
  details: string
  bytes_transferred?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  finding_context?: Finding
  id: string
  streaming?: boolean
}

export interface RemediationResult {
  finding_id: string
  dry_run: boolean
  before: Record<string, unknown>
  after: Record<string, unknown>
  status: string
  message: string
  commands_executed: string[]
  timestamp: string
}

// ── Inventory Types ────────────────────────────────────────────────────────

export interface EC2Instance {
  instance_id: string
  instance_type: string
  state: string
  public_ip?: string
  private_ip?: string
  public_dns?: string
  ami_id: string
  ami_name?: string
  launch_time: string
  uptime_seconds: number
  availability_zone: string
  region: string
  key_pair?: string
  iam_role?: string
  vpc_id?: string
  subnet_id?: string
  security_groups: Array<{ id: string; name: string }>
  tags: Record<string, string>
  platform?: string
  architecture: string
  ebs_volumes: Array<Record<string, unknown>>
  cpu_utilization?: number
  monthly_cost_estimate?: number
}

export interface S3BucketDetail {
  name: string
  region: string
  creation_date?: string
  total_size_bytes: number
  total_size_gb: number
  object_count: number
  storage_class_breakdown: Record<string, number>
  versioning: string
  encryption: string
  public_access_blocked: boolean
  replication_enabled: boolean
  lifecycle_rules_count: number
  access_logs_enabled: boolean
  cors_enabled: boolean
  tags: Record<string, string>
  estimated_monthly_cost?: number
}

export interface RDSInstance {
  instance_id: string
  engine: string
  engine_version: string
  instance_class: string
  status: string
  multi_az: boolean
  publicly_accessible: boolean
  allocated_storage_gb: number
  endpoint?: string
  port?: number
  region: string
  availability_zone: string
  backup_retention_days: number
  encrypted: boolean
  deletion_protection: boolean
  tags: Record<string, string>
  cpu_utilization?: number
  free_storage_gb?: number
  monthly_cost_estimate?: number
}

export interface LambdaFunction {
  function_name: string
  function_arn: string
  runtime: string
  handler: string
  code_size_bytes: number
  memory_mb: number
  timeout_seconds: number
  last_modified?: string
  role: string
  description: string
  region: string
  invocations_24h?: number
  errors_24h?: number
  avg_duration_ms?: number
  monthly_cost_estimate?: number
  tags: Record<string, string>
}

export interface VPCDetail {
  vpc_id: string
  cidr_block: string
  is_default: boolean
  state: string
  region: string
  subnet_count: number
  subnets: Array<Record<string, unknown>>
  internet_gateway_attached: boolean
  nat_gateways: number
  route_tables: number
  security_groups: number
  tags: Record<string, string>
}

export interface ElasticIP {
  allocation_id: string
  public_ip: string
  associated_instance?: string
  is_idle: boolean
  region: string
}

export interface LoadBalancer {
  name: string
  arn: string
  lb_type: string
  scheme: string
  state: string
  dns_name: string
  region: string
  availability_zones: string[]
  target_group_count: number
  created_at?: string
}

export interface InventoryData {
  account_id: string
  region: string
  all_regions: boolean
  regions_scanned: string[]
  ec2_instances: EC2Instance[]
  s3_buckets: S3BucketDetail[]
  rds_instances: RDSInstance[]
  lambda_functions: LambdaFunction[]
  vpcs: VPCDetail[]
  elastic_ips: ElasticIP[]
  load_balancers: LoadBalancer[]
  total_resources: number
  idle_resources: number
  scanned_at: string
  mode: string
}

// ── Cost Types ──────────────────────────────────────────────────────────────

export interface DailyCost { date: string; amount: number; currency: string }
export interface ServiceCost { service: string; amount: number; percentage: number }
export interface IdleResource {
  resource_id: string
  resource_type: string
  reason: string
  estimated_monthly_waste: number
  region: string
  recommendation: string
}
export interface CostData {
  account_id: string
  period_start: string
  period_end: string
  mtd_total: number
  mtd_change_pct: number
  forecasted_month_total: number
  last_month_total: number
  currency: string
  daily_trend: DailyCost[]
  by_service: ServiceCost[]
  top_resource_costs: Array<Record<string, unknown>>
  idle_resources: IdleResource[]
  total_estimated_waste: number
  mode: string
}

// ── Metrics Types ───────────────────────────────────────────────────────────

export interface MetricPoint { timestamp: string; value: number; unit: string }
export interface ResourceMetrics {
  resource_id: string
  resource_type: string
  region: string
  period: string
  cpu_utilization: MetricPoint[]
  network_in_bytes: MetricPoint[]
  network_out_bytes: MetricPoint[]
  disk_read_bytes: MetricPoint[]
  disk_write_bytes: MetricPoint[]
  free_storage_bytes: MetricPoint[]
  db_connections: MetricPoint[]
  invocations: MetricPoint[]
  errors: MetricPoint[]
  duration_ms: MetricPoint[]
  throttles: MetricPoint[]
  avg_cpu?: number
  max_cpu?: number
  is_idle: boolean
  mode: string
}

// ── IAM Types ───────────────────────────────────────────────────────────────

export interface IAMUser {
  user_id: string
  username: string
  arn: string
  created_at?: string
  last_login?: string
  console_access: boolean
  mfa_enabled: boolean
  access_keys: Array<Record<string, unknown>>
  attached_policies: string[]
  groups: string[]
  is_admin: boolean
  tags: Record<string, string>
}

export interface IAMRole {
  role_id: string
  role_name: string
  arn: string
  description: string
  created_at?: string
  trust_policy_principals: string[]
  attached_policies: string[]
  last_used?: string
  tags: Record<string, string>
}

export interface IAMData {
  account_id: string
  users: IAMUser[]
  roles: IAMRole[]
  password_policy?: Record<string, unknown>
  total_users: number
  users_without_mfa: number
  admin_users: number
  users_with_console_no_mfa: number
  mode: string
}

// ── Store shape ────────────────────────────────────────────────────────────

interface VanguardState {
  // ── Scan ─────────────────────────────────────────────────────────────
  findings: Finding[]
  scanStatus: 'idle' | 'running' | 'done' | 'failed'
  overallScore: number
  lastScanId: string | null
  lastScanMode: 'mock' | 'live'
  scanHistory: ScanSummary[]
  scanDuration: number

  // ── Threats ───────────────────────────────────────────────────────────
  threatEvents: ThreatEvent[]
  isWsConnected: boolean
  threatEventCount: number

  // ── AI ────────────────────────────────────────────────────────────────
  chatMessages: ChatMessage[]
  isAiStreaming: boolean
  activeFindingContext: Finding | null

  // ── Remediation ───────────────────────────────────────────────────────
  remediationResults: Record<string, RemediationResult>

  // ── Inventory ─────────────────────────────────────────────────────────
  inventory: InventoryData | null
  inventoryLoading: boolean

  // ── Costs ─────────────────────────────────────────────────────────────
  costs: CostData | null
  costsLoading: boolean

  // ── Metrics ───────────────────────────────────────────────────────────
  metricsMap: Record<string, ResourceMetrics>
  metricsLoading: boolean

  // ── IAM ───────────────────────────────────────────────────────────────
  iamData: IAMData | null
  iamLoading: boolean

  // ── UI ────────────────────────────────────────────────────────────────
  selectedFinding: Finding | null
  sidebarExpanded: boolean
  mockMode: boolean
  cleanMode: boolean

  // ── Actions ───────────────────────────────────────────────────────────
  setFindings: (findings: Finding[]) => void
  setScanStatus: (status: VanguardState['scanStatus']) => void
  setOverallScore: (score: number) => void
  setLastScan: (id: string, mode: 'mock' | 'live', duration: number) => void
  setScanHistory: (history: ScanSummary[]) => void
  markFindingRemediated: (id: string) => void

  addThreatEvent: (event: ThreatEvent) => void
  setWsConnected: (connected: boolean) => void
  clearThreats: () => void

  addChatMessage: (msg: ChatMessage) => void
  updateLastAssistantMessage: (chunk: string) => void
  setAiStreaming: (streaming: boolean) => void
  setActiveFinding: (finding: Finding | null) => void
  clearChat: () => void

  setRemediationResult: (id: string, result: RemediationResult) => void

  setInventory: (data: InventoryData) => void
  setInventoryLoading: (loading: boolean) => void

  setCosts: (data: CostData) => void
  setCostsLoading: (loading: boolean) => void

  setMetrics: (id: string, data: ResourceMetrics) => void
  setMetricsLoading: (loading: boolean) => void

  setIAM: (data: IAMData) => void
  setIAMLoading: (loading: boolean) => void

  setSelectedFinding: (finding: Finding | null) => void
  toggleSidebar: () => void
  setMockMode: (mock: boolean) => void
  setCleanMode: (clean: boolean) => void
}

// ── Store implementation ───────────────────────────────────────────────────

export const useVanguardStore = create<VanguardState>()(
  devtools(
    (set, get) => ({
      // ── Initial state ─────────────────────────────────────────────────
      findings: [],
      scanStatus: 'idle',
      overallScore: 0,
      lastScanId: null,
      lastScanMode: 'mock',
      scanHistory: [],
      scanDuration: 0,

      threatEvents: [],
      isWsConnected: false,
      threatEventCount: 0,

      chatMessages: [],
      isAiStreaming: false,
      activeFindingContext: null,

      remediationResults: {},

      inventory: null,
      inventoryLoading: false,

      costs: null,
      costsLoading: false,

      metricsMap: {},
      metricsLoading: false,

      iamData: null,
      iamLoading: false,

      selectedFinding: null,
      sidebarExpanded: true,
      mockMode: true,
      cleanMode: false,

      // ── Scan actions ──────────────────────────────────────────────────
      setFindings: (findings) => set({ findings }),
      setScanStatus: (scanStatus) => set({ scanStatus }),
      setOverallScore: (overallScore) => set({ overallScore }),
      setLastScan: (id, mode, duration) =>
        set({ lastScanId: id, lastScanMode: mode, scanDuration: duration }),
      setScanHistory: (scanHistory) => set({ scanHistory }),
      markFindingRemediated: (id) =>
        set((state) => ({
          findings: state.findings.map((f) =>
            f.id === id ? { ...f, is_remediated: true } : f
          ),
        })),

      // ── Threat actions ────────────────────────────────────────────────
      addThreatEvent: (event) =>
        set((state) => ({
          threatEvents: [event, ...state.threatEvents].slice(0, 500),
          threatEventCount: state.threatEventCount + 1,
        })),
      setWsConnected: (isWsConnected) => set({ isWsConnected }),
      clearThreats: () => set({ threatEvents: [], threatEventCount: 0 }),

      // ── AI actions ────────────────────────────────────────────────────
      addChatMessage: (msg) =>
        set((state) => ({ chatMessages: [...state.chatMessages, msg] })),

      updateLastAssistantMessage: (chunk) =>
        set((state) => {
          const msgs = [...state.chatMessages]
          const last = msgs[msgs.length - 1]
          if (last?.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, content: last.content + chunk }
          }
          return { chatMessages: msgs }
        }),

      setAiStreaming: (isAiStreaming) => set({ isAiStreaming }),
      setActiveFinding: (activeFindingContext) => set({ activeFindingContext }),
      clearChat: () => set({ chatMessages: [] }),

      // ── Remediation ───────────────────────────────────────────────────
      setRemediationResult: (id, result) =>
        set((state) => ({
          remediationResults: { ...state.remediationResults, [id]: result },
        })),

      // ── Inventory ─────────────────────────────────────────────────────
      setInventory: (inventory) => set({ inventory }),
      setInventoryLoading: (inventoryLoading) => set({ inventoryLoading }),

      // ── Costs ─────────────────────────────────────────────────────────
      setCosts: (costs) => set({ costs }),
      setCostsLoading: (costsLoading) => set({ costsLoading }),

      // ── Metrics ───────────────────────────────────────────────────────
      setMetrics: (id, data) =>
        set((state) => ({ metricsMap: { ...state.metricsMap, [id]: data } })),
      setMetricsLoading: (metricsLoading) => set({ metricsLoading }),

      // ── IAM ───────────────────────────────────────────────────────────
      setIAM: (iamData) => set({ iamData }),
      setIAMLoading: (iamLoading) => set({ iamLoading }),

      // ── UI actions ────────────────────────────────────────────────────
      setSelectedFinding: (selectedFinding) => set({ selectedFinding }),
      toggleSidebar: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      setMockMode: (mockMode) => set({ mockMode }),
      setCleanMode: (cleanMode) => set({ cleanMode }),
    }),
    { name: 'vanguard-store' }
  )
)
