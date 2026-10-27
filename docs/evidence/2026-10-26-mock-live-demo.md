# Mock live demo on v1.0.1 (2026-10-26)

This receipt records live refresh in the packaged v1.0.1 Mac app against the restored backup, which stands in for the live server until the owner provides the production address. It contains counts and outcomes only. The connection file, credentials and every money figure stay outside Git.

## Environment

- macOS arm64, Node 24.15.0. App: `release/Esmer Market Analytics-1.0.1-arm64-mac.zip` built from the content tagged `v1.0.1` (`f23b11e`); bundle version 1.0.1.
- Source: the disposable copy of the restored backup from the [first real package](2026-10-25-first-real-package.md) (Azure SQL Edge `15.0.2000.1574`, served on `127.0.0.1` only). The original `esmer-mssql` container was not started or changed.
- Connection: the same task-owned, column-level read-only login; `scope` `isolated-copy`, expected database id checked, range 2022-01-01..2025-10-31.
- Fresh user-data directory, no package imported beforehand.

## Flow

| Step | Result |
| --- | --- |
| Ayarlar › Canlı bağlantı › **SQL kaynağını içe aktar** (configure, connect, read, import) | Succeeded in 29.5 s; Ayarlar closed to the workspace |
| Second **Şimdi yenile** | Succeeded in 10.4 s; status `idle`, no error |
| Tile after refresh | "Bağlantı açık", last refresh shown |
| Bu ay | Opened on Ekim 2025 |

The refresh read the newest month inside the connection range and not after today: October 2025.

## Figure check

Figures were compared with the same independent SQL aggregates as the [first real package](2026-10-25-first-real-package.md) check, which restate the [recorded-estimate rules](../contracts/recorded-estimates.md).

| Check | Result |
| --- | --- |
| Bu ay Satış, Tahmini brüt kâr, Marj | Exact match |
| Excel Özet Satış, Maliyeti bilinen satış, Tahmini maliyet, Tahmini brüt kâr, Fiş sayısı | Exact match |
| One product (top Ürünler row): Satış, Maliyet, Kâr | Exact match |
| One day: that product's source documents on its busiest listed day | 22 of 22 documents present with the same totals |

15 of 15 checks matched.

## Observations

- "Son geçerli veri" shows 31.10.2025, the end of the connection range, although sales documents end on 2025-10-12. The figures are correct; the label can suggest a complete month.
- "Son yenileme" updates when the read is recorded, before the import finishes; **Şimdi yenile** stays disabled until the import completes.

Both are fixed in [#132](https://github.com/AlesSystems/esmer-market-analytics/pull/132). "Son geçerli veri" now shows the date of the newest source document. "Son yenileme" shows "Yenileniyor…" while the tile is busy. A worker probe with a synthetic package did not reproduce an early `lastSuccessAt`, so the second fix is in the tile only. A real-source run has not rechecked either fix yet.

## After the demo

The copy was stopped; its data volume is kept. Demo user data, results and the Excel export were deleted.

## Open

- This is not a live SQL Server run. The production address, Eralp's approval for reading the cost column (#110), Windows acceptance (#109) and owner installation remain open.
