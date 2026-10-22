# Exact raw columns and cold-load work

Issue #92. A comma-bearing key could impersonate two adjacent required columns under comma-joined signatures. A synthetic package passed import and then caused DecimalError during estimate calculation. Two regressions failed before the fix: writer rejection and canonical, correctly hashed reader rejection. The latter also exercises actual store admission and confirms an invalid replacement cannot poison the prior estimate.

Validation now compares the count of enumerable own keys and membership in a fixed expected Set. Thus extra, missing and comma-bearing names cannot collide. Expected row-key Sets are prepared once; no validation or hash check is skipped. The related validators elsewhere were not changed without their own reproducible gap.

The singleton aggregate fast path reuses already normalized decimal strings. Multi-line addition and its order are unchanged. A reference oracle using the original Decimal aggregation checks 70 combinations of missing, zero, negative zero, negative, fractional-tail, maximum integer/fraction precision, return and cost cases, including 140-digit products.

Performance evidence is synthetic Linux only. Three alternating pre-change max-diversity runs were 2685/2827/2566 ms cold. Final strict Set variant runs were 2116/2314/2435 ms (median 2314 ms versus baseline 2685 ms, about 14% lower). The earlier serialized-signature candidate is not claimed as the final result. First load remains above 2 seconds on this maximum-diversity fixture. An independent run under concurrent work measured 2884 ms cold and 19/16 ms warm, so these observations are not a controlled performance guarantee. Warm paging remains bounded. A first-load optimization is not a waiver of Windows performance acceptance.
