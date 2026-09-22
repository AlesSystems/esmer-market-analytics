$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lifecycle-registration.ps1')
$testInstall = Join-Path ([IO.Path]::GetTempPath()) 'esmer-registration-contract\installed'
$valid = @{ InstallLocation = $testInstall; UninstallString = '"' + (Join-Path $testInstall 'Uninstall Esmer Market Analytics.exe') + '" /currentuser'; QuietUninstallString = '' }
Assert-LifecycleRegistration -Entries @() -Install $testInstall -Stage 'install-prior'
Assert-LifecycleRegistration -Entries @($valid) -Install $testInstall -Stage 'upgrade'
foreach ($case in @(
    @{ Entries = @($valid); Stage = 'install-prior' },
    @{ Entries = @(@{ InstallLocation = 'C:\Unrelated'; UninstallString = ''; QuietUninstallString = '' }); Stage = 'upgrade' },
    @{ Entries = @(@{ InstallLocation = $testInstall; UninstallString = '"C:\Unrelated\Uninstall.exe"'; QuietUninstallString = '' }); Stage = 'upgrade' },
    @{ Entries = @(@{ InstallLocation = ''; UninstallString = ''; QuietUninstallString = '' }); Stage = 'upgrade' },
    @{ Entries = @(@{ InstallLocation = $testInstall; UninstallString = $valid.UninstallString; QuietUninstallString = '"C:\Unrelated\Uninstall.exe" /S' }); Stage = 'reinstall' }
)) {
    $refused = $false
    try { Assert-LifecycleRegistration -Entries $case.Entries -Install $testInstall -Stage $case.Stage }
    catch { $refused = $true }
    if (-not $refused) { throw 'Unsafe registry registration was accepted' }
}
Write-Output 'REGISTRATION_CONTRACT_PASSED: empty, isolated and five refusal cases'
