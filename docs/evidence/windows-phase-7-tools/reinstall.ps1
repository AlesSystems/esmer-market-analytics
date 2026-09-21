$ErrorActionPreference = 'Stop'
$root = (Resolve-Path 'work/windows-phase-7/lifecycle').Path
$install = Join-Path $root 'installed'
$uninstaller = (Resolve-Path (Join-Path $install 'Uninstall Esmer Market Analytics.exe')).Path
if (-not $uninstaller.StartsWith($install + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Uninstaller outside isolated directory' }
$databases = @((Join-Path $root 'legacy-profile/analytics.sqlite'), (Join-Path $root 'expense-profile/analytics.sqlite'))
$before = @($databases | Get-FileHash | Select-Object Path,Hash)
$env:APPDATA = Join-Path $root 'installer-appdata'
$process = Start-Process -FilePath $uninstaller -ArgumentList '/S' -WindowStyle Hidden -Wait -PassThru
if ($process.ExitCode -ne 0) { throw "Uninstall failed: $($process.ExitCode)" }
$deadline = (Get-Date).AddSeconds(30)
while (Test-Path (Join-Path $install 'Esmer Market Analytics.exe')) {
  if ((Get-Date) -gt $deadline) { throw 'Installed executable remains' }
  Start-Sleep -Milliseconds 200
}
$after = @($databases | Get-FileHash | Select-Object Path,Hash)
if (($before | ConvertTo-Json -Compress) -ne ($after | ConvertTo-Json -Compress)) { throw 'Profile changed during uninstall' }
@{ uninstallExit = 0; executableRemoved = $true; before = $before; after = $after } | ConvertTo-Json -Depth 5 | Set-Content work/windows-phase-7/lifecycle/uninstall-proof.json
$installer = (Resolve-Path 'release/Esmer Market Analytics Setup 0.1.0.exe').Path
$process = Start-Process -FilePath $installer -ArgumentList @('/S',"/D=$install") -WindowStyle Hidden -Wait -PassThru
if ($process.ExitCode -ne 0) { throw "Reinstall failed: $($process.ExitCode)" }
Write-Output 'UNINSTALL_REINSTALL_EXIT=0; isolated profile hashes unchanged'
