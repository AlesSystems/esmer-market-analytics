# R39 native-rule metadata design

Metadata-only next step, 2026-10-01. Root owns execution. No SQL, container, definition body, or business values were accessed for this design.

The initial query file was `/tmp/esmer-r39-value-20261001/native-metadata.sql`, SHA-256 `3218af95b39e0dfab47912b126e8b0171cb0245891d1f01bf5cde8cb6f59d8f8`. It preserves the prior draft's three candidate paths: exact known names `FIS_ARSIVLE` and `RP_MALIYET_FIS_DETAY`, modules mentioning `BELGE_TARIHINDEKI_SON_ALIS_FIYATI`, and triggers attached to `dbo.FIS` or `dbo.FIS_DETAY`.

The historical names come from [audit lines on deletion and costing](../../docs/superpowers/specs/2026-09-04-esmer-market-rebuild-audit.md). The later narrow receipt establishes current presence of the two named objects. Operative paths and vendor provenance remain unestablished. The table-column catalog supplies no routine identities.

## Exact output and envelope

The query returns at most 65 metadata rows as one JSON array. The caller rejects row 65 and output over 1 MiB before publication. Use the existing 15-second request and 60-second pass deadline. Both GUID equality and READ_ONLY state are checked before and after. Replace `$(ExpectedDatabaseId)` only with the independently pinned canonical GUID, never unvalidated text. Hash the reviewed template before substitution and retain the substituted-query hash privately. On guard, timeout, cancellation, missing expected object, duplicate object ID, or bound failure, discard output and close the connection.

Output fields are object ID, schema, name, type, creation/modification timestamps, definition byte length/hash, historical-column mention flag, document-trigger attachment flag/table, and trigger disabled/instead-of flags. IDs, flags, lengths, and dates are exact strings or null. No body, free text, source row, native routine execution, DDL/DML, or configuration change is emitted or performed. Metadata remains private until reviewed.

The source-side `sys.sql_modules.definition` expression is used only for a fixed substring test, `DATALENGTH`, and SHA-256. It is not returned. This is definition-derived metadata, not a catalog dependency proof. The required visibility includes `sys.objects`, `sys.sql_modules`, `sys.triggers`, and the separately reviewed live safety metadata. Do not interpret filtered or invisible modules as absent. Known objects use left joins so encrypted, non-SQL, or invisible definitions can remain present with null body metadata. Do not broaden permissions implicitly to settle missing visibility.

A substring hit may be a read, assignment, comment, or dead code. A trigger attachment does not establish that it is enabled or relevant to snapshot population. Created/modified timestamps and SHA-256 establish current artifact identity, not vendor originality. The restored backup includes legacy additions. No installed BAY.t product/version claim follows.

## Choose the next definition scope from the receipt

If an enabled FIS/FIS_DETAY trigger mentions the historical field, its exact definition is the strongest bounded candidate for proving how that field is assigned on this copy. If only reporting functions read the field, their bodies cannot establish snapshot population. `RP_MALIYET_FIS_DETAY` is historically a reporting cost routine and is not a snapshot writer by default. `FIS_ARSIVLE` can potentially establish delete/archive behavior, not completed-sale status by itself.

After metadata review, root can freeze a separate private definition scope for at most two exact schema/object IDs per pass, each at most 64 KiB, pinned to the observed SHA-256. Reject changed hashes, oversized/null definitions, or unavailable provenance. Review bodies privately for literal assignments, originating fields, type/status branches, operation timing, and parameterized call paths. Never execute the native routine or publish definitions containing free text, literals, SQL, or legacy code. A required callee becomes another exact reviewed node rather than permission to read every routine.

A source-native assignment can demonstrate recorded implementation behavior independently of this application's calculators if its operative path and provenance are established. It may support unit/tax basis when that basis is explicit and traced to inputs. A surviving name, mention, or apparent equation alone cannot do so. Disabled/dead paths, client-side assignments, dynamic SQL, custom legacy objects, or unresolved upstream basis leave the rule unsupported.

Completion requires a literal operative status transition or completed-document rule, including exclusions and converted types. If no such source-native rule exists in this receipt, table values alone cannot settle completion. The metadata pass is useful even then because it records the actual available proof ceiling. No financial activation follows from discovery.

The exact query hash, four local safety assertions, TOP sentinel, JSON format, and document whitespace were checked locally. Root and the independent reviewer must validate the actual metadata receipt and any subsequent scope. Windows remains with the user.

## Observed narrow result

The accepted narrow query is `/tmp/esmer-r39-value-20261001/native-metadata-exact.sql`, SHA-256 `7529a898e9ce514057b595f917a870e5745da2d74e770a60982e227cd83317ad`. Its selector contains only the two exact names or attached document triggers. The field-mention test remains an output flag, not a broad candidate selector.

The initial broad mention search hit the 65-row sentinel and was rejected; its partial rows are not a catalog. A separately reviewed query limited to the two exact historical names or document triggers succeeded with two objects. Both known routines exist; the sole attached document trigger is enabled on FIS. Neither selected definition mentions the historical-cost column. This does not establish a snapshot writer, completed-sale rule, or the absence of such rules elsewhere. No routine definition was returned or executed. See [receipt](r39-native-metadata-receipt.json).

## Final bounded writer-candidate attempt

A separately reviewed metadata query tested fixed direct INSERT/UPDATE patterns on FIS_DETAY together with a historical-cost-column mention. It returned only the prior 13 metadata fields plus two string pattern flags, bounded to 64 rows and 1 MiB. Normalization used binary collation before uppercase conversion; scalar JSON framing preserved a legitimate empty array. This lexical search could match comments or strings and miss aliases, dynamic SQL or client writes. Even a successful empty result would not prove absence of writers.

The exact query SHA-256 was `b2bcac0eefca83e85b3b42c5ee6db583ba93c4328f6e94d85745f7a6548e01f1`; operator `a7dc2bc829fa09c804f378f1a87935e279a84bcf0a5fade8ed033718b9768950`; dependency registry `5b4a9082b2582704e2d954eff72cd9d8f93bf9e944923297c4e63c369676a717`. An independent reviewer passed those exact artifacts before execution. Three valid and eight invalid parser cases, three cleanup fault cases, hash checks and serialization/collation checks passed locally.

Actual execution returned `ETIMEOUT` under the bounded client request/connection limits, with no accepted catalog. The retained error does not distinguish the connection stage from the query stage, so neither a completed search nor before/after SQL guards are claimed for this attempt. No definition body or user-table value was selected and no native routine was executed. Copy stopped, temporary client absent, temporary administrator credential removed and zero cleanup errors were independently checked by the operator. See the [failed-attempt receipt](r39-native-writer-attempt.json). The timeout is preserved without widening the search or claiming that the backup contains no usable native rules.

The current bounded investigation therefore remains insufficient for financial activation. Further useful evidence must establish an operative native assignment and its input basis, or provide authoritative source semantics and independent business examples. Repeating sampled arithmetic cannot supply those missing meanings.
