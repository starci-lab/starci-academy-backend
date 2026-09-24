$ErrorActionPreference = 'Stop'
$supportRoot = $PSScriptRoot
$candidateRoot = Join-Path $supportRoot '.claude'
$artifactRoot = Join-Path $supportRoot 'release-artifacts'
$suiteResult = Get-Content -LiteralPath (Join-Path $supportRoot 'full-suite-result.json') -Raw | ConvertFrom-Json
if ($suiteResult.exitCode -ne 0) { throw 'The complete candidate suite has not passed.' }
if (Test-Path -LiteralPath $artifactRoot) { throw 'Release artifact directory already exists; inspect it before retrying.' }
& node (Join-Path $supportRoot 'test-payload-inventory.cjs') after
if ($LASTEXITCODE -ne 0) { throw 'Tested payload bytes changed.' }
$startedAt = [DateTime]::UtcNow.ToString('o')
New-Item -ItemType Directory -Path $artifactRoot | Out-Null
$unpackedRoot = Join-Path $artifactRoot 'unpacked'
$installedRoot = Join-Path $artifactRoot 'installed'
New-Item -ItemType Directory -Path $unpackedRoot | Out-Null
New-Item -ItemType Directory -Path $installedRoot | Out-Null
Push-Location -LiteralPath $candidateRoot
try {
    & npm.cmd pack --pack-destination $artifactRoot --json > (Join-Path $supportRoot 'pack-final.json')
    if ($LASTEXITCODE -ne 0) { throw 'npm pack failed.' }
    $packResult = @(Get-Content -LiteralPath (Join-Path $supportRoot 'pack-final.json') -Raw | ConvertFrom-Json)
    if ($packResult.Count -ne 1) { throw 'Unexpected npm pack result count.' }
    $archiveName = $packResult[0].filename
    if ([IO.Path]::GetFileName($archiveName) -ne $archiveName -or -not $archiveName.EndsWith('.tgz')) { throw 'Unsafe archive filename.' }
    & tar.exe -xzf (Join-Path $artifactRoot $archiveName) -C $unpackedRoot
    if ($LASTEXITCODE -ne 0) { throw 'Package extraction failed.' }
    $packedCli = Join-Path $unpackedRoot 'package/bin/starci-skills.mjs'
    & node $packedCli init --dir $installedRoot --no-bootstrap > (Join-Path $supportRoot 'install-final.log') 2>&1
    if ($LASTEXITCODE -ne 0) { throw 'Packed installation failed.' }
    & node $packedCli doctor --dir $installedRoot --quick > (Join-Path $supportRoot 'doctor-final.log') 2>&1
    if ($LASTEXITCODE -ne 0) { throw 'Installed quick doctor failed.' }
    & node (Join-Path $supportRoot 'verify-packed.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Package/installation byte comparison failed.' }
    & node (Join-Path $supportRoot 'test-payload-inventory.cjs') after
    if ($LASTEXITCODE -ne 0) { throw 'Packaging changed the tested payload.' }
    [ordered]@{exitCode=0;startedAt=$startedAt;finishedAt=[DateTime]::UtcNow.ToString('o');archive=$archiveName;installed=$installedRoot} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $supportRoot 'package-result.json') -Encoding utf8
    Get-Content -LiteralPath (Join-Path $supportRoot 'doctor-final.log') -Tail 8
} finally {
    Pop-Location
}
