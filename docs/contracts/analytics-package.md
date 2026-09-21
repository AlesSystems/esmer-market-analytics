# Synthetic analytics package v1

This format supports generated synthetic SQLite fixtures only. `synthetic-relational-v1` is separate from the historical `source-contract-v1`. Actual source column mapping remains unsupported. No package produced here is source-reconciled or suitable for market reporting.

## Encoding

The envelope is UTF-8 canonical JSON with exactly `manifest` and `payload`. Objects use recursively sorted keys in JavaScript string order. Arrays retain their order. There is no whitespace, BOM, or trailing newline. The reader rejects noncanonical bytes, including duplicate JSON keys, invalid UTF-8, and truncated data.

The writer sorts each stream by the string `id`, using binary string comparison. IDs are never converted to numbers. The same records and metadata produce identical bytes regardless of input batch order. A reader accepts canonical arrays in their supplied order and validates their corresponding hashes.

The manifest has these exact fields:

| Field | Value |
| --- | --- |
| `schemaVersion` | `analytics-package-v1` |
| `mappingVersion` | `synthetic-relational-v1` or the Phase 5 `synthetic-sales-v1` extension below |
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

## Phase 5 synthetic sales mapping

The same `analytics-package-v1` envelope also accepts `mappingVersion: synthetic-sales-v1`. It keeps the three existing streams, byte/row limits, canonical hashes, synthetic provenance and `sourceReconciled: false`. The original relational mapping remains unchanged and cannot supply sales metrics.

Sales coverage starts no earlier than `1900-01-01`, and cutoff is no later than `9998-12-31`, matching the supported report period range. Legacy date validation remains unchanged.

The sales mapping requires a `sales` object on every document and line. It rejects unknown fields, inconsistent product/category labels, invalid conversion references, malformed decimals and unbounded display labels. Product and category names are synthetic display text, limited to 160 characters without control characters. They are not a real-source name allowlist.

Document sales fields are `state`, `convertedTo`, `net`, `tax`, and `gross`. State is `completed`, `void`, `converted`, or `unknown`. A converted document must point to a different completed document of the same kind. Other states have a null conversion target. Recorded header amounts remain separate from calculated line totals.

Line sales fields are `productId`, `productName`, `categoryId`, `categoryName`, `unit`, `unitNet`, `discountRate`, `taxRate`, `tax`, `gross`, and `meaning`. Unit is `piece`, `kg`, or `unknown`. Meaning is `known` or `unknown`. Quantity and unit price are nonnegative magnitudes, each bounded to 20 integer and 15 fractional digits. Document kind determines the financial sign. Recorded return amounts are signed. Discount and tax rates are 0 through 100 with up to six fractional digits. These bounds and meanings apply only to this synthetic mapping.

No unit conversion is inferred. A quantity is already expressed in its declared unit; an unknown unit remains unsupported. Supplier/purchase data does not acquire sales meaning. The application retains unsupported and excluded populations explicitly.

The package parser checks representation and references. The calculator checks inclusion, conversion ambiguity, amounts and reconciliation. A package can therefore be structurally valid while its sales result remains incomplete. The [Phase 5 calculation policy](calculations.md#phase-5-synthetic-sales-policy) describes that distinction.

## Phase 6 synthetic business mapping

`synthetic-business-v1` retains the canonical envelope, three streams, limits, sales fields, synthetic provenance, and `sourceReconciled: false`. It adds explicit cost, purchasing, and inventory evidence. Earlier mappings remain readable and cannot gain these semantics implicitly.

Every document adds nullable `purchasing`. Every line adds `business` with nullable `historicalCost` and `inventory`. Suppliers add a bounded synthetic `name`, restricted to counterparties referenced by purchase/supplier-return documents. No customer, contact, address, tax-identity, or employee field is accepted. This synthetic display field is not a reviewed real-source supplier allowlist.

`historicalCost` records `unitCost`, `unit`, `taxBasis`, `evidence`, `documentedZero`, and `originalSaleLineId`. Unit cost remains a decimal string or null. Supported unit-cost magnitudes use at most 20 integral and 15 fractional digits, matching the calculation precision budget. Cost units are piece, kg, or unknown. KDV basis is net or unknown. Unknown evidence remains explicit rather than becoming a default cost. A return reference identifies an original line within the pinned dataset; the calculator validates its financial applicability.

`purchasing` records invoice/dispatch representation, conversion target, invoiced flag, opaque evidence reference, physical-return state, requested recovery, recognized credit, replacement-settlement state, and settlement evidence. The parser enforces types and exact fields. Financial recognition checks relationships and reconciliation. Recognized credit and confirmed replacement require settlement evidence. Contradictions remain excluded/warned, never silently deduplicated by amount or document ID.

`inventory` records observation date, nullable stock and recorded-waste quantities, opaque evidence reference, and recording completeness. The associated product/unit remains explicit. Observations are not an opening valuation or proof that all losses were recorded.

The [calculation policy](calculations.md#phase-6-synthetic-cost-and-purchasing-policy) defines supported populations. All real-source evidence obligations remain open.
