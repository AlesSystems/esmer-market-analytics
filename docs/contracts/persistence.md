# Local persistence contract

This contract implements [issue #7](https://github.com/AlesSystems/esmer-market-analytics/issues/7), Tasks 4.1 and 4.2 of the [implementation plan](../superpowers/plans/esmer-market-implementation-plan.md#phase-4--durable-local-storage-and-safe-imports). Source packages follow the [analytics-package contract](analytics-package.md). The package mapping remains synthetic-only, with the existing 32 MiB and 100,000-record limits. Those limits do not cover the historical full-source dataset.

## Ownership and identity

One service worker owns `analytics.sqlite` under Electron's `userData` directory. The main process chooses that directory. `src/store/store.ts` owns transactions and reads, `schema.ts` and `migrations.ts` own the application schema, and `revisions.ts` defines app-owned changes. The renderer receives neither its path nor a database handle. No migration opens or changes the market source. Initialization checks the application identifier, supported version, required table/trigger definitions, SQLite integrity and foreign keys before advancing a recognized schema. Unrelated, newer or structurally damaged databases are rejected without repair.

A dataset contains an immutable source snapshot. Its identity includes the package content, and its manifest retains the source lineage, extraction identity, cutoff, coverage, mapping version and warnings. Source document and line IDs belong to that dataset and lineage. Reusing an ID in a different lineage never transfers an adjustment to the new source.

Source documents, lines and suppliers use fixed relational tables matching the validated package. Composite foreign keys enforce source links within a dataset. Stored row positions preserve each stream's supplied order, so valid unsorted packages retain their original hashes. Quantities, money and historical cost retain their exact decimal text. Missing cost remains null. Structural import summaries contain counts and warnings; this phase does not compute financial totals.

App-owned records have their own append-only revisions. The initial persistence API represents expenses by incurred date, exact net value, reason and opaque evidence identity. It does not yet implement spreadsheet mapping, KDV classification or payment analysis. A correction appends a revision for that entity, preserving its original value and provenance. Reading revision N selects each entity's latest value at or before N. It does not select only the latest global row. Expenses, adjustments, confirmations and settings are never replaced by a source import. Revision history is the audit trail.

## Coherent reads and accepted reports

A current read captures the active dataset and app revision together. An explicit pinned read resolves immutable source facts and app-owned values at that pair. New imports and later corrections cannot change those values.

Accepted report records pin the dataset, app revision, calculation version and required evidence. Accepted content cannot be overwritten. This phase persists report records for reproducibility tests; financial calculations and report presentation remain later-phase work. Accepting a synthetic report does not certify its figures or promote estimated profit to verified profit.

An adjustment retains its original dataset, lineage, target ID and target content. Its review status compares that target with the selected source snapshot. A changed or missing target requires review. A document change also affects adjustments to its lines. The original link and value remain recoverable, including when another lineage reuses the same ID.

## Import lifecycle

The service validates bounded package bytes through the existing package reader before they can become active. Staging persists candidate facts separately from the selected source view. Candidate validation checks completeness and references, and saves source counts and warning evidence. Only a validated coherent candidate can activate.

Activation uses one SQLite transaction. It retains the previous dataset and difference evidence, then changes the active pointer. It never writes back an app snapshot captured during staging. An expense or adjustment created between staging and activation therefore survives.

An identical package does not append duplicate facts. Reimporting a known historical package does not silently revert a newer active dataset. Failed and cancelled imports preserve the selected source snapshot. Interrupted work is never automatically published on restart. Reopening marks nonterminal batches interrupted and exposes the relevant failure through availability, so the UI can show an error alongside the retained dataset or empty state. An unsuccessful first import leaves the database empty and exposes a safe error.

The service serializes SQLite writes. Parsing and persistence run outside the renderer. Reports cannot combine a newly activated source summary with an operating result from an obsolete app revision.

## Retention and storage pressure

Retain the active dataset, rollback data, all datasets and app revisions required by accepted reports, and the original targets needed to explain adjustments. Keep compact batch outcomes and difference evidence. Prune redundant unreferenced candidate facts without deleting required provenance.

The store keeps compact package hashes after pruning facts. A previously activated package therefore remains identifiable and cannot silently reactivate after its facts are removed.

Storage pressure produces a visible error. It never relaxes retention or silently deletes accepted-report evidence. A failed write must preserve the last complete state. SQLite page-limit tests exercise actual database-full errors on disposable fixtures; they do not prove physical Windows disk-exhaustion behavior.

## Scope and evidence

The [local evidence record](../evidence/phase-4-local.md) records implementation and verification. The [Windows handoff](../operations/windows-phase-4-handoff.md) defines the remaining platform work. Migration, interruption, locking, packaging and lifecycle claims apply only to the environment actually tested.

Expense spreadsheet import, duplicate classification, financial calculations, exports and encrypted backup/recovery retain their later-phase gates. No real-source mapping, source reconciliation, SQL Server permission or full-volume performance claim follows from synthetic persistence tests.
