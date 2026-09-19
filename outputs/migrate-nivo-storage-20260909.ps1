$ErrorActionPreference = 'Stop'
$backend = 'D:\Repositories\nivo-backend'
$oldWork = Join-Path $backend '.work'
$oldState = Join-Path $backend '.starci'
$newWork = Join-Path $backend '.starciwork'
$newState = Join-Path $newWork '_local'
$backup = 'C:\Users\Hi\.codex\migration-backups\nivo-storage-20260909-final'
$runtime = 'D:\Repositories\starci-academy-backend\.claude'
function Assert-RealPath([string] $target) {
  $current = [IO.Path]::GetFullPath($target)
  while ($current) {
    if (Test-Path -LiteralPath $current) {
      if ((Get-Item -LiteralPath $current -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked path: $current" }
    }
    $parent = Split-Path -Path $current -Parent
    if ($parent -eq $current) { break }
    $current = $parent
  }
}
function Inventory([string] $root) {
  $items = @(Get-ChildItem -LiteralPath $root -Recurse -Force)
  if ($items | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }) { throw "Linked entry in $root" }
  @($items | Sort-Object FullName | ForEach-Object {
    $relative = [IO.Path]::GetRelativePath($root, $_.FullName)
    if ($_.PSIsContainer) { "D`t$relative" }
    else { "F`t$relative`t$($_.Length)`t$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash)" }
  })
}
function Assert-Same($expected, $actual, [string] $label) {
  if (@(Compare-Object -ReferenceObject $expected -DifferenceObject $actual).Count) { throw "Inventory changed: $label" }
}
foreach ($target in @($backend,$oldWork,$oldState,$newWork,$newState,$backup)) { Assert-RealPath $target }
foreach ($target in @($oldWork,$oldState,$newWork,$newState)) {
  if (-not ([IO.Path]::GetFullPath($target).StartsWith($backend + '\', [StringComparison]::OrdinalIgnoreCase))) { throw "Outside backend: $target" }
}
if (!(Test-Path -LiteralPath $oldWork -PathType Container) -or !(Test-Path -LiteralPath $oldState -PathType Container)) { throw 'Missing legacy source' }
if ((Test-Path -LiteralPath $newWork) -or (Test-Path -LiteralPath (Join-Path $oldWork '_local')) -or (Test-Path -LiteralPath (Join-Path $backend '.starcitemp')) -or (Test-Path -LiteralPath $backup)) { throw 'Destination/backup conflict' }
$workInventory = Inventory $oldWork
$stateInventory = Inventory $oldState
$beforeValidation = & node "$runtime/bin/starci.mjs" validate $oldWork
New-Item -ItemType Directory -Path $backup | Out-Null
Copy-Item -LiteralPath $oldWork -Destination (Join-Path $backup 'work') -Recurse -Force
Copy-Item -LiteralPath $oldState -Destination (Join-Path $backup 'state') -Recurse -Force
Copy-Item -LiteralPath (Join-Path $backend '.gitignore') -Destination (Join-Path $backup 'backend.gitignore')
Copy-Item -LiteralPath 'D:\Repositories\starci-academy-backend\.workspaces\projects\nivo' -Destination (Join-Path $backup 'binding') -Recurse -Force
$workInventory | Export-Clixml -LiteralPath (Join-Path $backup 'work-inventory.xml')
$stateInventory | Export-Clixml -LiteralPath (Join-Path $backup 'state-inventory.xml')
$beforeValidation | Export-Clixml -LiteralPath (Join-Path $backup 'validation-before.xml')
Assert-Same $workInventory (Inventory (Join-Path $backup 'work')) 'Work backup'
Assert-Same $stateInventory (Inventory (Join-Path $backup 'state')) 'State backup'
Assert-Same $workInventory (Inventory $oldWork) 'Work quiescence'
Assert-Same $stateInventory (Inventory $oldState) 'State quiescence'
Move-Item -LiteralPath $oldWork -Destination $newWork
Assert-Same $workInventory (Inventory $newWork) 'Moved Work'
Move-Item -LiteralPath $oldState -Destination $newState
Assert-Same $stateInventory (Inventory $newState) 'Moved state'
$afterWork = @(Inventory $newWork | Where-Object { $_ -notmatch '^[DF]\t_local(?:\\|\t|$)' })
Assert-Same $workInventory $afterWork 'Work after nesting state'
$afterValidation = & node "$runtime/bin/starci.mjs" validate $newWork
$afterValidation | Export-Clixml -LiteralPath (Join-Path $backup 'validation-after.xml')
$report = [ordered]@{status='moved-byte-verified';backup=$backup;work=$newWork;state=$newState;workEntries=$workInventory.Count;stateEntries=$stateInventory.Count;historicalReceipts='Unchanged bytes; old absolute bindings require explicit revalidation before resume.';retiredTempExisted=$false}
$report | ConvertTo-Json | Write-Output
$report | Export-Clixml -LiteralPath (Join-Path $backup 'migration-report.xml')
