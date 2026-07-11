<#
  provision-gcp-lab.ps1
  ---------------------------------------------------------------------------
  RUN THIS SCRIPT YOURSELF (thay) IN YOUR OWN TERMINAL, or let tro run it - it is safe:
  if a service-account key CAN be created, it is written straight to a local file (never
  printed); if key creation is blocked (common on personal-account projects, see below),
  the script falls back to telling you to run `gcloud auth application-default login`
  (ADC) - an interactive browser step that only you can complete.

  What it does:
    1. Uses the `gcloud` CLI (must be installed + you already ran `gcloud auth login`).
    2. Enables the core APIs the course lessons call - ONE AT A TIME (a single batched
       `gcloud services enable a b c ...` call can fail with a misleading
       PERMISSION_DENIED for the WHOLE batch even when every API individually succeeds -
       a known gcloud quirk; enabling one by one avoids it and tells you exactly which
       one is genuinely blocked, if any).
    3. Creates a DEDICATED service account "devops-lab-sa" in the target project (does
       NOT touch any other identity in your GCP org) and grants it project-scoped roles.
    4. Tries to create a JSON key. If it fails with FAILED_PRECONDITION /
       constraints/iam.disableServiceAccountKeyCreation (Google's default Org Policy on
       many projects, cannot be overridden at project scope even as Owner - confirmed by
       testing `gcloud resource-manager org-policies disable-enforce` here, it does NOT
       help), the script prints clear instructions to use ADC instead and sets
       GOOGLE_PROJECT so you only need to run the ADC login step yourself.

  CAVEAT - two lessons need ORGANIZATION-level admin, which this script (project-scoped)
  cannot grant:
    - 12-gcp-iam-and-security-deep/2-org-policy-and-folders (needs Org Policy Admin +
      Folder Admin on the Organization node)
    - 12-gcp-iam-and-security-deep/1-service-account-impersonation-and-federation
      (Workload Identity Federation pool needs iam.workloadIdentityPoolAdmin, usually
      fine at project scope, but double-check if it errors)
  If you are the GCP Organization Admin yourself, you can grant those roles manually via
  the Console (IAM & Admin > IAM, switch scope to the Organization node).

  Prereqs:
    - gcloud CLI installed (https://cloud.google.com/sdk/docs/install)
    - `gcloud auth login` already run, with a user that can create service accounts and
      grant IAM roles on the target project (Owner or roles/iam.admin +
      roles/resourcemanager.projectIamAdmin).

  Run: powershell -NoProfile -ExecutionPolicy Bypass -File .claude\docs\rules\devops\creds\provision-gcp-lab.ps1
#>

function Set-UserEnv {
    param([string]$Name, [string]$Value)
    [Environment]::SetEnvironmentVariable($Name, $Value, 'User')
    Write-Host "  - $Name : SET (len=$($Value.Length))" -ForegroundColor Green
}

$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloud) {
    Write-Host "!! gcloud CLI not found in PATH. Install it first: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== GCP lab service-account provisioning ===" -ForegroundColor Cyan
$currentProject = (gcloud config get-value project 2>$null)
$promptText = "GCP project id to use (Enter = current gcloud config: $currentProject)"
$projectId = Read-Host $promptText
if ([string]::IsNullOrWhiteSpace($projectId)) { $projectId = $currentProject }
if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "!! No project id given and no gcloud default project set. Aborting." -ForegroundColor Red
    exit 1
}
Write-Host "Using project: $projectId" -ForegroundColor Yellow

$saName = "devops-lab-sa"
$saEmail = "$saName@$projectId.iam.gserviceaccount.com"

Write-Host ""
Write-Host "--- Step 1: enable core APIs (ONE AT A TIME - batch calls can misreport PERMISSION_DENIED) ---" -ForegroundColor Yellow
$apis = @(
    "compute.googleapis.com", "storage.googleapis.com", "sqladmin.googleapis.com",
    "firestore.googleapis.com", "bigtableadmin.googleapis.com", "redis.googleapis.com",
    "bigquery.googleapis.com", "dns.googleapis.com", "cloudkms.googleapis.com",
    "secretmanager.googleapis.com", "iam.googleapis.com", "cloudresourcemanager.googleapis.com",
    "iamcredentials.googleapis.com"
)
foreach ($api in $apis) {
    gcloud services enable $api --project=$projectId
    if ($LASTEXITCODE -eq 0) { Write-Host "  OK   $api" -ForegroundColor Green }
    else { Write-Host "  FAIL $api (see error above - may need billing or a permission grant)" -ForegroundColor Red }
}

