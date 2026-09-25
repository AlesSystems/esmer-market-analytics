param(
    [Parameter(Mandatory = $true)][ValidateSet('install', 'upgrade', 'uninstall')][string]$Stage,
    [string]$Installer,
    [switch]$ReusePhase8,
    [string]$PreservedCopy
)
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$work = [IO.Path]::GetFullPath((Join-Path $repo $(if ($ReusePhase8) { 'work/windows-phase-8/lifecycle' } else { 'work/phase-10-lifecycle' })))
$install = Join-Path $work 'installed'
$profile = Join-Path $work $(if ($ReusePhase8) { 'synthetic-profile' } else { 'profile' })
$installerAppData = Join-Path $work 'installer-appdata'
if ($ReusePhase8 -and $Stage -eq 'install') { throw 'Existing Phase 8 installation may only be upgraded or uninstalled after preserving its historical evidence' }
if ($ReusePhase8) {
    if (-not $PreservedCopy) { throw 'Provide a preserved copy of the Phase 8 lifecycle directory' }
    $PreservedCopy = [IO.Path]::GetFullPath($PreservedCopy)
    $workParent = [IO.Path]::GetFullPath((Join-Path $repo 'work'))
    if (-not $PreservedCopy.StartsWith($workParent + '\', [StringComparison]::OrdinalIgnoreCase) -or $PreservedCopy.StartsWith($work + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Preserved copy must be a separate directory under work' }
    foreach ($relative in @('installed/resources/app.asar', 'synthetic-profile/analytics.sqlite', 'monthly-expected.json')) {
        $original = Join-Path $work $relative
        $copy = Join-Path $PreservedCopy $relative
        if (-not (Test-Path -LiteralPath $copy -PathType Leaf)) { throw "Preserved Phase 8 file missing: $relative" }
        if ($Stage -eq 'upgrade' -and (Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $copy -Algorithm SHA256).Hash) { throw "Preserved Phase 8 file differs: $relative" }
    }
}

function Assert-DisposablePath([string]$Path) {
    $absolute = [IO.Path]::GetFullPath($Path)
    if (-not $absolute.StartsWith($work + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Refuse path outside disposable work root: $Path" }
    $ancestor = $absolute
    while ($ancestor) {
        if ((Test-Path -LiteralPath $ancestor) -and ((Get-Item -LiteralPath $ancestor).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw "Refuse linked path: $ancestor" }
        $ancestor = [IO.Path]::GetDirectoryName($ancestor)
    }
    return $absolute
}

$install = Assert-DisposablePath $install
$profile = Assert-DisposablePath $profile
$installerAppData = Assert-DisposablePath $installerAppData
$receipt = Assert-DisposablePath (Join-Path $work "phase-10-$Stage-proof.json")
if (Test-Path -LiteralPath $receipt) { throw "Preserve existing proof before repeating: $receipt" }
if (Get-Process -Name 'Esmer Market Analytics' -ErrorAction SilentlyContinue) { throw 'Close all Esmer Market Analytics processes before installer checks' }
$package = Get-Content -LiteralPath (Join-Path $repo 'package.json') -Raw | ConvertFrom-Json
if ($package.build.appId -ne 'com.alessystems.esmermarketanalytics' -or $package.build.nsis.guid) { throw 'Revalidate NSIS registry identity for changed package configuration' }
. (Join-Path $repo 'docs/evidence/windows-phase-8-tools/lifecycle-registration.ps1')
$registrationStage = if ($Stage -eq 'install') { 'install-prior' } else { 'upgrade' }
$registrations = @(Get-LifecycleRegistration)
Assert-LifecycleRegistration -Entries $registrations -Install $install -Stage $registrationStage
if ($Stage -eq 'install' -and (Test-Path -LiteralPath $install)) { throw 'Disposable installation already exists' }
if ($Stage -ne 'install' -and -not (Test-Path -LiteralPath (Join-Path $install 'resources/app.asar'))) { throw 'Expected disposable installation is missing' }
if ($Stage -ne 'install' -and -not (Test-Path -LiteralPath (Join-Path $profile 'analytics.sqlite'))) { throw 'Run the packaged lifecycle test to seed the synthetic profile first' }
if ($Stage -ne 'install' -and $registrations.Count -eq 0) { throw 'Expected isolated NSIS registration is missing' }
$database = Assert-DisposablePath (Join-Path $profile 'analytics.sqlite')
$before = if (Test-Path -LiteralPath $database) { (Get-FileHash -LiteralPath $database -Algorithm SHA256).Hash } else { $null }
$oldArchive = if ($Stage -eq 'upgrade') { (Get-FileHash -LiteralPath (Join-Path $install 'resources/app.asar') -Algorithm SHA256).Hash } else { $null }
$oldVersion = if ($Stage -eq 'upgrade') { (Get-Item -LiteralPath (Join-Path $install 'Esmer Market Analytics.exe')).VersionInfo.ProductVersion } else { $null }
if ($Stage -ne 'uninstall') {
    if (-not $Installer) { throw 'Provide the exact NSIS installer path' }
    $Installer = [IO.Path]::GetFullPath($Installer)
    if (-not (Test-Path -LiteralPath $Installer -PathType Leaf)) { throw "Installer missing: $Installer" }
}
New-Item -ItemType Directory -Path $work -Force | Out-Null
New-Item -ItemType Directory -Path $installerAppData -Force | Out-Null
$savedAppData = $env:APPDATA
try {
    $env:APPDATA = $installerAppData
    if ($Stage -eq 'uninstall') {
        $uninstaller = Assert-DisposablePath (Join-Path $install 'Uninstall Esmer Market Analytics.exe')
        $uninstallerHash = (Get-FileHash -LiteralPath $uninstaller -Algorithm SHA256).Hash
        $process = Start-Process -FilePath $uninstaller -ArgumentList '/S' -WindowStyle Hidden -Wait -PassThru
        if ($process.ExitCode -ne 0) { throw "Uninstaller exited $($process.ExitCode)" }
        $deadline = (Get-Date).AddSeconds(30)
        while (Test-Path -LiteralPath (Join-Path $install 'Esmer Market Analytics.exe')) {
            if ((Get-Date) -ge $deadline) { throw 'Installed executable remains after uninstall' }
            Start-Sleep -Milliseconds 200
        }
        $after = (Get-FileHash -LiteralPath $database -Algorithm SHA256).Hash
        if ($before -ne $after) { throw 'Synthetic profile changed during uninstall' }
        if (@(Get-LifecycleRegistration).Count -ne 0) { throw 'NSIS registration remains after uninstall' }
        $proof = @{ stage = $Stage; uninstallerHash = $uninstallerHash; exitCode = 0; executableRemoved = $true; profileBefore = $before; profileAfter = $after; syntheticOnly = $true }
    } else {
        $installerHash = (Get-FileHash -LiteralPath $Installer -Algorithm SHA256).Hash
        $process = Start-Process -FilePath $Installer -ArgumentList @('/S', "/D=$install") -WindowStyle Hidden -Wait -PassThru
        if ($process.ExitCode -ne 0) { throw "Installer exited $($process.ExitCode)" }
        $archive = Assert-DisposablePath (Join-Path $install 'resources/app.asar')
        $archiveHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash
        $after = if (Test-Path -LiteralPath $database) { (Get-FileHash -LiteralPath $database -Algorithm SHA256).Hash } else { $null }
        if ($before -ne $after) { throw 'Synthetic profile changed during installer operation' }
        $version = (Get-Item -LiteralPath (Join-Path $install 'Esmer Market Analytics.exe')).VersionInfo.ProductVersion
        $proof = @{ stage = $Stage; installerHash = $installerHash; archiveBefore = $oldArchive; archiveAfter = $archiveHash; productVersionBefore = $oldVersion; productVersionAfter = $version; codeChanged = ($oldArchive -and $oldArchive -ne $archiveHash); versionIncreased = ($oldVersion -and ([version]$version -gt [version]$oldVersion)); exitCode = 0; profileBefore = $before; profileAfter = $after; syntheticOnly = $true }
    }
    $proof | ConvertTo-Json | Set-Content -LiteralPath $receipt -NoNewline
    Write-Output "LIFECYCLE_STAGE_PASSED=$Stage"
} finally { $env:APPDATA = $savedAppData }
