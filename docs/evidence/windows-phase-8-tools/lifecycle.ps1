param([Parameter(Mandatory = $true)][ValidateSet('install-prior', 'upgrade', 'reinstall')][string]$Stage)
$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path (Get-Location).Path 'work/windows-phase-8'))
$root = Join-Path $taskRoot 'lifecycle'

function Assert-IsolatedPath([string]$Path) {
    $absolute = [IO.Path]::GetFullPath($Path)
    if (-not [IO.Path]::IsPathRooted($Path) -or -not $absolute.StartsWith($taskRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Path outside lifecycle task: $Path" }
    $ancestor = $absolute
    while ($ancestor) {
        if ((Test-Path -LiteralPath $ancestor) -and ((Get-Item -LiteralPath $ancestor).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw "Refuse linked lifecycle path: $ancestor" }
        $ancestor = [IO.Path]::GetDirectoryName($ancestor)
    }
    return $absolute
}

$root = Assert-IsolatedPath $root
$install = Assert-IsolatedPath (Join-Path $root 'installed')
$profile = Assert-IsolatedPath (Join-Path $root 'synthetic-profile')
$bookkeeping = Assert-IsolatedPath (Join-Path $root 'installer-appdata')
. (Join-Path $PSScriptRoot 'lifecycle-registration.ps1')
$package = Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json
if ($package.build.appId -ne 'com.alessystems.esmermarketanalytics' -or $package.build.nsis.guid) { throw 'Revalidate NSIS registry identity for this package configuration' }
$registrations = @(Get-LifecycleRegistration)
Assert-LifecycleRegistration -Entries $registrations -Install $install -Stage $Stage
if ($registrations.Count -gt 0) { Assert-IsolatedPath (Join-Path $install 'Uninstall Esmer Market Analytics.exe') | Out-Null }
$proof = Assert-IsolatedPath (Join-Path $root "$Stage-installer-proof.json")
if (Test-Path -LiteralPath $proof) { throw "Preserve existing proof before repeating: $proof" }
if ($Stage -eq 'reinstall' -and (Test-Path -LiteralPath (Join-Path $root 'uninstall-proof.json'))) { throw 'Preserve existing uninstall proof before repeating' }
if (Get-Process -Name 'Esmer Market Analytics' -ErrorAction SilentlyContinue) { throw 'Close all application instances before installer checks' }
New-Item -ItemType Directory -Path $root -Force | Out-Null
New-Item -ItemType Directory -Path $bookkeeping -Force | Out-Null
$installer = if ($Stage -eq 'install-prior') { Assert-IsolatedPath (Join-Path $taskRoot 'prior-setup.exe') } else { (Resolve-Path -LiteralPath 'release/Esmer Market Analytics Setup 0.1.0.exe').Path }
$installerHash = (Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash.ToLowerInvariant()
if ($Stage -eq 'install-prior' -and $installerHash -ne '4f0e812ed64f10f7262079c9c362cd6c172224e4d03da97cd5d8cbfcb44a43b9') { throw 'Wrong prior installer' }
if ($Stage -eq 'install-prior' -and (Test-Path -LiteralPath $install)) { throw 'Refuse to replace existing prior installation' }
if ($Stage -ne 'install-prior' -and -not (Test-Path -LiteralPath (Join-Path $install 'resources/app.asar'))) { throw 'Expected isolated installation is missing' }
$database = Assert-IsolatedPath (Join-Path $profile 'analytics.sqlite')
if ($Stage -ne 'install-prior' -and -not (Test-Path -LiteralPath $database)) { throw 'Expected synthetic profile is missing' }
$before = if (Test-Path -LiteralPath $database) { (Get-FileHash -LiteralPath $database).Hash } else { $null }
$originalAppData = $env:APPDATA
try {
    $env:APPDATA = $bookkeeping
    if ($Stage -eq 'reinstall') {
        $uninstaller = Assert-IsolatedPath (Join-Path $install 'Uninstall Esmer Market Analytics.exe')
        $uninstallHash = (Get-FileHash -LiteralPath $uninstaller).Hash
        $process = Start-Process -FilePath $uninstaller -ArgumentList '/S' -WindowStyle Hidden -Wait -PassThru
        if ($process.ExitCode -ne 0) { throw "Uninstall failed: $($process.ExitCode)" }
        $deadline = (Get-Date).AddSeconds(30)
        while (Test-Path -LiteralPath (Join-Path $install 'Esmer Market Analytics.exe')) {
            if ((Get-Date) -gt $deadline) { throw 'Installed executable remains after uninstall' }
            Start-Sleep -Milliseconds 200
        }
        $afterUninstall = (Get-FileHash -LiteralPath $database).Hash
        if ($before -ne $afterUninstall) { throw 'Synthetic profile changed during uninstall' }
        @{ uninstallExit = 0; uninstallerHash = $uninstallHash; executableRemoved = $true; profileBefore = $before; profileAfter = $afterUninstall } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $root 'uninstall-proof.json')
    }
    $process = Start-Process -FilePath $installer -ArgumentList @('/S', "/D=$install") -WindowStyle Hidden -Wait -PassThru
    if ($process.ExitCode -ne 0) { throw "Installer failed: $($process.ExitCode)" }
    $archive = Assert-IsolatedPath (Join-Path $install 'resources/app.asar')
    $archiveHash = (Get-FileHash -LiteralPath $archive).Hash.ToLowerInvariant()
    $expectedArchive = if ($Stage -eq 'install-prior') { 'a1b29602e60fa2903da96efef91cd83d49a5ae9fa5d8b77fec4053534a46f973' } else { (Get-FileHash -LiteralPath 'release/win-unpacked/resources/app.asar').Hash.ToLowerInvariant() }
    if ($archiveHash -ne $expectedArchive) { throw 'Installed archive differs from expected build' }
    $after = if (Test-Path -LiteralPath $database) { (Get-FileHash -LiteralPath $database).Hash } else { $null }
    if ($before -ne $after) { throw 'Synthetic profile changed during installer operation' }
    @{ stage = $Stage; exitCode = 0; install = $install; installer = $installer; installerHash = $installerHash; executableHash = (Get-FileHash -LiteralPath (Join-Path $install 'Esmer Market Analytics.exe')).Hash; archiveHash = $archiveHash; profileBefore = $before; profileAfter = $after; syntheticOnly = $true; registryPreflight = $true; existingRegistrations = $registrations.Count } | ConvertTo-Json | Set-Content -LiteralPath $proof
    Write-Output "LIFECYCLE_INSTALLER_SUCCESS=$Stage"
} finally { $env:APPDATA = $originalAppData }