Write-Host ""
Write-Host "--- Step 2: create service account (skips if it already exists) ---" -ForegroundColor Yellow
$existing = gcloud iam service-accounts list --project=$projectId --filter="email:$saEmail" --format="value(email)" 2>$null
if ([string]::IsNullOrWhiteSpace($existing)) {
    gcloud iam service-accounts create $saName --project=$projectId --display-name="DevOps Mastery Lab"
} else {
    Write-Host "  Service account already exists: $saEmail" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "--- Step 3: grant project-scoped roles ---" -ForegroundColor Yellow
$roles = @("roles/editor", "roles/resourcemanager.projectIamAdmin", "roles/iam.serviceAccountAdmin")
foreach ($role in $roles) {
    gcloud projects add-iam-policy-binding $projectId --member="serviceAccount:$saEmail" --role=$role --condition=None --format="value(etag)" | Out-Null
    Write-Host "  granted (or already had) $role" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "--- Step 4: try to create a JSON key ---" -ForegroundColor Yellow
# scratch/ is fully gitignored repo-wide - this is the ONLY place any real secret-bearing
# file this script might produce is allowed to land. Do NOT change this to a path outside
# scratch/ without also adding a matching .gitignore entry.
$keyDir = "scratch\creds"
if (-not (Test-Path $keyDir)) { New-Item -ItemType Directory -Path $keyDir -Force | Out-Null }
$keyPath = Join-Path $keyDir "gcp-devops-lab.json"
$keyCreated = $false
if (Test-Path $keyPath) {
    Write-Host "  key file already exists, leaving it as-is: $keyPath" -ForegroundColor DarkGray
    $keyCreated = $true
} else {
    gcloud iam service-accounts keys create $keyPath --iam-account=$saEmail --project=$projectId
    if ($LASTEXITCODE -eq 0 -and (Test-Path $keyPath) -and (Get-Item $keyPath).Length -gt 0) {
        Write-Host "  key created: $keyPath" -ForegroundColor Green
        $keyCreated = $true
    } else {
        Write-Host "  !! Key creation BLOCKED (likely constraints/iam.disableServiceAccountKeyCreation Org Policy -" -ForegroundColor Yellow
        Write-Host "     this is Google's own platform default on many personal-account projects; overriding it at" -ForegroundColor Yellow
        Write-Host "     project scope does NOT work even as Owner, confirmed by testing). Cleaning up the empty file." -ForegroundColor Yellow
        Remove-Item $keyPath -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
if ($keyCreated) {
    Write-Host "--- Step 5: set USER env vars (key-file method) ---" -ForegroundColor Yellow
    $resolvedKeyPath = (Resolve-Path $keyPath).Path
    Set-UserEnv "GOOGLE_APPLICATION_CREDENTIALS" $resolvedKeyPath
    Set-UserEnv "GOOGLE_PROJECT" $projectId
} else {
    Write-Host "--- Step 5: fall back to ADC (Application Default Credentials) ---" -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", $null, 'User')
    Set-UserEnv "GOOGLE_PROJECT" $projectId
    $adcPath = Join-Path $env:APPDATA "gcloud\application_default_credentials.json"
    if (Test-Path $adcPath) {
        Write-Host "  ADC already present at $adcPath - nothing more to do." -ForegroundColor Green
    } else {
        Write-Host "  ADC not set up yet. Run this ONE TIME yourself (opens a browser):" -ForegroundColor Yellow
        Write-Host "    gcloud auth application-default login" -ForegroundColor Cyan
        Write-Host "  Then re-run this script (or just verify-devops-creds.ps1) to confirm." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== DONE. Close and REOPEN your terminal / Claude Code session for env vars to take effect. ===" -ForegroundColor Cyan
Write-Host "Verify: powershell -File .claude\docs\rules\devops\creds\verify-devops-creds.ps1" -ForegroundColor DarkGray
Write-Host "Reminder: org-level GCP lessons (org-policy-and-folders) still need manual Org Admin setup - see script header." -ForegroundColor Yellow
