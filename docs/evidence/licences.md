# Windows dependency and distribution review

This record applies to preview 0.2.0 for [Task 10.1](../superpowers/plans/esmer-market-implementation-plan.md#phase-10--windows-acceptance-and-reveal-package). The application remains privately licensed as `UNLICENSED`. No paid signing, hosting, or service is required.

## Shipped dependencies

The locked production packages below declare MIT. Their licence notices remain in `app.asar`; `scripts/verify-package.mjs` checks every packed dependency for a nonempty notice.

| Package | Version | Licence |
| --- | --- | --- |
| decimal.js | 10.6.0 | MIT |
| fflate | 0.8.3 | MIT |
| react | 19.3.0 | MIT |
| react-dom | 19.3.0 | MIT |
| scheduler | 0.28.0 | MIT |
| saxen | 11.1.1 | MIT |
| write-excel-file | 4.1.1 | MIT |

Electron 44.3.0 supplies Chromium, Node, SQLite, and platform binaries. Its MIT notice and Chromium third-party notices are copied to `resources/licences`. Electron's distributed runtime notices also remain beside the executable. SQLite uses the embedded Node binding; no separately built SQLite addon or installed Node runtime is needed by the application. Packaging disables unnecessary native dependency rebuilding. Packaged startup, imports, and recovery exercise the actual Windows binding.

The development toolchain remains locked. electron-builder 26.15.3 creates NSIS and portable outputs, and Playwright 1.63.0 drives verification. These tools are not application runtime services. `read-excel-file` is used only by tests. No dependency version changed for Phase 10; the lockfile root application version changed to 0.2.0.

## Security and publisher state

`npm audit --json` on 25 September 2026 reported zero known vulnerabilities across all dependencies. This registry result is a point-in-time advisory check, not a security guarantee. The reduced result and distribution signature status are in [the release proof](phase-10-proof.json).

The distributions are unsigned. electron-builder's signing log label does not prove that a certificate was applied. The release proof uses `Get-AuthenticodeSignature`. Windows may show an unknown publisher or SmartScreen warning. Download reputation and interactive SmartScreen behavior have not been accepted. Do not tell users to disable Windows protection.

## Repeat the inspection

Run `npm run package:win` on Windows with the repository's Node 24 toolchain. The command checks notices, inventories all unpacked files and every archive file, then extracts both generated executables and compares their complete application payloads with the inspected directory. It retains relative paths, sizes, and SHA-256 values in `release/release-inventory.json` and `release/distribution-inspection.json`.

The inspector rejects unexpected application paths, prohibited data-file extensions, unknown dependency names, archive links, and recognizable credential markers in application code and text resources. Native Electron binaries contain cryptographic parser strings, so marker matching is not applied to those named runtime binaries. They are hashed and compared across distribution payloads. NSIS bootstrap plugins are inventoried by filename and hash. These checks do not identify arbitrary personal information in otherwise valid text; synthetic-only fixtures, packaging allowlists, and source review remain required.
