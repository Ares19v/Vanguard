"""
Vanguard ASOC — Mock IAM Explorer data
"""

from __future__ import annotations

from datetime import datetime, timedelta

from models.schemas import IAMResponse, IAMRole, IAMUser, PasswordPolicy

_NOW = datetime.utcnow()

MOCK_IAM_USERS: list[IAMUser] = [
    IAMUser(
        user_id="AIDAIOSFODNN7EXAMPLE01",
        username="devansh.tyagi",
        arn="arn:aws:iam::123456789012:user/devansh.tyagi",
        created_at=datetime(2023, 3, 10),
        last_login=_NOW - timedelta(hours=2),
        console_access=True,
        mfa_enabled=True,
        access_keys=[
            {"key_id": "AKIA1234EXAMPLE0001", "status": "Active",
             "created": "2024-01-15", "last_used": (_NOW - timedelta(days=1)).strftime("%Y-%m-%d")},
        ],
        attached_policies=["AdministratorAccess"],
        groups=["Admins"],
        is_admin=True,
        tags={"Team": "platform"},
    ),
    IAMUser(
        user_id="AIDAIOSFODNN7EXAMPLE02",
        username="svc-deploy-legacy",
        arn="arn:aws:iam::123456789012:user/svc-deploy-legacy",
        created_at=datetime(2022, 8, 5),
        last_login=None,
        console_access=False,
        mfa_enabled=False,
        access_keys=[
            {"key_id": "AKIAIOSFODNN7EXAMPLE", "status": "Active",
             "created": "2022-08-05", "last_used": (_NOW - timedelta(days=183)).strftime("%Y-%m-%d")},
        ],
        attached_policies=["AmazonS3FullAccess", "AWSCodeDeployFullAccess"],
        groups=[],
        is_admin=False,
        tags={"Purpose": "ci-cd-legacy"},
    ),
    IAMUser(
        user_id="AIDAIOSFODNN7EXAMPLE03",
        username="dev-contractor-01",
        arn="arn:aws:iam::123456789012:user/dev-contractor-01",
        created_at=datetime(2024, 6, 1),
        last_login=_NOW - timedelta(days=2),
        console_access=True,
        mfa_enabled=False,
        access_keys=[
            {"key_id": "AKIA5678EXAMPLE0003", "status": "Active",
             "created": "2024-06-01", "last_used": (_NOW - timedelta(days=2)).strftime("%Y-%m-%d")},
        ],
        attached_policies=["IAMFullAccess", "AdministratorAccess"],
        groups=["Contractors"],
        is_admin=True,
        tags={"Team": "external"},
    ),
    IAMUser(
        user_id="AIDAIOSFODNN7EXAMPLE04",
        username="data-analyst-priya",
        arn="arn:aws:iam::123456789012:user/data-analyst-priya",
        created_at=datetime(2024, 2, 20),
        last_login=_NOW - timedelta(days=1),
        console_access=True,
        mfa_enabled=True,
        access_keys=[],
        attached_policies=["AmazonAthenaFullAccess", "AmazonS3ReadOnlyAccess"],
        groups=["DataTeam"],
        is_admin=False,
        tags={"Team": "data"},
    ),
    IAMUser(
        user_id="AIDAIOSFODNN7EXAMPLE05",
        username="svc-monitoring",
        arn="arn:aws:iam::123456789012:user/svc-monitoring",
        created_at=datetime(2023, 1, 15),
        last_login=None,
        console_access=False,
        mfa_enabled=False,
        access_keys=[
            {"key_id": "AKIA9012EXAMPLE0005", "status": "Active",
             "created": "2023-01-15", "last_used": (_NOW - timedelta(hours=1)).strftime("%Y-%m-%d")},
        ],
        attached_policies=["CloudWatchReadOnlyAccess", "AmazonEC2ReadOnlyAccess"],
        groups=["ServiceAccounts"],
        is_admin=False,
        tags={"Purpose": "cloudwatch-agent"},
    ),
]

