# R39 renewed inspection procedure

Historical procedure for the first restricted-reader suitability attempt. The later full user authorization covered the separately reviewed metadata exception and isolated reader setup in [value operation](r39-value-operation.md). Restrictions here describe that first attempt, not an outstanding permission request.

User approval on 2026-10-01 covers bounded isolated-backup inspection and continuing non-Windows work. Target remains private batch `3824ff83-6d2f-47b7-9b74-02d7334d6cd4`; original source and production are excluded.

## Preflight already observed

Exact retained container ID matches the pinned receipt, with matching image, retained volume and internal network; no published ports or host port bindings. Copy is stopped. Retained catalog digest matches both original receipt and reviewed schema pin. Prior seven permission checks passed historically; they are not a current permission attestation. The P02-specific reader configuration was removed during cleanup. A separate retained pre-copy reader configuration exists with isolated-copy scope and mode 0600; no credential value has been printed.

## Proposed minimal execution

1. Reuse the retained catalog for the previously captured tables. Do not repeat old monetary rows.
2. Start only the exact pinned isolated container, after rechecking identity, image, volume, sole internal network and no host port bindings. Treat restart and subsequent stop as the necessary reversible lifecycle of this user-approved inspection. Do not start or stop the original, restore/copy files, alter database mode, create/reset logins, grant permissions or use administrator SQL.
3. Use the retained pre-copy restricted-reader credential only against the matched isolated target, with the prior pinned database GUID. Its original endpoint must never be used. Run M0, the independently pinned permission guard, and M2 only on success, with 15-second queries, a 60-second total pass and a 1 MiB output ceiling. M1 is not executed in this suitability attempt. Even a passing guard requires a comprehensive effective-permission attestation before M1. Use the existing locked driver through a temporary client on the same internal network with no published ports. The temporary client mounts only the locked dependency directory and private query input/output.
4. A login, identity, read-only, timeout or permission failure stops the pass without retry or privilege elevation. Missing catalog tables/columns must be reported as invisible or absent, never absent by assumption. Before M1, independently review whether this old reader is demonstrably suitable; if it is not, stop before connection and prepare a concrete access-restoration request.
5. Stop the owned copy if this procedure started it. Remove only the newly created temporary client and credential files; retain private receipts with restrictive permissions. Verify exact copy stopped. Publish no source locator, database GUID, credential, private row or exact financial amount.

The existing source scope excludes Stage V values until exact reviewed columns and separate value authorization. No financial rule can be activated from catalog metadata. If suitable reader proof is missing, the retained catalog analysis is still useful and must be recorded separately from unperformed SQL.

## Reviewed attempt artifacts

The private task-local `metadata.mjs` reuses the exact M0 identity/read-only SQL hash from the merged scope. `guard.sql` has SHA-256 `c92ae849bc3bbd266231953da55a5b833566606605cb7cc44f73c38d0db1c32a`; it checks administrative/database/write permissions, broad reader/DDL roles and catalog visibility for the five named objects. `run.py` pins the target and local client image, rewrites the configuration endpoint to the isolated copy, and cleans up the client, generated credential and started copy. Syntax checks passed; this is not execution evidence. Credential values, private identifiers and source values are absent from these script sources.
