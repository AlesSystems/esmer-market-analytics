import { createHash, randomBytes } from "node:crypto";
export function generateRecoveryKey(): Buffer { return randomBytes(32); }
export function keyIdentity(key: Uint8Array): string {
  if (!(key instanceof Uint8Array) || key.byteLength !== 32) throw new Error("INVALID_RECOVERY_KEY");
  return createHash("sha256").update(key).digest("hex");
}
export function encodeRecoveryKey(key: Uint8Array): string {
  return JSON.stringify({format:"esmer-recovery-key-v1",key:Buffer.from(key).toString("base64"),id:keyIdentity(key)}) + "\n";
}
export function decodeRecoveryKey(input: string | Uint8Array): Buffer {
  if (input.length > 1024) throw new Error("INVALID_RECOVERY_KEY");
  const value = JSON.parse(typeof input === "string" ? input : Buffer.from(input).toString("utf8"));
  if (!value || value.format !== "esmer-recovery-key-v1" || typeof value.key !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(value.key)) throw new Error("INVALID_RECOVERY_KEY");
  const key = Buffer.from(value.key,"base64");
  if (keyIdentity(key) !== value.id) throw new Error("INVALID_RECOVERY_KEY");
  return key;
}
