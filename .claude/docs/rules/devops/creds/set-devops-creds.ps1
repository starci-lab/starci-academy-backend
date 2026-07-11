<#
  set-devops-creds.ps1
  ---------------------------------------------------------------------------
  RUN THIS SCRIPT YOURSELF (thay) IN YOUR OWN TERMINAL.
  Claude / tro must NEVER run this file (tro should never see/type a secret value).

  What it does: prompts for each cloud's credentials (AWS / DigitalOcean / GCP / Azure)
  and stores them as USER-scope env vars (persist across new terminals, including a new
  Claude Code session, ON THIS MACHINE ONLY - see README.md for portability notes).

  Prefer the provision-*.ps1 scripts for AWS/GCP/Azure (they CREATE a dedicated identity
  automatically). Use THIS script for: DigitalOcean (no provision script exists), or
  filling in any single value manually (e.g. AWS bootstrap on a brand new machine/account
  where no key exists yet at all - see README.md "Bootstrap AWS lan dau").

  AFTER RUNNING: close and reopen your terminal / Claude Code session so the new env
  vars take effect (a process already running does not see newly-set User env vars).

  Run: powershell -NoProfile -ExecutionPolicy Bypass -File .claude\docs\rules\devops\creds\set-devops-creds.ps1
#>

function Set-UserEnv {
    param([string]$Name, [string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        Write-Host "  - $Name : skipped (empty)" -ForegroundColor DarkGray
        return
    }
    [Environment]::SetEnvironmentVariable($Name, $Value, 'User')
    Write-Host "  - $Name : SET (len=$($Value.Length))" -ForegroundColor Green
}

function Read-Secret {
    param([string]$Prompt)
    $secure = Read-Host -Prompt $Prompt -AsSecureString
    if ($secure.Length -eq 0) { return "" }
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    } finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

Write-Host ""
Write-Host "=== DevOps Mastery - load 4-cloud credentials (User env only, no file written) ===" -ForegroundColor Cyan
Write-Host "Press Enter on any prompt to skip that variable / cloud." -ForegroundColor DarkGray
Write-Host ""

# ---------- AWS ----------
Write-Host "--- AWS (dedicated IAM user, least-privilege - do NOT use root) ---" -ForegroundColor Yellow
$awsKeyId = Read-Host "AWS_ACCESS_KEY_ID (Enter to skip AWS)"
if (-not [string]::IsNullOrWhiteSpace($awsKeyId)) {
    $awsSecret = Read-Secret "AWS_SECRET_ACCESS_KEY"
    $awsRegion = Read-Host "AWS_REGION (Enter = us-east-1)"
    if ([string]::IsNullOrWhiteSpace($awsRegion)) { $awsRegion = "us-east-1" }
    $awsSession = Read-Secret "AWS_SESSION_TOKEN (only if using STS/SSO temp creds - Enter to skip)"
    Set-UserEnv "AWS_ACCESS_KEY_ID" $awsKeyId
    Set-UserEnv "AWS_SECRET_ACCESS_KEY" $awsSecret
    Set-UserEnv "AWS_REGION" $awsRegion
    Set-UserEnv "AWS_DEFAULT_REGION" $awsRegion
    if (-not [string]::IsNullOrWhiteSpace($awsSession)) { Set-UserEnv "AWS_SESSION_TOKEN" $awsSession }
} else { Write-Host "  (AWS skipped)" -ForegroundColor DarkGray }
Write-Host ""

# ---------- DigitalOcean ----------
Write-Host "--- DigitalOcean (PAT full-access + separate Spaces key for object storage) ---" -ForegroundColor Yellow
$doToken = Read-Secret "DIGITALOCEAN_TOKEN (Personal Access Token - Enter to skip DO)"
if (-not [string]::IsNullOrWhiteSpace($doToken)) {
    Set-UserEnv "DIGITALOCEAN_TOKEN" $doToken
    $spacesId = Read-Host "SPACES_ACCESS_KEY_ID (Enter if no Spaces lesson needed yet)"
    if (-not [string]::IsNullOrWhiteSpace($spacesId)) {
        $spacesSecret = Read-Secret "SPACES_SECRET_ACCESS_KEY"
        Set-UserEnv "SPACES_ACCESS_KEY_ID" $spacesId
        Set-UserEnv "SPACES_SECRET_ACCESS_KEY" $spacesSecret
    }
} else { Write-Host "  (DigitalOcean skipped)" -ForegroundColor DarkGray }
Write-Host ""

# ---------- GCP ----------
Write-Host "--- GCP (prefer provision-gcp-lab.ps1 - it sets up ADC automatically) ---" -ForegroundColor Yellow
Write-Host "  Only fill this in manually if you already have a service-account JSON key file." -ForegroundColor DarkGray
$gcpPath = Read-Host "GOOGLE_APPLICATION_CREDENTIALS - path TO the JSON file (Enter to skip GCP here)"
if (-not [string]::IsNullOrWhiteSpace($gcpPath)) {
    if (-not (Test-Path $gcpPath)) {
        Write-Host "  !! WARNING: no file found at '$gcpPath' - check the path; env will still be set but terraform will fail until the file is there." -ForegroundColor Red
    }
    $gcpProject = Read-Host "GOOGLE_PROJECT (project id used for this lab)"
    $resolved = (Resolve-Path -Path $gcpPath -ErrorAction SilentlyContinue).Path
    if ([string]::IsNullOrWhiteSpace($resolved)) { $resolved = $gcpPath }
    Set-UserEnv "GOOGLE_APPLICATION_CREDENTIALS" $resolved
    Set-UserEnv "GOOGLE_PROJECT" $gcpProject
} else { Write-Host "  (GCP skipped here - run provision-gcp-lab.ps1 instead)" -ForegroundColor DarkGray }
Write-Host ""

# ---------- Azure ----------
Write-Host "--- Azure (prefer provision-azure-lab.ps1 - it creates the SP automatically) ---" -ForegroundColor Yellow
$armClientId = Read-Host "ARM_CLIENT_ID (Enter to skip Azure here)"
if (-not [string]::IsNullOrWhiteSpace($armClientId)) {
    $armSecret = Read-Secret "ARM_CLIENT_SECRET"
    $armSub = Read-Host "ARM_SUBSCRIPTION_ID"
    $armTenant = Read-Host "ARM_TENANT_ID"
    Set-UserEnv "ARM_CLIENT_ID" $armClientId
    Set-UserEnv "ARM_CLIENT_SECRET" $armSecret
    Set-UserEnv "ARM_SUBSCRIPTION_ID" $armSub
    Set-UserEnv "ARM_TENANT_ID" $armTenant
} else { Write-Host "  (Azure skipped here - run provision-azure-lab.ps1 instead)" -ForegroundColor DarkGray }
Write-Host ""

Write-Host "=== DONE. Close and REOPEN your terminal / Claude Code session for env vars to take effect. ===" -ForegroundColor Cyan
Write-Host "Verify: powershell -File .claude\docs\rules\devops\creds\verify-devops-creds.ps1" -ForegroundColor DarkGray
