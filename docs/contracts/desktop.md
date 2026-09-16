# Desktop request contract

Phase 1 implements one renderer capability, `window.esmer.getAvailability()`. The TypeScript contract is in `src/domain/contracts.ts`. It reports whether the local service can open an empty SQLite store. It does not read the market system.

## Request and response

The preload sends the fixed `getAvailability` operation with a `null` payload. It does not accept a channel, operation name, SQL string, path, credentials, or arbitrary arguments from the renderer.

The main process verifies the requesting WebContents, main-frame identity, and exact application URL before the operation reaches the service. Unknown operations and every non-null availability payload are rejected. A detached or unrelated frame is untrusted.

Successful availability is exactly:

```json
{"status":"ready","store":"empty","liveConnection":"disabled"}
```

Failures expose only a status, stable code, and Turkish message. They never echo the request body, exception text, stack trace, credentials, or filesystem paths.

| Code | Meaning |
| --- | --- |
| `UNTRUSTED_SENDER` | The sender is not the application's trusted main frame |
| `UNKNOWN_OPERATION` | The named operation is not implemented |
| `INVALID_PAYLOAD` | The availability payload is not `null` |
| `SERVICE_UNAVAILABLE` | The local service cannot provide availability |

The main process rejects invalid requests before invoking service work. Tests assert both the failure result and the absence of a service call.

## Renderer restrictions

The window uses context isolation and the Chromium sandbox, with renderer Node integration and webviews disabled. The preload exposes only the named availability method. Raw IPC, database objects, native modules, source credentials, and file-selection paths are absent from renderer-visible state.

The `esmer://app` protocol serves only bundled, allowlisted UI assets. Network requests, navigation, new windows, and permissions are restricted. The content security policy permits local scripts and styles while denying connections, frames, objects, forms, and arbitrary resource origins.

Desktop tests launch the packaged application to check this boundary. Integration tests cover malformed requests independently of Electron launch so each privileged operation can retain a small rejection test.

## Future operations

Report reads, import preview/confirmation, export, and recovery get individual named methods when those features arrive. Phase 1 exposes none of them. An import request containing SQL is therefore an unknown operation and cannot invoke service work.

Future file selection must return an opaque, service-owned handle. The renderer must never submit an unchecked filesystem path, source credential, or SQL command. Future handlers must validate their exact payload and trusted sender before any privileged work. This is the Phase 1 contract for later phases, not an implemented import or file-selection workflow.
