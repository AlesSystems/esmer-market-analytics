import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { encryptSnapshot, decryptSnapshot } from "../../src/recovery/cipher";

async function fixture(run: (source: string, target: string, key: Buffer) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), "esmer-cipher-ownership-"));
  try {
    const plain = join(directory, "plain"), source = join(directory, "encrypted"), target = join(directory, "target"), key = randomBytes(32);
    await writeFile(plain, "Synthetic backup bytes");
    await encryptSnapshot(plain, source, key, { id: randomUUID(), createdAt: "2026-10-19T00:00:00.000Z", kind: "ordinary", generation: 0 });
    await run(source, target, key);
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test("decryption never removes a pre-existing output on EEXIST", async () => fixture(async (source, target, key) => {
  await writeFile(target, "Existing synthetic sentinel");
  await expect(decryptSnapshot(source, target, key)).rejects.toMatchObject({ code: "EEXIST" });
  expect(await readFile(target, "utf8")).toBe("Existing synthetic sentinel");
}));
test("authentication failure removes only the partial output it created", async () => fixture(async (source, target, key) => {
  const bytes = await readFile(source); bytes[bytes.length - 1] ^= 1; await writeFile(source, bytes);
  await expect(decryptSnapshot(source, target, key)).rejects.toThrow();
  await expect(readFile(target)).rejects.toMatchObject({ code: "ENOENT" });
}));
test("wrong key validation preserves an existing output", async () => fixture(async (source, target) => {
  await writeFile(target, "Existing synthetic sentinel");
  await expect(decryptSnapshot(source, target, randomBytes(32))).rejects.toThrow("INVALID_BACKUP");
  expect(await readFile(target, "utf8")).toBe("Existing synthetic sentinel");
}));
test("successful decryption writes the expected synthetic bytes", async () => fixture(async (source, target, key) => {
  await decryptSnapshot(source, target, key);
  expect(await readFile(target, "utf8")).toBe("Synthetic backup bytes");
}));
