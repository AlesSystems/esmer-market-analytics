import { open } from "node:fs/promises";
import { MAX_BYTES } from "../source/package";

export async function readPackageFile(path: string, maximum = MAX_BYTES): Promise<Uint8Array> {
  if (!Number.isSafeInteger(maximum) || maximum < 0) throw new Error("INVALID_PACKAGE");
  const file = await open(path, "r");
  try {
    const stat = await file.stat();
    if (!stat.isFile() || !Number.isSafeInteger(stat.size) || stat.size < 0 || stat.size > maximum) throw new Error("INVALID_PACKAGE");
    const bytes = Buffer.alloc(stat.size);
    let length = 0;
    while (length < bytes.length) {
      const { bytesRead } = await file.read(bytes, length, bytes.length - length, null);
      if (bytesRead === 0) throw new Error("INVALID_PACKAGE");
      length += bytesRead;
    }
    const probe = Buffer.alloc(1);
    if ((await file.read(probe, 0, 1, null)).bytesRead !== 0) throw new Error("INVALID_PACKAGE");
    return bytes;
  } finally { await file.close(); }
}
