# First real package from the restored backup (2026-10-25)

This receipt records the first `npm run prepare:month` package made from the restored backup and its check in the packaged Mac app. It contains counts and outcomes only. The package, connection file, credentials and every money figure stay outside Git.

## Environment

- macOS arm64, Node 24.15.0, branch `fix/real-source-unit-link` from `main` at `f09b065` (v1.0.0).
- Source: the user-specified stopped OrbStack container `esmer-mssql` (image `9d0e27694fc9`, Azure SQL Edge `15.0.2000.1574`), database `EsmerMarketDB`. Its data volume was copied read-only into a disposable volume, and a disposable container served the copy on `127.0.0.1` only. The original container and volume were not started or changed.
- A task-owned login on the copy had column-level `SELECT` only (the list in [aylık veri hazırlama](../operations/aylik-veri-hazirlama-tr.md)), no role membership and no write permission. Administration on the copy was used only to create that login and to read catalog metadata and aggregate counts.
- Synthetic SQL tests ran against a separate empty container, never against the copy.

## What the real source showed

| Finding | Result |
| --- | --- |
| Catalogue columns | `STOK.AD`, `STOK.STOK_GRUP`, `STOK_GRUP.AD`, `STOK_BIRIM.AD` exist. `STOK.STOK_BIRIM` does not. Units link through `STOK_STOK_BIRIM`. Every product sold in September 2025 (3,529) had exactly one unit link, marked `VARSAYILAN` with multiplier 1, and every line used it. |
| Paging | The cached plan for `@cursor IS NULL OR ID > @cursor` could not seek, so each `FIS_DETAY` page took about 2.5–3 s and one month overran the 60 s deadline (`SOURCE_TIMEOUT`, before and after the unit fix). |
| Data range | Sales documents run to 2025-10-12; October 2025 is partial. |

Fixes on this branch: the product unit comes from the single default `STOK_STOK_BIRIM` link (none or several give no unit), and each paged query uses `OPTION (RECOMPILE)`. One month then reads in 2.5 s. The synthetic SQL fixture now mirrors the real schema, including the historical-cost column that the live estimate test had been missing.

## Package

`npm run prepare:month -- <private connection> 2025-10`:

```text
MONTHLY_ESTIMATE_PREPARED 2025-09-01..2025-10-31 months=2/6 headers=21388 lines=73823 products=3911 bytes=27142584 ms=27158
```

Six to three months exceeded the 100,000-row bound, so the command kept September and October. The connection `to` had to be 2025-10-31: the command needs the whole selected month inside the declared range even when the data stops earlier.

## Packaged app check

The packaged Mac app (fresh user-data directory) imported the package through Ayarlar in 1.3 s and opened Bu ay on Ekim 2025. Figures were compared with independent SQL aggregates over the copy that restate the [recorded-estimate rules](../contracts/recorded-estimates.md) (type 11, TRY, active, nonnegative net amount; contribution on lines with positive quantity, multiplier 1 and positive cost):

| Check | Result |
| --- | --- |
| Bu ay Satış, Tahmini brüt kâr, Marj | Exact match |
| Excel Özet Satış, Maliyeti bilinen satış, Tahmini maliyet, Tahmini brüt kâr, Fiş sayısı | Exact match |
| One product (top Ürünler row): Satış, Maliyet, Kâr | Exact match |
| One day: that product's source documents on its busiest listed day | 22 of 22 documents present with the same totals |

Tahmini net kâr showed "Hesaplanamadı" as expected: October is partial and no expenses were entered.

## Verification

- `npm run typecheck`, `npm run lint`: pass.
- `npm run test:unit`: 169 passed.
- `npm run test:integration` with the synthetic SQL engine: 331 passed, 1 skipped. The Mac release-inventory test needed `npm run build` first, as before.
- The gated SQL tests on unchanged `main` had one failure (`prepareLiveEstimate` against a fixture without the cost column); on this branch all 21 pass.

## Open

- Real amounts display with full source precision, up to eight or more decimals (for example `1.234,56789012 ₺`). The contracts keep exact digits and adopt no rounding rule, so display rounding needs an owner decision. Tracked in [bilinen sınırlar](../operations/known-limitations-tr.md).
- This proves the restored copy on Azure SQL Edge only. Live SQL Server, Windows and owner installation remain open (#109, #110).
