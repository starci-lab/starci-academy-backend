#requires -Version 5.1
$ErrorActionPreference = "Stop"

# Create (idempotent) a Cloudflare NAMED tunnel + DNS CNAME, then run cloudflared
# to expose the LOCAL StarCi Academy backend (http://localhost:3001) at a public
# HTTPS/WSS URL. Purpose: test the playground BYOM agent end-to-end over a real
# wss:// server (GraphQL + /playground_byom socket.io all ride the same origin).
#
# Reads the API token from .secrets\cloudflare-tunnel-token.txt (run
# set-cloudflare-tunnel-token.ps1 first). ASCII-only (PS 5.1 BOM-safe).

# ---------------- CONFIG (chinh o day) ----------------
$Zone       = "starci.org"
$Hostname   = "academy-local.starci.org"    # public URL -> your local :3001
$Service    = "http://localhost:3001"       # what to expose (BE dev server)
$TunnelName = "academy-local"
# ------------------------------------------------------

$root      = Split-Path -Parent $PSScriptRoot
$tokenFile = Join-Path $root ".secrets\cloudflare-tunnel-token.txt"
if (-not (Test-Path $tokenFile)) {
    Write-Host "Chua co token. Chay .\scripts\set-cloudflare-tunnel-token.ps1 truoc."
    exit 1
}
$token   = (Get-Content $tokenFile -Raw).Trim()
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
$api     = "https://api.cloudflare.com/client/v4"

function Get-Json($url)        { Invoke-RestMethod -Uri $url -Headers $headers -Method Get }
function Post-Json($url, $obj) { Invoke-RestMethod -Uri $url -Headers $headers -Method Post -Body ($obj | ConvertTo-Json -Depth 10) }
function Put-Json($url, $obj)  { Invoke-RestMethod -Uri $url -Headers $headers -Method Put  -Body ($obj | ConvertTo-Json -Depth 10) }

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host "Thieu cloudflared. Cai: winget install --id Cloudflare.cloudflared"
    exit 1
}

$accId  = (Get-Json "$api/accounts").result[0].id
$zoneId = (Get-Json "$api/zones?name=$Zone").result[0].id
Write-Host ("  account={0}  zone={1}" -f $accId, $zoneId)

# 1) ensure the named tunnel exists (reuse by name, else create)
$tunnels = (Get-Json "$api/accounts/$accId/cfd_tunnel?name=$TunnelName&is_deleted=false").result
if ($tunnels -and $tunnels.Count -gt 0) {
    $tunnelId = $tunnels[0].id
    Write-Host ("  tunnel '{0}' ton tai (id={1})" -f $TunnelName, $tunnelId)
} else {
    $secretBytes = New-Object 'System.Byte[]' 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($secretBytes)
    $body     = @{ name = $TunnelName; tunnel_secret = [Convert]::ToBase64String($secretBytes); config_src = "cloudflare" }
    $tunnelId = (Post-Json "$api/accounts/$accId/cfd_tunnel" $body).result.id
    Write-Host ("  tunnel '{0}' tao moi (id={1})" -f $TunnelName, $tunnelId)
}

# 2) remotely-managed ingress: Hostname -> local Service, catch-all 404
$config = @{ config = @{ ingress = @(
    @{ hostname = $Hostname; service = $Service },
    @{ service = "http_status:404" }
) } }
Put-Json "$api/accounts/$accId/cfd_tunnel/$tunnelId/configurations" $config | Out-Null
Write-Host ("  ingress: {0} -> {1}" -f $Hostname, $Service)

# 3) DNS CNAME -> <tunnelId>.cfargotunnel.com (proxied); upsert
$cname    = "$tunnelId.cfargotunnel.com"
$record   = @{ type = "CNAME"; name = $Hostname; content = $cname; proxied = $true; ttl = 1 }
$existing = (Get-Json "$api/zones/$zoneId/dns_records?type=CNAME&name=$Hostname").result
if ($existing -and $existing.Count -gt 0) {
    Put-Json "$api/zones/$zoneId/dns_records/$($existing[0].id)" $record | Out-Null
    Write-Host ("  DNS CNAME cap nhat: {0} -> {1}" -f $Hostname, $cname)
} else {
    Post-Json "$api/zones/$zoneId/dns_records" $record | Out-Null
    Write-Host ("  DNS CNAME tao moi: {0} -> {1}" -f $Hostname, $cname)
}

# 4) run token, then run cloudflared (foreground; Ctrl-C to stop)
$runToken = (Get-Json "$api/accounts/$accId/cfd_tunnel/$tunnelId/token").result

Write-Host ""
Write-Host ("  Public URL : https://{0}" -f $Hostname)
Write-Host ("  Agent test : npx @starci/playground-agent <code> --server wss://{0}" -f $Hostname)
Write-Host "  cloudflared dang chay (Ctrl-C de dung)..."
Write-Host ""
cloudflared tunnel run --token $runToken
