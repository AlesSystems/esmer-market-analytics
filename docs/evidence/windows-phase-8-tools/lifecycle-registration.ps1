function Get-LifecycleRegistration {
    $identity = '8e91cbd9-bbd3-57fa-8f49-7c1219d1ede4'
    foreach ($hive in @([Microsoft.Win32.RegistryHive]::CurrentUser, [Microsoft.Win32.RegistryHive]::LocalMachine)) {
        foreach ($view in @([Microsoft.Win32.RegistryView]::Registry32, [Microsoft.Win32.RegistryView]::Registry64)) {
            $base = [Microsoft.Win32.RegistryKey]::OpenBaseKey($hive, $view)
            $installKey = $null
            $uninstallKey = $null
            try {
                $installKey = $base.OpenSubKey("Software\$identity")
                $uninstallKey = $base.OpenSubKey("Software\Microsoft\Windows\CurrentVersion\Uninstall\$identity")
                if ($installKey -or $uninstallKey) {
                    @{
                        Registry = "$hive/$view/$identity"
                        InstallLocation = if ($installKey) { $installKey.GetValue('InstallLocation', '') } else { '' }
                        UninstallString = if ($uninstallKey) { $uninstallKey.GetValue('UninstallString', '') } else { '' }
                        QuietUninstallString = if ($uninstallKey) { $uninstallKey.GetValue('QuietUninstallString', '') } else { '' }
                    }
                }
            } finally {
                if ($installKey) { $installKey.Dispose() }
                if ($uninstallKey) { $uninstallKey.Dispose() }
                $base.Dispose()
            }
        }
    }
}

function Assert-LifecycleRegistration($Entries, [string]$Install, [string]$Stage) {
    $expected = [IO.Path]::GetFullPath($Install).TrimEnd('\')
    $uninstaller = Join-Path $expected 'Uninstall Esmer Market Analytics.exe'
    foreach ($entry in $Entries) {
        if ($Stage -eq 'install-prior') { throw 'Existing NSIS registration prevents a fresh isolated installation' }
        $location = [string]$entry.InstallLocation
        if (-not [IO.Path]::IsPathFullyQualified($location) -or [IO.Path]::GetFullPath($location).TrimEnd('\') -ine $expected) { throw 'Registered install location is outside the exact disposable installation' }
        foreach ($field in @('UninstallString', 'QuietUninstallString')) {
            $command = [string]$entry[$field]
            if (-not $command) { continue }
            if ($command -notmatch '^"([^"]+)"(?: /(?:currentuser|allusers|S))*$') { throw 'Unrecognized registered uninstall command' }
            $path = $Matches[1]
            if (-not [IO.Path]::IsPathFullyQualified($path) -or [IO.Path]::GetFullPath($path) -ine $uninstaller) { throw 'Registered uninstaller is outside the exact disposable installation' }
        }
    }
}
