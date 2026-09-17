# Synthetic analytics package v1

This format supports generated synthetic SQLite fixtures only. `synthetic-relational-v1` is separate from the historical `source-contract-v1`. Actual source column mapping remains unsupported. No package produced here is source-reconciled or suitable for market reporting.

## Encoding

The envelope is UTF-8 canonical JSON with exactly `manifest` and `payload`. Objects use recursively sorted keys in JavaScript string order. Arrays retain their order. There is no whitespace, BOM, or trailing newline. The reader rejects noncanonical bytes, including duplicate JSON keys, invalid UTF-8, and truncated data.

The writer sorts each stream by the string `id`, using binary string comparison. IDs are never converted to numbers. The same records and metadata produce identical bytes regardless of input batch order. A reader accepts canonical arrays in their supplied order and validates their corresponding hashes.

The manifest has these exact fields:

| Field | Value |
| --- | --- |
| `schemaVersion` | `analytics-package-v1` |
| `mappingVersion` | `synthetic-relational-v1` |
| `provenance` | `synthetic` |
| `currency` | `TRY` |
| `sourceReconciled` | `false` |
| `lineage`, `extractionId` | Stable opaque IDs |
| `extractedAt` | UTC timestamp with milliseconds, `YYYY-MM-DDTHH:mm:ss.sssZ` |
| `cutoff` | Inclusive business date, `YYYY-MM-DD` |
| `coverage` | Exactly `from`, `to`, and boolean `complete`. Dates satisfy `from <= to <= cutoff`. |
| `streams` | Exactly `documents`, `lines`, and `suppliers`. Each has integer `count` and lowercase SHA-256 `sha256`. |

Each SHA-256 covers the UTF-8 canonical JSON array for that stream. Hashes detect accidental payload changes. They do not authenticate a sender or protect against someone rewriting both payload and manifest.

Source identity is the tuple `(lineage, stream, id)`. `extractionId` identifies the snapshot, not an economic transaction. No import or activation occurs in this reader.

## Payload schemas

Every stream is required, including empty arrays. Unknown streams or fields are rejected.

| Stream | Exact row fields |
| --- | --- |
| `documents` | `id`, `kind`, `date`, `supplierId` |
| `lines` | `id`, `documentId`, `quantity`, `net`, `cost` |
| `suppliers` | `id` |

IDs match `[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`. IDs must be unique within a stream. `kind` is `sale`, `purchase`, `customer-return`, or `supplier-return`. Document dates fall inside coverage. `supplierId` is null or an existing supplier ID. Only purchases and supplier returns may refer to suppliers. Every supplier must be referenced by at least one such document. Names and contacts are excluded.

Each line refers to an existing document. `quantity` and `net` are decimal strings. `cost` is a decimal string or null. Decimal syntax allows an optional minus sign, up to 40 integral digits, and up to 30 fractional digits. Leading zeros, exponent notation, and numeric JSON values are rejected. Lexical precision, including trailing zeros and negative zero, is preserved.

These synthetic quantities and costs have no validated unit or tax basis. They are transport facts only. No financial calculation, source mapping, unit conversion, or legal KDV interpretation follows from this format.

## Limits and results

The package limit is 32 MiB and 100,000 total rows across all streams. Source files are limited to 64 MiB. Extraction uses 256-row batches, at most 403 queries, and a 256 KiB serialized batch limit. Oversized batches fail closed. The worker accepts only one outstanding request, so a paused consumer does not accumulate queued batches.

Extraction has a 10-second total deadline, including worker startup and consumer delay. Callers can request a shorter positive integer `timeoutMs`. Abort and deadline expiry terminate the worker even while the consumer is paused. Generator completion waits for worker termination. SQLite's 50 ms busy timeout only bounds lock waits.

Preparation buffers batches under the byte and row caps, then validates and serializes the envelope. This bounded in-memory format has no demonstrated scalability for real datasets. A future real-source implementation needs separately reviewed mapping, permissions, sizes, and performance evidence.

The reader returns either validated metadata, records, and warning codes, or `{ ok: false, code: "INVALID_PACKAGE" }`. Warnings are ordered `SYNTHETIC_ONLY`, optional `PARTIAL_COVERAGE`, and optional `MISSING_COST`. Missing cost stays null. Missing expenses are not represented as zero or imported as source records. Broken references, duplicate IDs, unsupported versions, hash/count mismatches, malformed dates/decimals, and private fields reject the package.
