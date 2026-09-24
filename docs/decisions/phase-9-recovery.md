# Phase 9 recovery ownership

Implements [issue #12](https://github.com/AlesSystems/esmer-market-analytics/issues/12), Tasks 9.1 and 9.2, and the D09/A06 recovery contract. Windows acceptance remains separate from this design decision.

## Keep the database owner responsible for recovery

The existing service worker owns SQLite, backup scheduling and restore coordination. Electron main owns native file dialogs and OS-protected local key storage. The renderer receives named operations, status and an opaque restore preview token. It never receives key material, database paths or arbitrary file access.

The main alternative put scheduling and restore orchestration in Electron main, with separate recovery workers. That adds a commit-notification failure window unless the database records intent itself. Both independent designs agreed on native online backup, authenticated encryption, isolated candidate validation and retained rollback state. The independent judge preferred the service-worker design, scoring it 22/25 against 17/25 for preservation, secret isolation, crash recovery, API size and testability. The selected design includes the alternative's explicit request gating and packaged native-dialog tests.

The Poteto Model the Domain principle led to durable changed/verified generations instead of a transient pending flag. The Laziness Protocol led to one existing worker and built-in SQLite/crypto APIs. Prove It Works requires restored records and financial outputs from an actual encrypted artifact, plus packaged desktop verification.

## Record backup intent with the edit

The recovery generation changes in the same SQLite transaction as source activation, app revisions or accepted reports. A process crash after commit cannot erase that intent. A verified backup acknowledges the generation actually captured by its consistent snapshot. Later writes remain pending and coalesce into a subsequent run. Failure preserves the last verified artifact and pending work.

Snapshots use the selected Node binding's [SQLite online backup API](https://nodejs.org/api/sqlite.html#sqlitebackupsource-db-path-options). This captures a consistent SQLite state while allowing writes; copying only the live database file does not satisfy the contract. The underlying mechanism is documented by [SQLite](https://www.sqlite.org/backup.html).

## Separate recovery material from the installation

Backups use Node's authenticated encryption primitives with a randomly generated recovery key. Authentication must complete before a decrypted candidate becomes usable. Version and encryption metadata are authenticated along with the database bytes. [Node crypto documentation](https://nodejs.org/docs/latest-v24.x/api/crypto.html) describes the cipher/authentication APIs.

The key can be exported and imported independently of the original installation. The local copy is wrapped with [Electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage), outside SQLite and exports. Setup rejects unavailable OS protection. The separately retained recovery file is required because an OS-bound local credential alone cannot survive loss of the original computer. Successful file read-back establishes usable material, not proof of separate physical storage.

## Validate before switching

Restore authenticates and decrypts into a restricted candidate, validates schema, integrity and retained evidence, and migrates only the isolated candidate when necessary. A preview identifies the candidate and the current generation. New edits invalidate the preview. Explicit confirmation gates replacement.

During switching, requests are gated and admitted work is drained before database handles close. A durable switch journal and retained previous database make interruption recoverable. Startup reconciles that journal before opening a database, so an interrupted rename cannot cause an empty store to be created in its place. Two renames are not claimed to be one atomic filesystem operation. Rollback persists a fixed sequence and progress index, so restarting after any individual rename cannot move an original SQLite sidecar into the discarded candidate family.

A required audit intent precedes the switch. A durable per-operation outcome is its commit marker. Startup keeps a validated restored store if that outcome exists; otherwise it resumes rollback and records that result before clearing the journal. Failure to establish the resulting state returns a recovery-required message without asserting preservation. An unreadable existing recovery configuration holds the database closed until setup or restore can proceed, avoiding an unprotected schema migration.

## Platform acceptance boundary

The implementation uses built-in APIs and adds no runtime dependency. Windows access restrictions, native key protection, filesystem durability/open-handle behavior, installer upgrades and independent machine-loss recovery require the [Windows handoff](../operations/windows-phase-9-handoff.md). A06 remains open until those results exist. Existing installations without recovery setup cannot retrospectively supply an encrypted pre-upgrade backup; their bootstrap migration and data preservation need explicit evidence.
