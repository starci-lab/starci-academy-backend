#requires -Version 5.1
$ErrorActionPreference = "Stop"

# Store a Claude Code OAuth token (from `claude setup-token`) for non-interactive
# runs. The raw token is entered HIDDEN and saved to
# .secrets\claude-code-token.txt (gitignored). It is never echoed to the
# console and Claude never reads the raw value - tooling reads it from the file.
# ASCII-only (PS 5.1 BOM-safe). Mirrors set-cloudflare-tunnel-token.ps1.

$root       = Split-Path -Parent $PSScriptRoot
$secretsDir = Join-Path $root ".secrets"
$tokenFile  = Join-Path $secretsDir "claude-code-token.txt"

if (-not (Test-Path $secretsDir)) { New-Item -ItemType Directory -Path $secretsDir | Out-Null }

Write-Host ""
Write-Host "Dan Claude Code OAuth token vao (an, khong hien):"
$secure = Read-Host "Claude Code token" -AsSecureString
$bstr   = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$token  = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
if ([string]::IsNullOrWhiteSpace($token)) { Write-Host "  token rong, huy."; exit 1 }

Set-Content -Path $tokenFile -Value $token -NoNewline -Encoding Ascii
Write-Host ("  da luu .secrets\claude-code-token.txt ({0} ky tu)" -f $token.Length)
Write-Host ""
Write-Host "Dung: `$env:CLAUDE_CODE_OAUTH_TOKEN = Get-Content .secrets\claude-code-token.txt -Raw"
