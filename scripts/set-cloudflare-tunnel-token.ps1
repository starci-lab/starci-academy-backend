#requires -Version 5.1
$ErrorActionPreference = "Stop"

# Store + verify a Cloudflare API token (Cloudflare Tunnel:Edit + Zone:Read/DNS:Edit
# on starci.org) for the StarCi Academy local tunnel. The raw token is entered
# HIDDEN and saved to .secrets\cloudflare-tunnel-token.txt (gitignored). It is
# never echoed to the console and Claude never reads the raw value - the tunnel
# script reads it from the file. ASCII-only (PS 5.1 BOM-safe).

$root       = Split-Path -Parent $PSScriptRoot
$secretsDir = Join-Path $root ".secrets"
$tokenFile  = Join-Path $secretsDir "cloudflare-tunnel-token.txt"
$zone       = "starci.org"

if (-not (Test-Path $secretsDir)) { New-Item -ItemType Directory -Path $secretsDir | Out-Null }

Write-Host ""
Write-Host "Dan token vao (an, khong hien):"
$secure = Read-Host "Cloudflare token" -AsSecureString
$bstr   = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$token  = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
if ([string]::IsNullOrWhiteSpace($token)) { Write-Host "  token rong, huy."; exit 1 }

Set-Content -Path $tokenFile -Value $token -NoNewline -Encoding Ascii
Write-Host ("  da luu .secrets\cloudflare-tunnel-token.txt ({0} ky tu)" -f $token.Length)

$headers = @{ Authorization = "Bearer $token" }
function CF($path) { Invoke-RestMethod -Uri ("https://api.cloudflare.com/client/v4" + $path) -Headers $headers -Method Get }

Write-Host ""
Write-Host "=== Verify scope ==="

try {
    $v = CF "/user/tokens/verify"
    Write-Host ("  token active: {0}" -f $v.result.status)
    if ($v.result.status -ne "active") { throw "not active" }
} catch { Write-Host "  token verify FAILED"; exit 1 }

try {
    $acc   = CF "/accounts"
    $accId = $acc.result[0].id
    Write-Host ("  Account Read OK - account: {0}" -f $acc.result[0].name)
} catch { Write-Host "  Account read FAILED (need Account:Read)"; exit 1 }

try {
    Invoke-RestMethod -Uri ("https://api.cloudflare.com/client/v4/accounts/$accId/cfd_tunnel?per_page=1") -Headers $headers -Method Get | Out-Null
    Write-Host "  Cloudflare Tunnel scope OK"
} catch { Write-Host "  Tunnel scope MISSING (need Account > Cloudflare Tunnel:Edit)"; exit 1 }

try {
    $z = CF "/zones?name=$zone"
    if (-not $z.result -or $z.result.Count -eq 0) { throw "zone not found" }
    Write-Host ("  Zone DNS scope OK ({0})" -f $zone)
} catch { Write-Host "  Zone/DNS scope MISSING (need Zone:Read + DNS:Edit on $zone)"; exit 1 }

Write-Host ""
Write-Host "DU QUYEN. Chay: .\scripts\cloudflare-tunnel-up.ps1"
Write-Host "  -> tao named tunnel + DNS va expose http://localhost:3001 ra internet."
