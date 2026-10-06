# Selected estimate design

Candidate A is the base. Candidate B adds durable estimate dataset/report history, which requires migrations and wider validator changes. Transient estimates with full export and source recovery satisfy this V1.

The independent review in [design-review.md](design-review.md) agrees on A. The final [contract](../../docs/contracts/recorded-estimates.md) replaces the draft ambiguities with precision 200, no summed physical quantities, null when no valid amount operands exist, and a deterministic primary exclusion reason per line. The selected contract governs implementation. The superseded candidate sketches were removed; the independent review retains their comparison and required corrections.

B contributes explicit assumption/version identity and a distinct report format. Both designs keep existing financial recognition and accepted-report validation unchanged. The review considered both candidates. Review uses independently scoped agents from the same model family.

Model the Domain keeps assumption-based estimates in a separate typed capability. Laziness Protocol keeps the existing raw import and encrypted recovery paths instead of adding tables and report history. Prove It Works requires packaged use and independent real Decimal comparisons before shipping.

Implementation owns application changes and focused unit/integration tests. Root owns private package preparation, real reconciliation, documentation and final integration. Packaged checks and independent reviews follow implementation. No new SQL read is required.
