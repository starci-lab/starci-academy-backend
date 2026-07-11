<#
  verify-devops-creds.ps1
  ---------------------------------------------------------------------------
  Checks whether cloud env vars are set - prints ONLY status + length, NEVER the value.
  Safe for tro (Claude) to run - this script never reads out a secret, only variable names.
  GCP is READY via EITHER a service-account key file OR user ADC (see README.md - key
  creation is blocked by org policy on many personal-account GCP projects, ADC is the
  normal path).

  Run: powershell -NoProfile -File .claude\docs\rules\devops\creds\verify-devops-creds.ps1
#>

function Test-Var {
    param([string]$Name, [switch]$Required)
    $v = [Environment]::GetEnvironmentVariable($Name, 'User')
    if ([string]::IsNullOrWhiteSpace($v)) {
        $v = [Environment]::GetEnvironmentVariable($Name, 'Process')
    }
    if ([string]::IsNullOrWhiteSpace($v)) {
        $mark = if ($Required) { "MISSING (required)" } else { "missing (optional)" }
        $color = if ($Required) { "Red" } else { "DarkGray" }
        Write-Host ("  {0,-32} {1}" -f $Name, $mark) -ForegroundColor $color
        return $false
    } else {
        Write-Host ("  {0,-32} set (len={1})" -f $Name, $v.Length) -ForegroundColor Green
        return $true
    }
}

Write-Host ""
Write-Host "=== AWS ===" -ForegroundColor Cyan
$aws1 = Test-Var "AWS_ACCESS_KEY_ID" -Required
$aws2 = Test-Var "AWS_SECRET_ACCESS_KEY" -Required
Test-Var "AWS_REGION" | Out-Null
Test-Var "AWS_SESSION_TOKEN" | Out-Null
$awsOk = $aws1 -and $aws2

Write-Host ""
Write-Host "=== DigitalOcean ===" -ForegroundColor Cyan
$doOk = Test-Var "DIGITALOCEAN_TOKEN" -Required
Test-Var "SPACES_ACCESS_KEY_ID" | Out-Null
Test-Var "SPACES_SECRET_ACCESS_KEY" | Out-Null

Write-Host ""
Write-Host "=== GCP ===" -ForegroundColor Cyan
$gcpPath = [Environment]::GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", 'User')
$gcpKeyFileOk = $false
if (-not [string]::IsNullOrWhiteSpace($gcpPath)) {
    if (Test-Path $gcpPath) {
        Write-Host ("  {0,-32} set (len={1})" -f "GOOGLE_APPLICATION_CREDENTIALS", $gcpPath.Length) -ForegroundColor Green
        $gcpKeyFileOk = $true
    } else {
        Write-Host "  GOOGLE_APPLICATION_CREDENTIALS  set but file NOT found on disk: $gcpPath" -ForegroundColor Red
    }
} else {
    Write-Host "  GOOGLE_APPLICATION_CREDENTIALS  not set (ok if using ADC below)" -ForegroundColor DarkGray
}
$adcPath = Join-Path $env:APPDATA "gcloud\application_default_credentials.json"
$adcOk = Test-Path $adcPath
if ($adcOk) {
    Write-Host ("  {0,-32} present (size={1} bytes)" -f "ADC (gcloud auth application-default)", (Get-Item $adcPath).Length) -ForegroundColor Green
} else {
    Write-Host "  ADC (gcloud auth application-default)  not found" -ForegroundColor DarkGray
}
$gcp2 = Test-Var "GOOGLE_PROJECT" -Required
$gcpOk = ($gcpKeyFileOk -or $adcOk) -and $gcp2

Write-Host ""
Write-Host "=== Azure ===" -ForegroundColor Cyan
$az1 = Test-Var "ARM_CLIENT_ID" -Required
$az2 = Test-Var "ARM_CLIENT_SECRET" -Required
$az3 = Test-Var "ARM_SUBSCRIPTION_ID" -Required
$az4 = Test-Var "ARM_TENANT_ID" -Required
$azOk = $az1 -and $az2 -and $az3 -and $az4

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
$awsLabel = "not ready"; if ($awsOk) { $awsLabel = "READY" }
$doLabel = "not ready"; if ($doOk) { $doLabel = "READY" }
$gcpLabel = "not ready"; if ($gcpOk) { $gcpLabel = "READY" }
$azLabel = "not ready"; if ($azOk) { $azLabel = "READY" }
Write-Host ("  AWS            : {0}" -f $awsLabel)
Write-Host ("  DigitalOcean   : {0}" -f $doLabel)
Write-Host ("  GCP            : {0}" -f $gcpLabel)
Write-Host ("  Azure          : {0}" -f $azLabel)
Write-Host ""
