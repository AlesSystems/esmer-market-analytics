# Production dependency remediation

Issue #86. On 2026-10-19, `npm audit --omit=dev` identified the moderate sprintf-js advisory GHSA-hp3w-g68c-fv3c through tedious 20.0.0. The advisory requires attacker control of precision format strings. Independent inspection found only fixed format literals in tedious and no app path supplying a format, so an exploitable Esmer denial of service was not established.

Pinned tedious 20.3.8 removes that production dependency. The lock delta changes only tedious's package version; existing resolved dependencies satisfy its ranges. Official package metadata remains MIT and Node>=22, compatible with the project's Node 24 toolchain. The driver is JavaScript, not a native ABI addition. The official release is https://github.com/tediousjs/tedious/releases/tag/v20.3.8 and advisory is https://github.com/advisories/GHSA-hp3w-g68c-fv3c . Production npm audit reports zero known findings after the update; this is a registry snapshot, not a security guarantee.

SQL adapter tests use synthetic/mock inputs. No real SQL connection was made. Packaged Windows/live-server authentication and operational compatibility remain release gates. Production code, encryption settings and permission boundaries are unchanged.
