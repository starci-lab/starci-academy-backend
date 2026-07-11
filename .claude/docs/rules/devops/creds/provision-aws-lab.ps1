<#
  provision-aws-lab.ps1
  ---------------------------------------------------------------------------
  RUN THIS SCRIPT YOURSELF (thay) IN YOUR OWN TERMINAL, or let tro run it - it is safe
  because sensitive output from `aws iam create-access-key` is captured straight into a
  PowerShell variable and NEVER printed/echoed; only length/masked confirmations are shown.

  What it does (uses the CURRENT AWS_ACCESS_KEY_ID/SECRET already in your env, which on
  a brand new machine is usually the ROOT account bootstrapped per README.md, to create
  a proper IAM user):
    1. Confirms the currently active credential really is root (safety check). If it is
       already an IAM user/role, does nothing and exits (idempotent).
    2. Creates a dedicated IAM user "devops-lab-user" (skips if it already exists).
    3. Attaches AdministratorAccess to it (pragmatic for running the WHOLE course across
       EC2/VPC/RDS/DynamoDB/S3/IAM/Organizations/KMS/SecretsManager/etc - this is NOT
       least-privilege, it is a lab/break-glass account; least-privilege IS the pedagogical
       content of the lessons themselves, not a constraint on the grading harness's own
       account).
    4. Creates a NEW access key for that user (skips if the user already has 2 keys - AWS
       max; delete an old one first if you need a fresh key).
    5. Overwrites AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in USER env with the new IAM
       user's key (root key is no longer used going forward).
    6. Asks whether to DELETE the root access key now (AWS best practice: root should not
       have a long-lived access key at all). Optional, your call.
    7. Re-verifies identity with the new key inside this same script run.

  CAVEAT: lesson 5-aws-iam-and-security-deep/2-organizations-scp calls
  `organizations:CreateOrganization` to bootstrap AWS Organizations for the first time.
  AWS restricts a couple of these bootstrap actions to the account's ROOT user by design
  (not something a policy grant can unlock) UNLESS Organizations is already enabled on
  this account. If that one lesson's apply fails with AccessDenied specifically on
  CreateOrganization, that step needs root - every other Organizations/SCP action (create
  OU, attach SCP, etc.) works fine as the IAM user once Organizations is enabled.

  Prereqs:
    - aws CLI installed (https://aws.amazon.com/cli/)
    - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY already set (see README.md "Bootstrap AWS
      lan dau" if this is a brand new machine/account with no key at all yet).

  Run: powershell -NoProfile -ExecutionPolicy Bypass -File .claude\docs\rules\devops\creds\provision-aws-lab.ps1
#>

function Set-UserEnv {
    param([string]$Name, [string]$Value)
    [Environment]::SetEnvironmentVariable($Name, $Value, 'User')
    Write-Host "  - $Name : SET (len=$($Value.Length))" -ForegroundColor Green
}

$awsCli = Get-Command aws -ErrorAction SilentlyContinue
if (-not $awsCli) {
    Write-Host "!! aws CLI not found in PATH. Install it first: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== AWS lab IAM user provisioning ===" -ForegroundColor Cyan
Write-Host "--- Step 1: confirm current credential is root ---" -ForegroundColor Yellow
$identityJson = aws sts get-caller-identity --output json
if ($LASTEXITCODE -ne 0) {
    Write-Host "!! Could not call sts get-caller-identity - is AWS_ACCESS_KEY_ID/SECRET set? See README.md Bootstrap section." -ForegroundColor Red
    exit 1
}
$identity = $identityJson | ConvertFrom-Json
Write-Host "  Current identity: $($identity.Arn)" -ForegroundColor DarkGray

$rootKeyId = $env:AWS_ACCESS_KEY_ID
$isRoot = $identity.Arn -like "*:root"
if (-not $isRoot) {
    Write-Host "  Current credential is already an IAM user/role (not root) - nothing to do. Exiting." -ForegroundColor Green
    exit 0
}
$accountId = $identity.Account
Write-Host "  Confirmed: this IS the root account ($accountId). Proceeding to create a dedicated IAM user." -ForegroundColor Yellow

Write-Host ""
Write-Host "--- Step 2: create IAM user 'devops-lab-user' (skips if it exists) ---" -ForegroundColor Yellow
$userName = "devops-lab-user"
aws iam get-user --user-name $userName 2>$null 1>$null
if ($LASTEXITCODE -ne 0) {
    aws iam create-user --user-name $userName | Out-Null
    Write-Host "  created IAM user: $userName" -ForegroundColor Green
} else {
    Write-Host "  IAM user already exists: $userName" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "--- Step 3: attach AdministratorAccess (pragmatic for the whole course) ---" -ForegroundColor Yellow
aws iam attach-user-policy --user-name $userName --policy-arn "arn:aws:iam::aws:policy/AdministratorAccess" | Out-Null
Write-Host "  attached AdministratorAccess to $userName" -ForegroundColor DarkGray

Write-Host ""
Write-Host "--- Step 4: create a new access key for this user ---" -ForegroundColor Yellow
$existingKeys = aws iam list-access-keys --user-name $userName --query "AccessKeyMetadata[].AccessKeyId" --output text
if (-not [string]::IsNullOrWhiteSpace($existingKeys)) {
    Write-Host "  $userName already has access key(s) (AWS allows max 2 per user)." -ForegroundColor DarkGray
    Write-Host "  Not creating a new one automatically. To force a fresh key, delete an old one first:" -ForegroundColor DarkGray
    Write-Host "    aws iam delete-access-key --user-name $userName --access-key-id <ID>" -ForegroundColor DarkGray
    Write-Host "  Skipping the env overwrite step - re-run after cleaning up keys if you want a brand new one." -ForegroundColor Yellow
    exit 0
}
$newKeyJson = aws iam create-access-key --user-name $userName --output json
$newKey = $newKeyJson | ConvertFrom-Json

Write-Host ""
Write-Host "--- Step 5: overwrite USER env with the new IAM user key (root key no longer used) ---" -ForegroundColor Yellow
Set-UserEnv "AWS_ACCESS_KEY_ID" $newKey.AccessKey.AccessKeyId
Set-UserEnv "AWS_SECRET_ACCESS_KEY" $newKey.AccessKey.SecretAccessKey

Write-Host ""
Write-Host "--- Step 6: delete the ROOT access key now? (AWS best practice: root should have no long-lived key) ---" -ForegroundColor Yellow
$confirm = Read-Host "Type YES to delete the root access key ($rootKeyId) now, or anything else to keep it"
if ($confirm -eq "YES") {
    aws iam delete-access-key --access-key-id $rootKeyId
    Write-Host "  root access key deleted." -ForegroundColor Green
} else {
    Write-Host "  root access key left as-is - you can delete it later from the IAM Console > My security credentials." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "--- Step 7: verify the new identity (using the new key in THIS script's process only) ---" -ForegroundColor Yellow
$env:AWS_ACCESS_KEY_ID = $newKey.AccessKey.AccessKeyId
$env:AWS_SECRET_ACCESS_KEY = $newKey.AccessKey.SecretAccessKey
Start-Sleep -Seconds 5
aws sts get-caller-identity

# best-effort clear plaintext copies from this process
$newKeyJson = $null
$newKey = $null

Write-Host ""
Write-Host "=== DONE. Close and REOPEN your terminal / Claude Code session so the new key is used everywhere. ===" -ForegroundColor Cyan
Write-Host "Verify: powershell -File .claude\docs\rules\devops\creds\verify-devops-creds.ps1" -ForegroundColor DarkGray
