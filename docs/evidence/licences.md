# Windows dependency and distribution review

This record applies to preview 0.2.0 for [Task 10.1](../superpowers/plans/esmer-market-implementation-plan.md#phase-10--windows-acceptance-and-reveal-package). The application remains privately licensed as `UNLICENSED`. No paid signing, hosting, or service is required.

## Shipped dependencies

The locked production packages below have the stated licences. Their complete package notices remain in `app.asar`, including the three UI helpers, following the existing distribution policy. `scripts/verify-package.mjs` checks every packed dependency for a nonempty notice; bundling alone is not the notice evidence.

| Package | Version | Licence |
| --- | --- | --- |
| decimal.js | 10.6.0 | MIT |
| fflate | 0.8.3 | MIT |
| class-variance-authority | 0.7.1 | Apache-2.0 |
| clsx | 2.1.1 | MIT |
| react | 19.3.0 | MIT |
| react-dom | 19.3.0 | MIT |
| scheduler | 0.28.0 | MIT |
| saxen | 11.1.1 | MIT |
| tailwind-merge | 3.7.0 | MIT |
| write-excel-file | 4.1.1 | MIT |

Electron 44.3.0 supplies Chromium, Node, SQLite, and platform binaries. Its MIT notice and Chromium third-party notices are copied to `resources/licences`. Electron's distributed runtime notices also remain beside the executable. SQLite uses the embedded Node binding; no separately built SQLite addon or installed Node runtime is needed by the application. Packaging disables unnecessary native dependency rebuilding. Packaged startup, imports, and recovery exercise the actual Windows binding.

The development toolchain remains locked. electron-builder 26.15.3 creates NSIS and portable outputs, and Playwright 1.63.0 drives verification. These tools are not application runtime services. `read-excel-file` is used only by tests. No dependency version changed for Phase 10; the lockfile root application version changed to 0.2.0.

## UI foundation licence review — 25 September 2026

`package.json` pins the three runtime helpers exactly, and `package-lock.json` records their npm registry tarballs and integrity values. Their installed package metadata and notice files were inspected on this worktree.

| Package | Locked version | Declared licence | Installed notice and SHA-256 |
| --- | --- | --- | --- |
| clsx | 2.1.1 | MIT | `node_modules/clsx/LICENSE` — `9A9EDAD7BAAE52622BDDF3C15B2EF8A33D2C89F2D25408AD13E8A7481C6B0C97` |
| tailwind-merge | 3.7.0 | MIT | `node_modules/tailwind-merge/LICENSE.md` — `D4C70C7CE38CEA8778F0AED3FC0BEF0A9DBD27F13BD8B6773CBD6D37941971E5` |
| class-variance-authority | 0.7.1 | Apache-2.0 | `node_modules/class-variance-authority/LICENSE` — `0CCBF956CFFC8DCF515809433CB5242EE67C94513D46E48C261D68D0880DE406` |

The Tailwind build chain is development-only: it produces the application's static CSS and is not an application service. Its direct locks are `tailwindcss` 4.3.3, `@tailwindcss/postcss` 4.3.3, and `postcss` 8.5.28. The lockfile also resolves `@tailwindcss/node` 4.3.3 and `@tailwindcss/oxide` 4.3.3 for that chain. All five declare MIT. The installed Tailwind notices (`tailwindcss`, `@tailwindcss/postcss`, `@tailwindcss/node`, and `@tailwindcss/oxide`) are each `LICENSE` with SHA-256 `60E0B68C0F35C078EEF3A5D29419D0B03FF84EC1DF9C3F9D6E39A519A5AE7985`; PostCSS's `LICENSE` is `5BE1F3465BBA68A626777F984878814AAF35E7EF8E9FD314D469BCF887050FB8`.

The MIT and Apache-2.0 terms permit this private `UNLICENSED` application's distribution when their required copyright, permission, and licence text are retained. Apache-2.0 adds its patent grant and notice conditions; its notice must remain with the distributed third-party notices. No copyleft or source-disclosure obligation was identified for these reviewed additions. This is a licence compatibility record, not a legal opinion.

The shadcn/ui source notice is retained verbatim at [`third-party/shadcn-LICENSE`](../../third-party/shadcn-LICENSE) and copied to `resources/licences`, alongside the Tailwind CSS notice. These two sources have no runtime package in `app.asar`, so their notices are distributed separately. The three runtime helper notices are retained with their packages in `app.asar` and verified by the package inspection.

## Security and publisher state

`npm audit --json` on 25 September 2026 reported zero known vulnerabilities across all dependencies. This registry result is a point-in-time advisory check, not a security guarantee. The reduced result and distribution signature status are in [the release proof](phase-10-proof.json).

The distributions are unsigned. electron-builder's signing log label does not prove that a certificate was applied. The release proof uses `Get-AuthenticodeSignature`. Windows may show an unknown publisher or SmartScreen warning. Download reputation and interactive SmartScreen behavior have not been accepted. Do not tell users to disable Windows protection.

## Repeat the inspection

Run `npm run package:win` on Windows with the repository's Node 24 toolchain. The command checks notices, inventories all unpacked files and every archive file, then extracts both generated executables and compares their complete application payloads with the inspected directory. It retains relative paths, sizes, and SHA-256 values in `release/release-inventory.json` and `release/distribution-inspection.json`.

The inspector rejects unexpected application paths, prohibited data-file extensions, unknown dependency names, archive links, and recognizable credential markers in application code and text resources. Native Electron binaries contain cryptographic parser strings, so marker matching is not applied to those named runtime binaries. They are hashed and compared across distribution payloads. NSIS bootstrap plugins are inventoried by filename and hash. These checks do not identify arbitrary personal information in otherwise valid text; synthetic-only fixtures, packaging allowlists, and source review remain required.

The build copies the shadcn source notice and Tailwind CSS notice to resources/licences. Tailwind's generated reset and utilities ship in the compiled stylesheet. PostCSS and the Tailwind compiler execute only during the build.
