# 🚀 Vanguard — AWS Account Setup Guide

This guide walks you through connecting Vanguard ASOC to your real AWS account.
By default, Vanguard runs in **Mock Mode** (no real API calls). Follow these steps to go live.

---

## Step 1: Create a Dedicated IAM User

> ⚠️ **Never use your AWS root account credentials.** Create a dedicated IAM user instead.

1. Go to **AWS Console → IAM → Users → Create User**
2. Name it `vanguard-bot` (or any name you prefer)
3. Select **"Attach policies directly"**
4. Attach the following AWS-managed policies:

   | Policy | Purpose |
   |---|---|
   | `ReadOnlyAccess` | EC2/RDS inventory, CloudWatch metrics |
   | `IAMReadOnlyAccess` | IAM user and role scanning |
   | `AWSCostAndUsageReportAutomationPolicy` | Cost and usage data |

5. Click **Create User**
6. Open the user → **Security credentials** tab → **Create access key**
7. Choose **"Application running outside AWS"**
8. **Download the CSV immediately** — the secret key is only shown once.

---

## Step 2: Configure Your `.env` File

Open `backend/.env` (copy from `backend/.env.example` if it doesn't exist) and update the following:

```env
# ── Mode ──────────────────────────────────────────────────────────
# Flip MOCK_MODE to false to enable real AWS API calls
MOCK_MODE=false

# Keep DRY_RUN=true until you're confident — prevents real remediations from executing
DRY_RUN=true

# ── AWS Credentials ───────────────────────────────────────────────
AWS_ACCESS_KEY_ID=AKIA...your_key_here...
AWS_SECRET_ACCESS_KEY=your_secret_key_here...
AWS_DEFAULT_REGION=ap-south-1    # Change to your region (e.g. us-east-1, eu-west-1)
# AWS_SESSION_TOKEN=             # Only needed for temporary/STS credentials

# ── Gemini AI ─────────────────────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key_here

# ── Auth ──────────────────────────────────────────────────────────
# Generate a strong secret: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET=change_me_in_production

# ── Database ──────────────────────────────────────────────────────
DATABASE_URL=sqlite:///./vanguard.db
```

### Common AWS Regions

| Region | Code |
|---|---|
| US East (N. Virginia) | `us-east-1` |
| US West (Oregon) | `us-west-2` |
| Asia Pacific (Mumbai) | `ap-south-1` |
| Europe (Ireland) | `eu-west-1` |
| Asia Pacific (Singapore) | `ap-southeast-1` |

---

## Step 3: Restart the Application

**With Docker (recommended):**
```bash
docker-compose down
docker-compose up --build
```

**Without Docker (bare Python):**
```bash
cd backend
# Stop the existing server, then restart:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Step 4: Verify the Connection

1. Check the health endpoint:
   ```
   http://localhost:8000/health
   ```

2. Open the Vanguard UI at `http://localhost:5173`

3. Navigate to **Connect** and confirm your AWS account details appear

4. Check these sections for live data:
   - **Dashboard** — real resource counts and alerts
   - **Inventory** — your actual EC2, RDS, S3 resources
   - **Costs** — real billing data from Cost Explorer
   - **Metrics** — live CloudWatch graphs

---

## Step 5: Tighten Permissions (Recommended)

Instead of the broad `ReadOnlyAccess` policy, create a **custom least-privilege IAM policy** scoped to only what Vanguard needs.

### Create the policy in AWS Console → IAM → Policies → Create Policy → JSON tab:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2ReadAccess",
      "Effect": "Allow",
      "Action": ["ec2:Describe*"],
      "Resource": "*"
    },
    {
      "Sid": "RDSReadAccess",
      "Effect": "Allow",
      "Action": ["rds:Describe*", "rds:ListTagsForResource"],
      "Resource": "*"
    },
    {
      "Sid": "S3ReadAccess",
      "Effect": "Allow",
      "Action": ["s3:ListAllMyBuckets", "s3:GetBucketLocation", "s3:GetBucketPolicy", "s3:GetBucketAcl", "s3:GetBucketPublicAccessBlock"],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchReadAccess",
      "Effect": "Allow",
      "Action": ["cloudwatch:GetMetricStatistics", "cloudwatch:ListMetrics", "cloudwatch:DescribeAlarms"],
      "Resource": "*"
    },
    {
      "Sid": "CostExplorerReadAccess",
      "Effect": "Allow",
      "Action": ["ce:GetCostAndUsage", "ce:GetCostForecast", "ce:GetDimensionValues"],
      "Resource": "*"
    },
    {
      "Sid": "IAMReadAccess",
      "Effect": "Allow",
      "Action": ["iam:ListUsers", "iam:ListRoles", "iam:ListPolicies", "iam:GetUser", "iam:GetRole", "iam:ListAttachedUserPolicies", "iam:ListUserPolicies", "iam:GenerateCredentialReport", "iam:GetCredentialReport"],
      "Resource": "*"
    }
  ]
}
```

Name it `VanguardASOCPolicy` and attach it to your `vanguard-bot` user in place of `ReadOnlyAccess`.

---

## DRY_RUN Mode Explained

| Setting | Behaviour |
|---|---|
| `DRY_RUN=true` | Vanguard **shows** recommended remediations but does **not** execute them. Safe for exploration. |
| `DRY_RUN=false` | Vanguard **executes** remediations (e.g. stopping idle instances, rotating keys). Use with caution. |

> 💡 Always test with `DRY_RUN=true` first. Only set `false` once you've reviewed the suggested actions and are confident in the results.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `NoCredentialsError` | Check `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env` |
| `AccessDenied` errors | Ensure the IAM user has the required policies attached |
| No cost data showing | Cost Explorer may take up to 24h to populate for new accounts |
| Wrong region data | Verify `AWS_DEFAULT_REGION` matches where your resources are deployed |
| Mock data still showing | Confirm `MOCK_MODE=false` in `.env` and restart the backend |

---

## Security Reminders

- ✅ Never commit your `.env` file (it's in `.gitignore`)
- ✅ Rotate your IAM access keys every 90 days
- ✅ Use the least-privilege custom policy above instead of `ReadOnlyAccess`
- ✅ Enable MFA on your AWS root account
- ✅ Monitor IAM activity in **AWS CloudTrail**
