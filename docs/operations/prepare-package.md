# Prepare a synthetic analytics package

Use this procedure only with a generated test database. Actual SQL Server extraction remains blocked by the unresolved source mapping and separate source-access approval. This tool does not restore databases, connect to production, or provide a manual import service.

1. Use Node 24.15 or later within Node 24 and the locked repository dependencies.
2. Generate a disposable database with `createSyntheticSource` in `tests/helpers/synthetic-source.ts`. Never pass a market backup or credentials.
3. Run the tool with an unused destination filename:

```sh
node tools/prepare-backup.ts synthetic-relational-v1 /path/to/generated.sqlite /path/to/new-package.json synthetic-test synthetic-batch-1 2026-01-03T00:00:00.000Z 2026-01-01 2026-01-02 partial
```

The final argument is `partial` or `complete`. The two dates declare coverage, and the second date is the cutoff. Use opaque synthetic lineage and extraction IDs. The successful command prints `PACKAGE_PREPARED` and exits with zero. Failure prints a fixed code and exits with one. Paths, SQL parameters, and driver errors are not printed.

The tool opens the synthetic database read-only, checks its marker and physical tables, and permits only fixed column reads. It excludes customer-bearing columns before extraction. Queries use bound keyset cursors and batch sizes. A SQLite authorizer denies other columns, functions, writes, extensions, and administration. A read transaction holds a coherent extraction snapshot.

One transient SQLite busy failure permits a retry from the beginning. The tool discards earlier batches before retry. Other failures stop preparation. Ctrl+C or termination requests abort extraction and remove the temporary package.

Publication writes and syncs a restricted temporary file beside the destination, then uses a hard link to publish without replacement. Existing files remain intact. The destination filesystem must support hard links. An ordinary failure removes the temporary file. A process or machine crash can leave a `.partial` file, which is never treated as a published package. Remove that orphan only after confirming no preparation process owns it.

Run the three synthetic integration files to verify the workflow:

```sh
npm run test:integration -- tests/integration/source-readonly.test.ts tests/integration/source-privacy.test.ts tests/integration/analytics-package.test.ts
```

The negative permission tests run only against generated temporary SQLite databases. They do not prove SQL Server account permissions, real-source privacy, Windows behavior, or A01/A05 acceptance. The desktop build imports none of this preparation tooling and receives no source credentials. Dataset activation belongs to Phase 4.

See the [package contract](../contracts/analytics-package.md) for fields, limits, warnings, and rejection rules.
