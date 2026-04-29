<div align="center">

# 🛡️ Vanguard ASOC

### Automated Security Operations Center

**Real-time AWS security posture scanning · AI-driven auto-remediation · Live threat intelligence · Gemini 1.5 Pro security consultant**

[![CI](https://github.com/Ares19v/Vanguard/actions/workflows/ci.yml/badge.svg)](https://github.com/Ares19v/Vanguard/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22c55e)

</div>

---

## 🎯 What Is Vanguard?

Vanguard is a **production-grade cloud security platform** that gives you a complete, real-time picture of your AWS attack surface — with the power to fix problems instantly, or preview every change before it happens.

Run it in **Mock Mode** to explore the full UI without any AWS credentials, or flip one env variable to connect to your real account.

---

## ✨ Features

| Module | What It Does |
|---|---|
| **🔍 AWS Scanner** | Scans S3 ACLs, IAM stale keys, EC2 open security groups, public RDS, CloudTrail gaps, GuardDuty findings |
| **⚡ Auto-Remediator** | One-click fixes with dry-run mode — see the exact before/after diff before touching anything live |
| **📡 Live Threat Feed** | WebSocket-streamed network events: port scans, brute force attempts, C2 beacons, data exfiltration |
| **🤖 AI Consultant** | Gemini 1.5 Pro streaming chat — inject any finding as context for hyper-specific remediation advice |
| **📊 Risk Dashboard** | CVSS-style scoring with animated ring, area chart trend, and service breakdown |
| **🗄️ Scan History** | SQLite-backed audit trail with CSV export — every scan permanently logged |
| **📦 Resource Inventory** | Full EC2, RDS, S3 inventory with filtering, tagging, and status overview |
| **💰 Cost Dashboard** | AWS Cost Explorer integration — breakdowns by service, region, and forecast |
| **🔑 IAM Explorer** | User and role analysis with access key age tracking and permission insights |
| **📈 CloudWatch Metrics** | CPU, network I/O, disk IOPS charts per resource with configurable time ranges |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Vanguard ASOC                           │
├──────────────────────┬───────────────────────────────────────┤
│  React + Vite (5173) │  FastAPI + Uvicorn (8000)             │
│                      │                                       │
│  ├─ Dashboard        │  ├─ GET/POST /api/v1/scan             │
│  ├─ Scanner          │  ├─ GET      /api/v1/scan/stream (SSE)│
│  ├─ Threat Feed      │  ├─ WS       /api/v1/threats/stream   │
│  ├─ Remediator       │  ├─ POST     /api/v1/remediate        │
│  ├─ AI Consultant    │  ├─ POST     /api/v1/ai/chat    (SSE) │
│  ├─ Inventory        │  ├─ GET      /api/v1/inventory        │
│  ├─ Cost Dashboard   │  ├─ GET      /api/v1/costs            │
│  ├─ IAM Explorer     │  ├─ GET      /api/v1/iam              │
│  └─ Metrics          │  └─ GET      /api/v1/metrics          │
│                      │                                       │
│  Zustand · Recharts  │  boto3 (AWS SDK)                      │
│  Framer Motion       │  google-generativeai (Gemini)         │
│  WebSocket client    │  SQLAlchemy + SQLite                  │
└──────────────────────┴───────────────────────────────────────┘
             Docker Compose — nginx + uvicorn
```

---

## 🚀 Quick Start

### Option A — Docker (recommended, one command)

```bash
# 1. Clone
git clone https://github.com/Ares19v/Vanguard.git
cd Vanguard

# 2. Configure
cp backend/.env.example backend/.env
#    Edit backend/.env — add your GEMINI_API_KEY

# 3. Launch
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API Docs | http://localhost:8000/api/docs |
| Health Check | http://localhost:8000/health |

### Option B — Windows (double-click)

```
INSTALL.bat       ← first time only
Run_Project.bat   ← every time after that
```

`Run_Project.bat` auto-detects Docker. If Docker is running it uses `docker compose`; otherwise it creates a Python venv, installs deps, and launches both services in separate terminal windows — then opens the browser automatically.

### Option C — macOS / Linux

```bash
chmod +x start.sh
./start.sh
```

### Option D — Manual (two terminals)

```bash
# Terminal 1 — Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env    # edit as needed
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values below.

| Variable | Default | Required | Description |
|---|---|---|---|
| `MOCK_MODE` | `true` | — | `true` = simulated data, `false` = real AWS API calls |
| `DRY_RUN` | `true` | — | `true` = preview remediations only, `false` = execute them |
| `AWS_ACCESS_KEY_ID` | — | Live mode | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | — | Live mode | IAM user secret key |
| `AWS_DEFAULT_REGION` | `us-east-1` | — | AWS region to scan |
| `GEMINI_API_KEY` | — | AI features | Get one at [aistudio.google.com](https://aistudio.google.com) |
| `JWT_SECRET` | — | Always | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | SQLite | — | SQLite by default, swap to a PostgreSQL DSN for production |

> **Connecting to real AWS?** See [`AWS_SETUP.md`](AWS_SETUP.md) for a step-by-step IAM guide.

---

## 🔐 Minimum AWS IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:ListAllMyBuckets", "s3:GetPublicAccessBlock", "s3:GetBucketAcl", "s3:GetBucketPolicy",
      "iam:ListUsers", "iam:ListAccessKeys", "iam:GetAccessKeyLastUsed",
      "ec2:DescribeSecurityGroups", "ec2:DescribeInstances",
      "rds:DescribeDBInstances",
      "cloudtrail:DescribeTrails", "cloudtrail:GetTrailStatus",
      "guardduty:ListDetectors", "guardduty:ListFindings", "guardduty:GetFindings",
      "cloudwatch:GetMetricStatistics", "cloudwatch:ListMetrics",
      "ce:GetCostAndUsage", "ce:GetCostForecast",
      "sts:GetCallerIdentity"
    ],
    "Resource": "*"
  }]
}
```

For write access (auto-remediation with `DRY_RUN=false`), add the relevant write permissions per service.

---

## 📁 Project Structure

```
Vanguard/
├── backend/
│   ├── main.py              # FastAPI entry point + lifespan
│   ├── config.py            # pydantic-settings — all env vars
│   ├── routers/             # scan, remediate, threats, ai_consultant,
│   │                        # inventory, costs, metrics, iam_explorer, settings
│   ├── services/            # aws_scanner, mock_*, remediator,
│   │                        # threat_engine, gemini_client, risk_scorer
│   ├── models/schemas.py    # All Pydantic response models
│   ├── db/                  # SQLAlchemy ORM + SQLite migrations
│   ├── tests/               # pytest test suite
│   ├── Dockerfile           # Multi-stage Python image (non-root)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Scanner, ThreatFeed, Remediator,
│   │   │                    # AIConsultant, Inventory, Costs, IAM, Metrics
│   │   ├── components/      # Sidebar, RiskRing, FindingCard, DiffViewer
│   │   ├── hooks/           # useScan, useWebSocket, useAI
│   │   └── store/           # Zustand global state
│   ├── nginx.conf           # Reverse proxy config for Docker
│   └── Dockerfile           # Multi-stage build (node → nginx:alpine)
├── docker-compose.yml
├── Run_Project.bat          # Windows launcher (auto-detects Docker)
├── INSTALL.bat              # First-time Windows setup
├── UNINSTALL.bat            # Clean teardown
├── start.sh                 # macOS / Linux launcher
├── AWS_SETUP.md             # Step-by-step AWS connection guide
└── .github/workflows/ci.yml # GitHub Actions CI (Python + Node)
```

---

## 🧠 Technical Decisions

| Decision | Rationale |
|---|---|
| **Mock mode default** | Safe to demo anywhere without credentials — zero barrier to entry |
| **FastAPI + async** | Native SSE + WebSocket support, auto-generated OpenAPI docs |
| **CVSS-inspired scoring** | Demonstrates security standards knowledge to reviewers |
| **Dry-run default** | "Break glass" safety — nothing changes unless you explicitly confirm |
| **SQLite audit trail** | Compliance thinking — every scan is permanently logged |
| **Gemini streaming SSE** | Modern LLM API pattern: token-by-token streaming, not waiting for full response |
| **Zustand** | Typed, lightweight, zero boilerplate — beats Redux for a project this size |
| **nginx reverse proxy** | Production Docker pattern — static files served by nginx, API calls proxied to uvicorn |
| **Non-root Docker user** | Security best practice — container process runs as `appuser`, not root |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © 2025 [Devansh Tyagi](https://github.com/Ares19v)

<!-- ci-trigger -->
