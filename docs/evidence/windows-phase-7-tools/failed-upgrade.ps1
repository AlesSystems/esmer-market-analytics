$ErrorActionPreference = 'Stop'
$root = (Resolve-Path 'work/windows-phase-7/lifecycle').Path
$install = (Resolve-Path (Join-Path $root 'installed')).Path
if (-not $install.StartsWith($root + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Installation outside test directory' }
if (Get-Process -Name 'Esmer Market Analytics' -ErrorAction SilentlyContinue) { throw 'Close application instances before installer tests' }
$paths = @((Join-Path $root 'legacy-profile/analytics.sqlite'), (Join-Path $root 'expense-profile/analytics.sqlite'))
$beforeData = @($paths | Get-FileHash | Select-Object Path,Hash)
$beforeFiles = @(Get-ChildItem -LiteralPath $install -Recurse -File | Get-FileHash | Select-Object Path,Hash | Sort-Object Path)
$archive = Join-Path $install 'resources/app.asar'
$lock = [IO.File]::Open($archive, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::Read)
try {
  $env:APPDATA = Join-Path $root 'installer-appdata'
  $installer = (Resolve-Path 'release/Esmer Market Analytics Setup 0.1.0.exe').Path
  $process = Start-Process -FilePath $installer -ArgumentList @('/S', "/D=$install") -WindowStyle Hidden -PassThru
  if (-not $process.WaitForExit(180000)) { $process.Kill(); throw 'Installer acknowledgement timed out' }
  $exitCode = $process.ExitCode
  if ($exitCode -eq 0) { throw 'Expected the locked-file upgrade to fail' }
} finally { $lock.Dispose() }
$afterData = @($paths | Get-FileHash | Select-Object Path,Hash)
$afterFiles = @(Get-ChildItem -LiteralPath $install -Recurse -File | Get-FileHash | Select-Object Path,Hash | Sort-Object Path)
if (($beforeData | ConvertTo-Json -Compress) -ne ($afterData | ConvertTo-Json -Compress)) { throw 'Database changed during failed upgrade' }
if (($beforeFiles | ConvertTo-Json -Compress) -ne ($afterFiles | ConvertTo-Json -Compress)) { throw 'Installed file inventory changed during failed upgrade' }
@{ scenario = 'Same-build NSIS maintenance upgrade fails on locked archive'; exitCode = $exitCode; installedFiles = $beforeFiles.Count; installedFilesUnchanged = $true; databasesBefore = $beforeData; databasesAfter = $afterData; archive = (Get-FileHash $archive).Hash } | ConvertTo-Json -Depth 5 | Set-Content work/windows-phase-7/failed-upgrade-proof.json
Write-Output "EXPECTED_INSTALLER_FAILURE=$exitCode; $($beforeFiles.Count) installed files and both databases unchanged"
