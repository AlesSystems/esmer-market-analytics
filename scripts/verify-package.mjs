import { extractFile, listPackage, statFile } from "@electron/asar";
import { basename, dirname } from "node:path";

try {
  const archive = process.argv[2];
  if (!archive || process.argv.length !== 3) throw new Error();
  const entries = listPackage(archive).map((entry) => entry.slice(1));
  const packages = [];
  for (const entry of entries) {
    if (
      !/(?:^|\/)node_modules\/(?:@[^/]+\/)?[^/]+\/package\.json$/.test(
        entry.replaceAll("\\", "/"),
      )
    )
      continue;
    const { name, version } = JSON.parse(extractFile(archive, entry).toString());
    if (typeof name !== "string" || typeof version !== "string") continue;
    if (
      !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(name) ||
      !/^[0-9a-z.+-]+$/i.test(version)
    )
      throw new Error();
    const directory = dirname(entry);
    const noticeFiles = entries.filter(
      (candidate) =>
        dirname(candidate) === directory &&
        /^(?:LICEN[CS]E|COPYING)(?:[._-].*)?$/i.test(basename(candidate)) &&
        "size" in statFile(archive, candidate) &&
        extractFile(archive, candidate).toString().trim().length > 0,
    );
    packages.push({ name, version, directory, noticeFiles });
  }
  if (packages.length === 0) throw new Error();
  const missing = packages.filter(({ noticeFiles }) => noticeFiles.length === 0);
  for (const { name, version } of missing)
    console.error(`PACKAGE_NOTICE_MISSING ${name}@${version}`);
  if (missing.length > 0) process.exitCode = 1;
  else console.log(`PACKAGE_NOTICES_OK ${packages.length} dependencies`);
} catch {
  console.error("PACKAGE_INSPECTION_FAILED");
  process.exitCode = 1;
}
