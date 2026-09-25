import { expect, test } from "vitest";
import { mkdtemp, writeFile, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { collectSourceEvidence } from "../../tools/collect-source-evidence";

const batch = "10000000-0000-4000-8000-000000000001";
const schema = [
  "FIS|ID|bigint|19|0", "FIS|FIS_TURU|int|10|0", "FIS|FIS_TARIHI|datetime|23|3", "FIS|DOVIZ_AD|bigint|19|0", "FIS|DURUM|bit|1|0", "FIS|AKTIF|bit|1|0",
  "FIS_DETAY|ID|bigint|19|0", "FIS_DETAY|FIS|bigint|19|0", "FIS_DETAY|STOK|bigint|19|0",
  "FIS_DETAY|BELGE_TARIHINDEKI_SON_ALIS_FIYATI|decimal|18|8", "FIS_DETAY|CARPAN|decimal|18|8", "FIS_DETAY|MIKTAR_FIS|decimal|18|3", "FIS_DETAY|TOPLAM_KDV_MATRAHI|decimal|18|8", "FIS_DETAY|TOPLAM_KDV|decimal|18|8",
  "STOK|ID|bigint|19|0", "DOVIZ_AD|ID|bigint|19|0", "DOVIZ_AD|AD|nvarchar|0|0",
];
const protocol = ["STATE|before|1", "ENGINE|16.0.1000.6|3|160", ...schema.map(s => `SCHEMA|${s}`), "COUNT|FIS|9007199254740993", "COUNT|FIS_DETAY|0", "COUNT|STOK|1", "GROUP|11|TRY|9007199254740993|2026-01-01T00:00:00.000|2026-01-02T00:00:00.000", "STATE|after|1"].join("\n") + "\n";
async function fixture(program = `process.stdout.write(${JSON.stringify(protocol)});`) {
  const dir = await mkdtemp(join(tmpdir(), "PRIVATE_EVIDENCE-"));
  const executable = join(dir, "sqlcmd");
  await writeFile(executable, `#!${process.execPath}\n${program}\n`, { mode: 0o700 });
  const configPath = join(dir, "PRIVATE_CONFIG.json");
  await writeFile(configPath, JSON.stringify({ scope: "isolated-copy", server: "PRIVATE_SERVER", database: "PRIVATE_DATABASE", user: "PRIVATE_USER", sqlcmdPath: executable }));
  return { dir, configPath, destination: join(dir, "evidence.json"), batch, password: "PRIVATE_PASSWORD" };
}

test("collector spawns fixed SQL and preserves exact counts in private exclusive evidence", async () => {
  const f = await fixture(`let sql = ''; process.stdin.on('data', d => sql += d); process.stdin.on('end', () => { if (!sql.includes('COUNT_BIG') || process.argv.includes('PRIVATE_PASSWORD') || process.env.SQLCMDPASSWORD !== 'PRIVATE_PASSWORD' || !process.argv.includes('-N') || process.argv.includes('-X1')) process.exit(9); process.stdout.write(${JSON.stringify(protocol)}); });`);
  try {
    expect(await collectSourceEvidence(f)).toEqual({ ok: true });
    const bytes = await readFile(f.destination, "utf8"); const evidence = JSON.parse(bytes);
    expect(evidence.format).toBe("source-evidence-v1");
    expect(evidence.populations.FIS).toBe("9007199254740993");
    expect(evidence.groups[0].count).toBe("9007199254740993");
    expect(evidence.groups[0].minDate).toBe("2026-01-01T00:00:00.000");
    expect(bytes).not.toContain("PRIVATE_");
    expect((await stat(f.destination)).mode & 0o777).toBe(0o600);
    expect(await collectSourceEvidence(f)).toEqual({ ok: false, code: "EVIDENCE_FAILED" });
    expect(await readFile(f.destination, "utf8")).toBe(bytes);
    expect((await readdir(f.dir)).filter(n => n.endsWith(".partial"))).toEqual([]);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test.each([
  protocol + "PRIVATE_CUSTOMER|secret\n",
  protocol.replace("COUNT|STOK|1", "COUNT|STOK|1\nCOUNT|STOK|1"),
  protocol.replace("STATE|before|1", "STATE|before|0"),
  protocol.replace("9007199254740993", "9e15"),
  protocol.replace("SCHEMA|FIS|ID|bigint|19|0", "SCHEMA|FIS|PRIVATE_NAME|nvarchar|0|0"),
  "x".repeat(131073),
])("rejects malformed or excessive output without publishing", async output => {
  const f = await fixture(`process.stdout.write(${JSON.stringify(output)}); process.stderr.write('PRIVATE_DRIVER_DETAIL');`);
  try {
    expect(await collectSourceEvidence(f)).toEqual({ ok: false, code: "EVIDENCE_FAILED" });
    expect(await readdir(f.dir)).toEqual(expect.not.arrayContaining(["evidence.json"]));
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test("deadline and abort await child termination and leave no artifact", async () => {
  for (const abort of [false, true]) {
    const f = await fixture("require('node:fs').writeFileSync(process.argv[1] + '.pid', String(process.pid)); process.on('SIGTERM', () => {}); setInterval(() => {}, 1000);");
    const controller = new AbortController();
    const timer = abort ? setTimeout(() => controller.abort(), 100) : undefined;
    try {
      expect(await collectSourceEvidence({ ...f, timeoutMs: 150, signal: controller.signal })).toEqual({ ok: false, code: "EVIDENCE_FAILED" });
      expect(await readdir(f.dir)).toEqual(expect.not.arrayContaining(["evidence.json"]));
      const pid = Number(await readFile(join(f.dir, "sqlcmd.pid"), "utf8"));
      expect(() => process.kill(pid, 0)).toThrow();
    } finally { clearTimeout(timer); await rm(f.dir, { recursive: true, force: true }); }
  }
});

test("CLI errors are fixed tokens and invalid config is rejected before spawn", async () => {
  const f = await fixture("process.stderr.write('PRIVATE_DRIVER_ERROR'); process.exit(1);");
  async function run() {
    return new Promise<{ code: number | null; output: string }>(resolve => {
      const child = spawn(process.execPath, ["tools/collect-source-evidence.ts", f.configPath, f.destination, batch], { env: { ...process.env, SQLCMDPASSWORD: f.password } });
      let output = ""; child.stdout.on("data", d => output += d); child.stderr.on("data", d => output += d);
      child.on("close", code => resolve({ code, output }));
    });
  }
  try {
    expect(await run()).toEqual({ code: 1, output: "EVIDENCE_FAILED\n" });
    await writeFile(f.configPath, JSON.stringify({ scope: "isolated-copy", server: "PRIVATE_SERVER", database: "db", user: "sa", sql: "PRIVATE_SQL" }));
    expect(await run()).toEqual({ code: 1, output: "EVIDENCE_FAILED\n" });
    expect(await readdir(f.dir)).toEqual(expect.not.arrayContaining(["evidence.json"]));
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});


test("unapproved config keys fail before starting the trusted executable", async () => {
  const f = await fixture("require('node:fs').writeFileSync(process.argv[1] + '.started', 'yes');");
  try {
    const config = JSON.parse(await readFile(f.configPath, "utf8"));
    for (const extra of [{ sql: "PRIVATE_SQL" }, { password: "PRIVATE_PASSWORD" }, { scope: "production" }, { user: "sa" }]) {
      await writeFile(f.configPath, JSON.stringify({ ...config, ...extra }));
      expect(await collectSourceEvidence(f)).toEqual({ ok: false, code: "EVIDENCE_FAILED" });
      expect(await readdir(f.dir)).not.toContain("sqlcmd.started");
    }
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});
