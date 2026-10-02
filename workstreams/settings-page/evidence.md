# Ayarlar page evidence

Scope: the owner-requested Ayarlar page that takes over data package import, SQL source import, import history, the live connection, backup and recovery entry, the source/financial view switch, text size and an About block. The sidebar İşlemler menu and the per-page live banner are removed.

| Field | Value |
|---|---|
| Gate | Ayarlar page (no tracker issue; owner request in chat, 2026-10-02) |
| Commits | `a5677a6` (contracts), `400064f` (preferences IPC), `54bc753` (Ayarlar page) |
| Build | `npm run package:local`, Electron 44.3.0, unsigned macOS arm64 package |
| Environment | macOS 27.0 arm64. Windows was not run. |
| Fixtures | `businessPackage()` synthetic dataset; synthetic unreachable SQL config (`localhost:1`, sentinel password). No source, backup or credential was used. |

## Procedure and results

| Command | Expected | Actual |
|---|---|---|
| `npx tsc --noEmit`, `npm run lint` | Clean | Clean |
| `npm run test:unit` | Pass | 49 passed |
| `npm run test:integration` | Pass | 305 passed, 5 skipped (private opt-in) |
| `npm run test:desktop` (packaged macOS) | Pass, except Windows-only and private skips | 46 passed, 8 skipped. 4 failed at launch: they default to `release/win-unpacked/*.exe` (ENOENT on macOS). |
| Those 4 with `ESMER_EXECUTABLE=<mac app>` | Pass | 4 passed, 3 skipped (Windows-only) |
| `tests/desktop/settings.test.ts` | The live chip opens Ayarlar and focus returns to it. Text size persists across restart as zoom 1.15 / 1.3 / 1. No horizontal overflow at 680 px with the largest text. An unreachable SQL import opens Ayarlar with "Kaynağa ulaşılamadı." | Pass |
| `impeccable detect --json` on changed UI files | No defects | 24 advisory "value outside DESIGN.md" notes for the new settings world. These are resolved by the DESIGN.md update in this change. |

The independent design finish review returned `fix` twice; its eight material fixes were applied. A final size-option wrap change was applied after the review budget and was not re-reviewed. The independent code review found one blocker: a failed SQL import gave no reason on the start screen. That blocker and its should-fix items were addressed. Remaining limitations are listed below.

## Screenshots (synthetic data)

- [Desktop, nothing configured](evidence/settings-desktop.png)
- [760 px](evidence/settings-760.png)
- [680 px, largest text](evidence/settings-680-largest-text.png)
- [Live connection stale, source unreachable](evidence/settings-live-stale.png)
- [Empty store, SQL import unreachable](evidence/settings-sql-unreachable.png)

## Open

- Windows: `npm run package:win`, then the desktop suite on `release/win-unpacked`, including the Windows-only `shadcn-ui` visual journey that now opens Ayarlar, and `scripts/verify-portable.mjs`, which now clicks Ayarlar. Check Segoe UI rendering, 150 % scaling and forced colors.
- If the Ayarlar page is open while the underlying screen switches (for example startup finishing), it remounts: the history disclosure collapses and tiles re-read their status. Focus is not stolen.
