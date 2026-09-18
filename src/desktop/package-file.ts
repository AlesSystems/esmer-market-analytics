import { open } from "node:fs/promises";
import { MAX_BYTES } from "../source/package";

export async function readPackageFile(path: string): Promise<Uint8Array> {
  const file = await open(path, "r");
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error("INVALID_PACKAGE");
    const bytes = Buffer.alloc(MAX_BYTES + 1);
    let length = 0;
    while (length < bytes.length) {
      const { bytesRead } = await file.read(bytes, length, bytes.length - length, null);
      if (bytesRead === 0) break;
      length += bytesRead;
    }
    if (length > MAX_BYTES) throw new Error("INVALID_PACKAGE");
    return bytes.subarray(0, length);
  } finally { await file.close(); }
}
