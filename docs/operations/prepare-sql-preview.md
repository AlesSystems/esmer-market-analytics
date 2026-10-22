# Prepare an isolated SQL backup preview

Use this developer command only for the authorized isolated restored copy. The desktop app imports its output and can browse it offline. The command produces `sql-backup-preview-v1` without a historical-cost candidate. It preserves raw source records and does not enable financial dashboards. Estimate packages support only the unverified contribution calculation in [recorded-source estimates](../contracts/recorded-estimates.md). This command does not prepare them; use the monthly command `npm run prepare:month -- <conn.json> <YYYY-MM> [months=6] [out.json]` described in the [Turkish monthly routine](aylik-veri-hazirlama-tr.md) and the [monthly window decision](../decisions/issue-101-monthly-window.md).

1. Provision a restricted account with SELECT access only to the fields in the [preview allowlist](../contracts/privacy.md#isolated-backup-record-preview-allowlist). Keep setup administration separate from application extraction.
2. Save the [SQL connection configuration](../contracts/live-sync.md) outside the repository. Use `scope: "isolated-copy"`, an opaque `lineage`, the observed `expectedDatabaseId`, and bounded inclusive `from`/`to` source dates. On macOS/Linux, restrict the file to the current user with mode `0600`. On Windows, restrict its ACL to the current user.
3. Run from the repository:

   ```sh
   node tools/prepare-sql-backup.ts /private/connection.json /private/preview.json
   ```

   Success prints `SQL_BACKUP_PREVIEW_PREPARED`. The destination must not already exist. Keep the resulting private package outside Git and release directories.
4. Open the packaged application, open **Ayarlar**, choose **Veri paketi içe aktar**, and select the prepared JSON file. The application opens the source workspace with **Özet**, **Satışlar**, **Alışlar ve maliyet**, **Giderler** and **Raporlar**. It shows the declared window, record counts and exact stored values. Use the explicit financial-view switch to access an existing financial dataset separately.
5. Select a period, browse document or product-ID groups, apply filters and open a document to inspect all its lines. Check expense access and preserved report history, then restart the app with SQL unavailable. The imported source package remains in local SQLite. Configure encrypted backup and separately retained recovery material using the existing recovery workflow.

Preparation enforces the existing 100,000-row and 32 MiB limits. Select a smaller source window if either bound is exceeded. Do not remove these bounds to import the entire backup. Certificate verification remains the default; a self-signed isolated test certificate requires explicit `trustServerCertificate: true` and does not establish production TLS compatibility.

The application does not restore `.bak` files itself. The recorded example uses the existing restored SQL Edge volume. See [source evidence and open gates](../evidence/real-sql-preview.md) and the [full application walkthrough](../evidence/source-workspace.md).
