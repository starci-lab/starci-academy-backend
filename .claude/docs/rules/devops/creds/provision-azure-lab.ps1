<#
  provision-azure-lab.ps1
  ---------------------------------------------------------------------------
  RUN THIS SCRIPT YOURSELF (thay) IN YOUR OWN TERMINAL, or let tro run it - it is safe
  because the `az ad sp create-for-rbac` output is captured straight into a PowerShell
  variable and NEVER printed/echoed; only length/masked confirmations are shown.

  What it does:
    1. Uses the `az` CLI (must be installed + you already ran `az login`).
    2. Creates a DEDICATED service principal "devops-lab-sp" with Contributor role scoped
       to ONE subscription (does not touch other subscriptions/tenants).
    3. Captures the generated appId/password/tenant directly into USER env vars
       (ARM_CLIENT_ID / ARM_CLIENT_SECRET / ARM_SUBSCRIPTION_ID / ARM_TENANT_ID).
    4. Waits ~30s and re-verifies the SP can see its subscription (Azure RBAC role
       assignments take a short while to propagate - this is normal, not an error).

  KNOWN GOTCHA - "AADSTS50076 ... multi-factor authentication required":
  Creating a service principal calls Microsoft Graph, and if your tenant enforces
  conditional-access MFA, a plain `az login` session sometimes isn't enough to call Graph.
  If this script fails with that error, run this ONE TIME yourself (opens a browser,
  separate from any portal.azure.com browser session - those do NOT share a login state
  with the az CLI):
      az login --tenant "<tenant-id-from-the-error-message>" --scope "https://graph.microsoft.com//.default"
  then re-run this script.

  CAVEAT - one lesson needs TENANT-ROOT / Management Group admin, which a
  subscription-scoped Contributor SP cannot do:
    - 16-azure-iam-and-security-deep/2-management-group-and-azure-policy
      (needs a role at the tenant root management group, e.g. Owner assigned by an Azure
      AD Global Administrator / tenant owner). Grant this manually via Azure Portal >
      Management Groups > Tenant Root Group > Access control (IAM) if you are the tenant
      admin, or skip that one lesson's real-cloud flow.

  Prereqs:
    - az CLI installed (https://learn.microsoft.com/cli/azure/install-azure-cli)
    - `az login` already run, with a user that can create service principals and assign
      roles on the target subscription (Owner or User Access Administrator).

  Run: powershell -NoProfile -ExecutionPolicy Bypass -File .claude\docs\rules\devops\creds\provision-azure-lab.ps1
#>

function Set-UserEnv {
    param([string]$Name, [string]$Value)
    [Environment]::SetEnvironmentVariable($Name, $Value, 'User')
    Write-Host "  - $Name : SET (len=$($Value.Length))" -ForegroundColor Green
}

$az = Get-Command az -ErrorAction SilentlyContinue
if (-not $az) {
    Write-Host "!! az CLI not found in PATH. Install it first: https://learn.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Azure lab service-principal provisioning ===" -ForegroundColor Cyan
$currentSub = (az account show --query id -o tsv)
$promptText = "Azure subscription id to use (Enter = current az default: $currentSub)"
$subId = Read-Host $promptText
if ([string]::IsNullOrWhiteSpace($subId)) { $subId = $currentSub }
if ([string]::IsNullOrWhiteSpace($subId)) {
    Write-Host "!! No subscription id given and no az default subscription set. Aborting." -ForegroundColor Red
    exit 1
}
Write-Host "Using subscription: $subId" -ForegroundColor Yellow

Write-Host ""
Write-Host "--- Creating service principal (Contributor, scoped to this subscription only) ---" -ForegroundColor Yellow
$spName = "devops-lab-sp"
$json = az ad sp create-for-rbac --name $spName --role "Contributor" --scopes "/subscriptions/$subId" -o json
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($json)) {
    Write-Host "!! az ad sp create-for-rbac failed. If the error mentions AADSTS50076 / multi-factor" -ForegroundColor Red
    Write-Host "   authentication, see the KNOWN GOTCHA in this script's header comment - you need one" -ForegroundColor Red
    Write-Host "   extra interactive 'az login --tenant ... --scope https://graph.microsoft.com//.default'" -ForegroundColor Red
    Write-Host "   run by yourself (opens a browser), then re-run this script." -ForegroundColor Red
    exit 1
}
$sp = $json | ConvertFrom-Json

Write-Host ""
Write-Host "--- Setting USER env vars (values are never echoed in full) ---" -ForegroundColor Yellow
Set-UserEnv "ARM_CLIENT_ID" $sp.appId
Set-UserEnv "ARM_CLIENT_SECRET" $sp.password
Set-UserEnv "ARM_TENANT_ID" $sp.tenant
Set-UserEnv "ARM_SUBSCRIPTION_ID" $subId

Write-Host ""
Write-Host "--- Waiting ~30s for Azure RBAC role assignment to propagate, then verifying ---" -ForegroundColor Yellow
$env:ARM_CLIENT_ID = $sp.appId
$env:ARM_CLIENT_SECRET = $sp.password
$env:ARM_TENANT_ID = $sp.tenant
$json = $null; $sp = $null

Start-Sleep -Seconds 30
az login --service-principal -u $env:ARM_CLIENT_ID -p $env:ARM_CLIENT_SECRET --tenant $env:ARM_TENANT_ID --output none
az account list --output table

Write-Host ""
Write-Host "--- Restoring your personal az CLI session for normal use ---" -ForegroundColor Yellow
az login --output none
az account show --query "{user:user.name}" -o table

Write-Host ""
Write-Host "=== DONE. Close and REOPEN your terminal / Claude Code session so the SP env is used everywhere. ===" -ForegroundColor Cyan
Write-Host "Verify: powershell -File .claude\docs\rules\devops\creds\verify-devops-creds.ps1" -ForegroundColor DarkGray