MOCK_IAM_ROLES: list[IAMRole] = [
    IAMRole(
        role_id="AROAIOSFODNN7ROLE0001",
        role_name="EC2-S3ReadRole",
        arn="arn:aws:iam::123456789012:role/EC2-S3ReadRole",
        description="Grants EC2 instances read access to specific S3 buckets",
        created_at=datetime(2023, 4, 1),
        trust_policy_principals=["ec2.amazonaws.com"],
        attached_policies=["AmazonS3ReadOnlyAccess"],
        last_used=_NOW - timedelta(hours=3),
        tags={"Env": "production"},
    ),
    IAMRole(
        role_id="AROAIOSFODNN7ROLE0002",
        role_name="EC2-FullAccess-Role",
        arn="arn:aws:iam::123456789012:role/EC2-FullAccess-Role",
        description="OVERPRIVILEGED — grants full EC2 + S3 + RDS access",
        created_at=datetime(2022, 11, 10),
        trust_policy_principals=["ec2.amazonaws.com"],
        attached_policies=["AmazonEC2FullAccess", "AmazonS3FullAccess", "AmazonRDSFullAccess"],
        last_used=_NOW - timedelta(minutes=15),
        tags={"Env": "production", "Risk": "overprivileged"},
    ),
    IAMRole(
        role_id="AROAIOSFODNN7ROLE0003",
        role_name="LambdaS3Role",
        arn="arn:aws:iam::123456789012:role/LambdaS3Role",
        description="Lambda execution role with S3 put/get",
        created_at=datetime(2024, 1, 8),
        trust_policy_principals=["lambda.amazonaws.com"],
        attached_policies=["AmazonS3FullAccess", "CloudWatchLogsFullAccess"],
        last_used=_NOW - timedelta(minutes=5),
        tags={"Team": "platform"},
    ),
    IAMRole(
        role_id="AROAIOSFODNN7ROLE0004",
        role_name="GithubActionsOIDCRole",
        arn="arn:aws:iam::123456789012:role/GithubActionsOIDCRole",
        description="OIDC role for GitHub Actions CI/CD deployments",
        created_at=datetime(2024, 3, 22),
        trust_policy_principals=["token.actions.githubusercontent.com"],
        attached_policies=["AmazonECR-FullAccess", "AWSCodeDeployFullAccess"],
        last_used=_NOW - timedelta(days=1),
        tags={"Purpose": "cicd"},
    ),
    IAMRole(
        role_id="AROAIOSFODNN7ROLE0005",
        role_name="WorkerNode-Role",
        arn="arn:aws:iam::123456789012:role/WorkerNode-Role",
        description="EKS worker node role",
        created_at=datetime(2024, 2, 14),
        trust_policy_principals=["ec2.amazonaws.com"],
        attached_policies=["AmazonEKSWorkerNodePolicy", "AmazonEC2ContainerRegistryReadOnly"],
        last_used=_NOW - timedelta(minutes=30),
        tags={"Env": "production"},
    ),
]

MOCK_PASSWORD_POLICY = PasswordPolicy(
    minimum_length=8,
    require_uppercase=False,
    require_lowercase=False,
    require_numbers=True,
    require_symbols=False,
    max_age_days=None,
    prevent_reuse=None,
    hard_expiry=False,
)


def get_mock_iam() -> IAMResponse:
    users_no_mfa = sum(1 for u in MOCK_IAM_USERS if not u.mfa_enabled)
    admins = sum(1 for u in MOCK_IAM_USERS if u.is_admin)
    console_no_mfa = sum(1 for u in MOCK_IAM_USERS if u.console_access and not u.mfa_enabled)
    return IAMResponse(
        account_id="123456789012",
        users=MOCK_IAM_USERS,
        roles=MOCK_IAM_ROLES,
        password_policy=MOCK_PASSWORD_POLICY,
        total_users=len(MOCK_IAM_USERS),
        users_without_mfa=users_no_mfa,
        admin_users=admins,
        users_with_console_no_mfa=console_no_mfa,
        mode="mock",
    )
