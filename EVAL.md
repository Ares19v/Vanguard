# EVAL — Vanguard ASOC

> **Evaluation Date:** 2026-05-29
> **Evaluator:** Automated Portfolio Review
> **Maturity Level:** Production-Ready (Maturity Score: 9/10)

---

## 1. Project Purpose & Problem Statement

Vanguard ASOC (Automated Security Operations Center) is an advanced cloud security platform designed to automate cloud security posture management (CSPM) for AWS. It solves the critical operational challenge of detecting and remediating security misconfigurations across various AWS resources (S3 ACLs, IAM stale keys, EC2 open security groups, public RDS databases, missing CloudTrail trails, and GuardDuty findings).

By introducing a dual-mode engine—**Mock Mode** (zero credentials, fully simulated interface) and **Live Mode** (direct API calls using `boto3`)—along with a "dry-run" safety-first remediation system, Vanguard provides a secure sandbox for administrators to evaluate cloud security changes prior to commit.

---

## 2. Technical Architecture

Vanguard is structured with a robust FastAPI backend and a React/TypeScript frontend:

- **Backend Architecture (FastAPI + Python 3.11):**
  - **`boto3` Integration:** Direct mapping to AWS IAM, EC2, RDS, S3, CloudTrail, GuardDuty, CloudWatch, and AWS Cost Explorer APIs.
  - **Auto-Remediation:** Modifies resources programmatically based on user selection, with visual diff generation beforehand.
  - **Live Threat Intel Feed:** Simulates real-time threat detection (port scans, C2 beacons, exfiltration) and pushes logs down a persistent connection using WebSockets (`/api/v1/threats/stream`).
  - **AI security consultant:** Integrates Google's Gemini 1.5 Pro to provide contextual, streamed advisory comments via Server-Sent Events (SSE) based on discovered vulnerabilities.
  - **Audit Logging:** SQLite database managed by SQLAlchemy stores historically completed scans and remediation activities.
- **Frontend Architecture (React 19 + TypeScript + Zustand):**
  - **Zustand:** Ultra-clean, modular global state container managing client routing, scan statuses, inventories, and settings.
  - **Framer Motion & Recharts:** High-fidelity animations, responsive risk rings, and historical trend lines.
  - **Production Docker Setup:** Multi-stage builds (Non-root `appuser` backend container and Nginx-powered frontend serving statically pre-rendered assets).

---

## 3. Strengths

- **High-Quality "Mock Mode" Implementation:** The simulated mock data behaves exactly like live AWS API responses, allowing seamless local evaluation.
- **Remediation Safety-First Design:** The "Dry Run" system generates a standard code diff visualizer (`DiffViewer`) on the frontend, giving operators reassurance prior to execution.
- **SSE & WebSockets Integration:** Delivers token-by-token streaming AI explanations alongside real-time live threat updates.
- **Boto3 API Coverage:** Covers S3 public access settings, EC2 security group rules, RDS visibility, IAM access key age tracking, CloudTrail status, and GuardDuty alerts in one dashboard.
- **Nginx Natively Configured:** Features standard Docker production practices (serving assets under `/` and routing `/api/` cleanly to Uvicorn).

---

## 4. Limitations & Known Gaps

- **Lack of Multi-Region Aggregation:** The application scans the default region specified by `AWS_DEFAULT_REGION` (e.g. `us-east-1`). Security operations often require a aggregate view of all active AWS regions globally.
- **No IAM Session Auths:** Requires long-lived access key and secret in the `.env` file instead of supporting AWS dynamic profiles, STS assume-role structures, or AWS SSO profiles.
- **Single DB Deployment (SQLite):** Although appropriate for audit logging locally, PostgreSQL would be required if scaled to multi-tenant or cluster environments.

---

## 5. Code Quality Assessment

- **Structure:** Exemplary layout, separating FastAPI routers, schemas, services, database models, and Pytest suites.
- **Typing:** Extensive TypeScript validation on the frontend and Pydantic validation on the backend.
- **Security:** Standard non-root Docker execution prevents privilege escalation inside clusters.

---

## 6. Maturity Breakdown

| Dimension | Score | Notes |
|-----------|-------|-------|
| Functionality | 9/10 | Impressive features: Boto3, Gemini integration, WebSockets, costs, and IAM. |
| Code Quality | 9/10 | Exceptional type-safety, modularity, and clean design patterns. |
| Documentation | 8/10 | Robust installation instructions with clear `AWS_SETUP.md` for AWS provisioning. |
| Scalability | 7/10 | Limited by SQLite backend and single-region Boto3 scans, easily extended to PostgreSQL. |
| Security | 9/10 | Uses strict minimum IAM statements, dry-run locks, and non-root Docker builds. |
| **Overall** | **8.4/10** | **Outstanding engineering.** Highly mature, excellent portfolio showcase piece for AWS Security Operations. |

---

## 7. Suggested Next Steps

1. **Implement Multi-Region Scans:** Modify `aws_scanner.py` to loop through active regions (e.g. `ec2.describe_regions()`) to detect global shadow instances.
2. **Support IAM Role Assumption:** Extend backend connection logic to support `sts:AssumeRole` so the server can authenticate using temporary AWS STS credentials.
3. **Migrate to Alembic & PostgreSQL:** Add Alembic migrations and abstract the database URL dynamically using PostgreSQL to handle enterprise deployments.

---

<p align="center">Made by Devansh Tyagi @ 2026</p>
