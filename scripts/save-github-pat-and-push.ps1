# One-time: save GitHub PAT (repo + workflow) then push.
# Run in PowerShell from repo root: .\scripts\save-github-pat-and-push.ps1
# Do NOT paste PAT into chat or commit it anywhere.

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "GitHub HTTPS push helper (starci-academy-backend)" -ForegroundColor Cyan
Write-Host "PAT must include scopes: repo, workflow" -ForegroundColor Yellow
Write-Host ""

$username = Read-Host "GitHub username"
$securePat = Read-Host "GitHub PAT (ghp_...)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePat)
try {
    $pat = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) | Out-Null
}

if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($pat)) {
    Write-Error "Username and PAT are required."
}

# Replace cached HTTPS credential for github.com
@"
protocol=https
host=github.com

"@ | git credential-manager erase 2>$null

$credentialBlock = @"
protocol=https
host=github.com
username=$username
password=$pat

"@
$credentialBlock | git credential-manager store

Write-Host ""
Write-Host "Pushing to origin/main ..." -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "Push succeeded." -ForegroundColor Green
} else {
    Write-Error "Push failed (exit $LASTEXITCODE). Check PAT scopes (repo + workflow) and branch permissions."
}
