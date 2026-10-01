# One-time isolated metadata access

## Observed blocker

On 2026-10-01 the renewed suitability probe connected to the exact retained isolated copy for batch `3824ff83-6d2f-47b7-9b74-02d7334d6cd4`. M0 confirmed the pinned database GUID and `READ_ONLY` state. The permission guard stopped with SQL error 51014 (`CATALOG_VISIBILITY_UNPROVED`). No M1 or transaction values were read. The 48 ms SQL receipt is a failed suitability check, not a financial or permission pass. Cleanup independently confirmed the copy stopped, temporary client absent and generated credential removed.

The existing reader works; the user does not need to find a password file. The required catalog visibility was not proved by the permission check. M1 was never attempted, so actual catalog access was not tested.

## Approved action and result

Use the administrator credential already belonging to **that exact isolated copy** for one metadata-only pass. Keep the business database `READ_ONLY` throughout. Execute only the pinned M0/M1/M2 SQL from [the reviewed source scope](https://github.com/AlesSystems/esmer-market-analytics/blob/c5252e851ae41e21245036bc7961388cb078db1a/docs/evidence/issue-39-renewed-scope.md): database identity/read-only checks before and after, and column names/storage types for `dbo.FIS`, `dbo.FIS_DETAY`, `dbo.STOK_BIRIM`, `dbo.FIS_DETAY_BELGE_DETAY`, and `dbo.FIS_DETAY_MALIYET`.

This exception does not create/reset an account, grant permissions, change database mode, run DDL/DML, read transaction values, touch the original source, connect to production or give administrator credentials to the application. It avoids changing the backup copy merely to inspect its schema. Missing tables fail the pass; no wider discovery follows automatically.

Limits remain 1,024 catalog rows, 1 MiB total output, 15 seconds per query and 60 seconds for the SQL pass. Private output is published only after identity/read-only checks succeed. Start only the pinned stopped copy on its existing internal network without exposed ports, use the already installed client image, then stop the copy and independently remove/check the temporary client and credential. Credentials never appear in command arguments, public output or Git.

The user subsequently granted full permission to complete the gates. The reviewed metadata-only pass executed successfully: 233 columns, 40,191 transport bytes, 118 ms, matching database identity and READ_ONLY before/after. Copy stop, temporary client removal and credential removal were verified. See [receipt](r39-metadata-receipt.json).

Approval here is a narrow exception to the earlier dedicated-reader procedure, not financial activation or authority to read extra business columns. The next source mapping still requires proved completion, units, amount/tax basis, historical cost and return attribution. Windows remains user-run.

## Review and checkout

Independent readiness review passed for `metadata-admin.mjs` SHA-256 `2b68f50f2958e0314de6bcb2923d05f806fdc2ef5ac574be5064002a44cbdd11` and `run-admin-metadata.py` SHA-256 `3ada8ea99fe97874cff1bd0068ea07c6fc14cd3758a0e43333e36caf8b2293ad`. The initial review covered presenting the exception; the later full user authorization covered its execution. Application code is unchanged; continuation branch `codex/source-inspection-resume` is based on `c5252e851ae41e21245036bc7961388cb078db1a`. Checks here cover script syntax, cleanup fault handling and the actual restricted-reader suitability attempt; no Windows or real-financial acceptance is claimed.
