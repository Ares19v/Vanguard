# PREP — Vanguard ASOC (From-Scratch Study Guide)

Welcome to the **Vanguard ASOC** beginner-friendly developer study guide. This guide teaches you the security principles, SDK concepts, streaming protocols, and AI integrations behind a professional cloud security management system.

---

## 1. Cloud Security Foundations (AWS Attack Surfaces)

Vanguard scans for several critical AWS misconfigurations that attackers look for:

### S3 Public Access & ACLs (Simple Storage Service)
* **The Risk**: S3 buckets are private by default, but misconfigured Access Control Lists (ACLs) or bucket policies can make files publicly accessible to the world.
* **The Fix**: Enabling AWS "Block Public Access" at the account or bucket level.

### EC2 Security Groups (Elastic Compute Cloud)
* **The Risk**: Security groups act as virtual firewalls. Opening port `22` (SSH) or `3389` (RDP) to `0.0.0.0/0` (any IP) lets attackers attempt brute force logins from anywhere.
* **The Fix**: Restrict ports to specific trusted IP CIDR blocks (e.g. your office IP).

### Stale IAM Keys (Identity & Access Management)
* **The Risk**: Long-lived access keys that aren't rotated regularly (e.g. over 90 days old) have a higher chance of being leaked (e.g., pushed to GitHub by accident).
* **The Fix**: Regularly disable, delete, and rotate IAM credentials.

### GuardDuty & CloudTrail
* **GuardDuty**: A threat detection service that monitors accounts for malicious activity (like Bitcoin mining or unauthorized access).
* **CloudTrail**: The absolute audit trail of AWS. If CloudTrail is turned off, an attacker's actions cannot be traced.

---

## 2. Dynamic AWS SDK Ingestion with Boto3

**Boto3** is the official AWS SDK for Python. It allows developers to create, configure, and manage AWS services programmatically.

### Clients vs. Resources
* **Clients**: Provide a low-level, 1-to-1 mapping with the underlying AWS service JSON HTTP APIs. Returns raw dictionaries.
* **Resources**: Provide a high-level, object-oriented wrapper. (Clients are generally preferred in high-performance operations due to complete API coverage).

### Standard Boto3 Scan Code Pattern:
```python
import boto3
from botocore.exceptions import ClientError

def scan_s3_buckets():
    # 1. Initialize client using credentials
    s3_client = boto3.client('s3', region_name='us-east-1')
    
    try:
        # 2. Query resource metadata
        response = s3_client.list_buckets()
        for bucket in response['Buckets']:
            name = bucket['Name']
            
            # Check public block configuration
            block = s3_client.get_public_access_block(Bucket=name)
            config = block['PublicAccessBlockConfiguration']
            print(f"Bucket {name} block status: {config['BlockPublicAcls']}")
            
    except ClientError as e:
        print(f"Access Denied or API error: {e}")
```

---

## 3. Streaming Communications: WebSockets vs. SSE

Vanguard utilizes both streaming communication protocols depending on the use case.

| Feature | WebSockets | Server-Sent Events (SSE) |
|---|---|---|
| **Direction** | Bidirectional (Client ⇄ Server) | Unidirectional (Server → Client) |
| **Protocol** | custom `ws://` protocol over TCP | Standard HTTP (`text/event-stream`) |
| **Ideal For** | Live threat feeds, interactive chats | Token-by-token LLM generation, progress bars |
| **Vanguard Use** | Stream simulated port scan threats | Stream AI Gemini Consultant answers |

### Why SSE is Great for AI Streams:
Instead of waiting 10 seconds for Gemini to think and respond with a complete paragraph, the backend streams the tokens chunk-by-chunk using FastAPI's `StreamingResponse`. The user sees words typing onto their screen in real time.

---

## 4. AI Consultant Integration with Gemini

Vanguard embeds **Gemini 1.5 Pro** using the `google-generativeai` SDK.

### The Security Consulting Pipeline:
1. **Context Collection**: The backend runs the security scan and aggregates security findings (e.g., S3 bucket is public, SSH open to internet).
2. **Prompt Injection**: The findings are combined with a professional system prompt:
   ```
   SYSTEM_INSTRUCTION = "You are Vanguard's elite AI Security Consultant. Analyze these findings and output structured, actionable markdown recommendations."
   ```
3. **Execution**: The model processes the findings and returns remediation scripts (e.g. AWS CLI or Terraform code blocks).

---

## 5. Exercises & Self-Guided Challenges

1. **Write an Active Remediation Function**: Add a function inside `backend/services/remediator.py` that calls `s3_client.put_public_access_block` to programmatically secure a vulnerable bucket when a user clicks "Remediate" in Live Mode.
2. **Build a Security Group Scan Filter**: Implement a filter that ignores security groups carrying tags like `Environment=Sandbox` or `Type=Public-Facing` to reduce security finding fatigue.
3. **Add CSV Export endpoint**: Create a FastAPI endpoint `/api/v1/scan/export` that queries SQLAlchemy scan history logs, builds a CSV string, and returns it as a downloadable file response.
