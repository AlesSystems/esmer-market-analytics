import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { open, rm, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { keyIdentity } from "./keys";
export type BackupHeader = {format:"esmer-backup-v1";id:string;keyId:string;createdAt:string;kind:"ordinary"|"pre-upgrade";generation:number;nonce:string};
const MAGIC = Buffer.from("ESMERBK1");
export const MAX_BACKUP_BYTES = 16 * 1024 * 1024 * 1024;
export async function encryptSnapshot(source: string, target: string, key: Uint8Array, metadata: Omit<BackupHeader,"format"|"keyId"|"nonce">): Promise<BackupHeader> {
  const header: BackupHeader = {...metadata,format:"esmer-backup-v1",keyId:keyIdentity(key),nonce:randomBytes(12).toString("base64")};
  const json = Buffer.from(JSON.stringify(header)); const length = Buffer.alloc(4); length.writeUInt32BE(json.length);
  const aad = Buffer.concat([MAGIC,length,json]);
  const size = (await stat(source)).size; if (size > MAX_BACKUP_BYTES) throw new Error("BACKUP_TOO_LARGE");
  const file = await open(target,"wx",0o600); try { await file.writeFile(aad); } finally { await file.close(); }
  const cipher = createCipheriv("aes-256-gcm",key,Buffer.from(header.nonce,"base64")); cipher.setAAD(aad);
  try {
    await pipeline(createReadStream(source),cipher,createWriteStream(target,{flags:"a",mode:0o600}));
    const output = await open(target,"a"); try { await output.writeFile(cipher.getAuthTag()); await output.sync(); } finally { await output.close(); }
    return header;
  } catch(error) { await rm(target,{force:true}); throw error; }
}
export async function decryptSnapshot(source: string, target: string, key: Uint8Array): Promise<BackupHeader> {
  const file = await open(source,"r");
  let header: BackupHeader, aad: Buffer, offset: number, end: number, tag: Buffer;
  try {
    const size = (await file.stat()).size;
    if (size < 44 || size > MAX_BACKUP_BYTES + 4096) throw new Error("INVALID_BACKUP");
    const prefix = Buffer.alloc(12); await file.read(prefix,0,12,0);
    const length = prefix.readUInt32BE(8);
    if (!prefix.subarray(0,8).equals(MAGIC) || length < 1 || length > 2048 || size < 12+length+17) throw new Error("INVALID_BACKUP");
    const json = Buffer.alloc(length); await file.read(json,0,length,12);
    header = JSON.parse(json.toString("utf8"));
    if (!header || header.format !== "esmer-backup-v1" || !/^[a-f0-9-]{36}$/.test(header.id) || header.keyId !== keyIdentity(key) || !["ordinary","pre-upgrade"].includes(header.kind) || !Number.isSafeInteger(header.generation) || header.generation < 0 || typeof header.createdAt !== "string" || new Date(header.createdAt).toISOString() !== header.createdAt || !/^[A-Za-z0-9+/]{16}$/.test(header.nonce)) throw new Error("INVALID_BACKUP");
    aad = Buffer.concat([prefix,json]); offset = aad.length; end = size-17; tag=Buffer.alloc(16); await file.read(tag,0,16,size-16);
  } finally { await file.close(); }
  const decipher = createDecipheriv("aes-256-gcm",key,Buffer.from(header.nonce,"base64")); decipher.setAAD(aad); decipher.setAuthTag(tag);
  const output = await open(target,"wx",0o600);
  try {
    await pipeline(createReadStream(source,{start:offset,end}),decipher,output.createWriteStream());
    const completed=await open(target,"r+"); try { await completed.sync(); } finally { await completed.close(); }
    return header;
  } catch(error) { await output.close(); await rm(target,{force:true}); throw error; }
  finally { await output.close(); }
}
