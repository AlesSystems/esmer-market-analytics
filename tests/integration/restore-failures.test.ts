import { afterEach, expect, test, vi } from "vitest";
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { Recovery } from "../../src/recovery/backup";
import { generateRecoveryKey } from "../../src/recovery/keys";
import { encryptSnapshot } from "../../src/recovery/cipher";
import { openStore } from "../../src/store/store";
import { recoverInterruptedSwitch, switchStore, type SwitchBoundary } from "../../src/recovery/restore";
import { durableWrite } from "../../src/recovery/files";
vi.mock("../../src/recovery/files",async importOriginal=>{
  const original=await importOriginal<typeof import("../../src/recovery/files")>();
  return {...original,durableWrite:vi.fn(original.durableWrite)};
});
const directories:string[]=[];
afterEach(()=>{for(const directory of directories.splice(0))rmSync(directory,{recursive:true,force:true});});
function setup(){const directory=mkdtempSync(join(tmpdir(),"restore-failure-"));directories.push(directory);const destination=join(directory,"external");mkdirSync(destination);return{directory,path:join(directory,"analytics.sqlite"),config:{destination,key:generateRecoveryKey()}};}
function change(recovery:Recovery,id:string){recovery.store!.appendRevision({kind:"setting",entityId:id,value:{currency:"TRY",reason:"Recovery test",evidence:"fixture:recovery"}});}

test("wrong keys, changed ciphertext and truncated artifacts leave current data usable",async()=>{
  const {directory,path,config}=setup();const recovery=await Recovery.open(path,config);
  try{
    change(recovery,"original");await recovery.backupNow();
    const artifact=join(config.destination,`${recovery.status().backups[0].id}.esmerbackup`),before=recovery.store!.readSnapshot();
    await expect(recovery.prepareRestore(artifact,generateRecoveryKey())).rejects.toThrow();
    const bytes=readFileSync(artifact);bytes[bytes.length-20]^=1;const tampered=join(directory,"tampered");writeFileSync(tampered,bytes);
    await expect(recovery.prepareRestore(tampered,config.key)).rejects.toThrow();
    writeFileSync(tampered,bytes.subarray(0,bytes.length-9));await expect(recovery.prepareRestore(tampered,config.key)).rejects.toThrow();
    expect(recovery.store!.readSnapshot()).toEqual(before);
    expect(readdirSync(directory).filter(x=>x.startsWith(".esmer-recovery-"))).toEqual([]);
  }finally{await recovery.close();}
});

test("an intervening write invalidates restore confirmation",async()=>{
  const {path,config}=setup();const recovery=await Recovery.open(path,config);
  try{change(recovery,"first");await recovery.backupNow();const preview=await recovery.prepareRestore(join(config.destination,`${recovery.status().backups[0].id}.esmerbackup`),config.key);change(recovery,"second");await expect(recovery.confirmRestore(preview.token)).rejects.toThrow("RESTORE_STALE");expect(recovery.store!.readSnapshot().app).toHaveLength(2);await recovery.cancelRestore(preview.token);}finally{await recovery.close();}
});

for(const corruption of ["future","extra-table","missing-evidence","invalid-file"] as const)test(`authenticated ${corruption} candidate is rejected before switching`,async()=>{
  const {directory,path,config}=setup();const recovery=await Recovery.open(path,config);
  try{
    change(recovery,"current");const before=recovery.store!.readSnapshot(),candidate=join(directory,"candidate.sqlite");
    if(corruption==="invalid-file")writeFileSync(candidate,"not a database");
    else{
      const other=openStore(candidate);other.acceptReport({id:"report",pin:other.readPin(),calculationVersion:"v0",evidence:["fixture:evidence"],output:{net:"1"}});other.close();
      const db=new DatabaseSync(candidate);try{db.exec(corruption==="future"?"PRAGMA user_version=999":corruption==="extra-table"?"CREATE TABLE secret(value TEXT)":"DELETE FROM evidence_references");}finally{db.close();}
    }
    const artifact=join(directory,"malformed.esmerbackup");await encryptSnapshot(candidate,artifact,config.key,{id:randomUUID(),createdAt:new Date().toISOString(),kind:"ordinary",generation:2});
    await expect(recovery.prepareRestore(artifact,config.key)).rejects.toThrow();expect(recovery.store!.readSnapshot()).toEqual(before);
  }finally{await recovery.close();}
});

for(const boundary of ["journal","old-moved","candidate-moved","opened"] as SwitchBoundary[])test(`restore failure at ${boundary} reopens original data`,async()=>{
  const {path,config}=setup();let recovery=await Recovery.open(path,config);
  change(recovery,"backed-up");await recovery.backupNow();const artifact=join(config.destination,`${recovery.status().backups[0].id}.esmerbackup`);change(recovery,"newer");const before=recovery.store!.readSnapshot();await recovery.close();
  recovery=await Recovery.open(path,config,{fault:point=>{if(point===boundary)throw new Error("interrupted");}});
  try{const preview=await recovery.prepareRestore(artifact,config.key);await expect(recovery.confirmRestore(preview.token)).rejects.toThrow("interrupted");expect(recovery.store!.readSnapshot()).toEqual(before);}finally{await recovery.close();}
});

test("startup recovers a crash after candidate rename before any database can be created",async()=>{
  const {directory,path}=setup();const original=openStore(path);original.appendRevision({kind:"setting",entityId:"preserved",value:{currency:"TRY",reason:"original",evidence:"fixture:original"}});const before=original.readSnapshot();original.close();
  const candidate=join(directory,`.esmer-candidate-${randomUUID()}.sqlite`);const next=openStore(candidate);next.close();
  await expect(switchStore(path,candidate,()=>{},boundary=>{if(boundary==="candidate-moved")throw new Error("power-loss");})).rejects.toThrow("power-loss");
  const recovery=await Recovery.open(path);try{expect(recovery.store!.readSnapshot()).toEqual(before);}finally{await recovery.close();}
});

test("restore remains available when the original database is corrupt",async()=>{
  const {directory,path,config}=setup();let recovery=await Recovery.open(path,config);change(recovery,"independent");await recovery.backupNow();const artifact=join(config.destination,`${recovery.status().backups[0].id}.esmerbackup`);await recovery.close();writeFileSync(path,"corrupt original");
  recovery=await Recovery.open(path);try{expect(recovery.store).toBeNull();const preview=await recovery.prepareRestore(artifact,config.key);expect(await recovery.confirmRestore(preview.token)).toEqual({status:"restored"});expect(recovery.store!.readSnapshot().app).toHaveLength(1);expect(readdirSync(directory).some(x=>x.startsWith(".esmer-rollback-"))).toBe(true);}finally{await recovery.close();}
});

test("switch rollback preserves the closed original sidecar family",async()=>{
  const {directory,path}=setup();const store=openStore(path);store.close();const candidate=join(directory,`.esmer-candidate-${randomUUID()}.sqlite`);copyFileSync(path,candidate);
  writeFileSync(path+"-wal","retained WAL");writeFileSync(path+"-shm","retained SHM");
  await expect(switchStore(path,candidate,()=>{},boundary=>{if(boundary==="candidate-moved")throw new Error("crash");})).rejects.toThrow();
  await recoverInterruptedSwitch(path);expect(readFileSync(path+"-wal","utf8")).toBe("retained WAL");expect(readFileSync(path+"-shm","utf8")).toBe("retained SHM");
});

test("injected isolated migration failure preserves the working database",async()=>{
  const {directory,path,config}=setup();const {migrate}=await import("../../src/store/migrations");
  const older=join(directory,"older.sqlite"),db=new DatabaseSync(older);migrate(db,5);db.close();
  const artifact=join(directory,"older.esmerbackup");await encryptSnapshot(older,artifact,config.key,{id:randomUUID(),createdAt:new Date().toISOString(),kind:"ordinary",generation:0});
  const recovery=await Recovery.open(path,undefined,{fault:boundary=>{if(boundary==="migration")throw new Error("INJECTED_MIGRATION_FAILURE");}});
  try{change(recovery,"preserved");const before=recovery.store!.readSnapshot();await expect(recovery.prepareRestore(artifact,config.key)).rejects.toThrow("INJECTED_MIGRATION_FAILURE");expect(recovery.store!.readSnapshot()).toEqual(before);}finally{await recovery.close();}
});

test("injected ENOSPC after journaling rolls back without losing current records",async()=>{
  const {path,config}=setup();let recovery=await Recovery.open(path,config);change(recovery,"backup");await recovery.backupNow();const artifact=join(config.destination,`${recovery.status().backups[0].id}.esmerbackup`);change(recovery,"current");const before=recovery.store!.readSnapshot();await recovery.close();
  recovery=await Recovery.open(path,undefined,{fault:boundary=>{if(boundary==="journal")throw Object.assign(new Error("ENOSPC"),{code:"ENOSPC"});}});
  try{const preview=await recovery.prepareRestore(artifact,config.key);await expect(recovery.confirmRestore(preview.token)).rejects.toMatchObject({code:"ENOSPC"});expect(recovery.store!.readSnapshot()).toEqual(before);}finally{await recovery.close();}
});

test("restart after rollback base rename still opens the preserved original",async()=>{
  const {directory,path}=setup();const original=openStore(path);original.appendRevision({kind:"setting",entityId:"preserved",value:{currency:"TRY",reason:"original",evidence:"fixture:original"}});const before=original.readSnapshot();original.close();
  const candidate=join(directory,`.esmer-candidate-${randomUUID()}.sqlite`);const next=openStore(candidate);next.close();
  await expect(switchStore(path,candidate,()=>{},boundary=>{if(boundary==="candidate-moved")throw new Error("power-loss");})).rejects.toThrow();
  await expect(recoverInterruptedSwitch(path,(boundary,index)=>{if(boundary==="rollback-renamed"&&index===1)throw new Error("second-power-loss");})).rejects.toThrow("second-power-loss");
  await expect(recoverInterruptedSwitch(path)).resolves.toBeUndefined();
  const recovered=await Recovery.open(path);try{expect(recovered.store!.readSnapshot()).toEqual(before);}finally{await recovered.close();}
});

test("unavailable audit storage blocks restore before any destructive switch",async()=>{
  const {directory,path,config}=setup();const recovery=await Recovery.open(path,config);
  try{
    change(recovery,"backup");await recovery.backupNow();const artifact=join(config.destination,`${recovery.status().backups[0].id}.esmerbackup`);
    change(recovery,"current");const before=recovery.store!.readSnapshot();
    rmSync(join(directory,"recovery-audit.jsonl"));mkdirSync(join(directory,"recovery-audit.jsonl"));
    await expect(recovery.prepareRestore(artifact,config.key)).rejects.toThrow("AUDIT_UNAVAILABLE");
    expect(recovery.store!.readSnapshot()).toEqual(before);
  }finally{await recovery.close();}
});

test("repeated crashes after every rollback rename preserve real committed WAL records",async()=>{
  const {directory,path}=setup();openStore(path).close();
  const {execFileSync}=await import("node:child_process");
  execFileSync(process.execPath,["-e",`const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(process.argv[1]);db.exec('PRAGMA journal_mode=WAL');db.prepare('INSERT INTO app_revisions(kind,entity_id,value_json,created_at) VALUES(?,?,?,?)').run('setting','wal-record',JSON.stringify({currency:'TRY',reason:'Committed WAL',evidence:'fixture:wal'}),new Date().toISOString());process.exit(0);`,path]);
  const wal=readFileSync(path+"-wal");expect(wal.length).toBeGreaterThan(0);
  const candidate=join(directory,`.esmer-candidate-${randomUUID()}.sqlite`);openStore(candidate).close();
  await expect(switchStore(path,candidate,()=>{},point=>{if(point==="candidate-moved")throw new Error("crash");})).rejects.toThrow();
  for(let step=0;step<4;step++)await expect(recoverInterruptedSwitch(path,(point,index)=>{if(point==="rollback-renamed"&&index===step)throw new Error(`crash-${step}`);})).rejects.toThrow(`crash-${step}`);
  await recoverInterruptedSwitch(path);expect(readFileSync(path+"-wal")).toEqual(wal);
  const recovery=await Recovery.open(path);try{expect(recovery.store!.readSnapshot().app.map(row=>row.entityId)).toEqual(["wal-record"]);}finally{await recovery.close();}
});

test("failed durable outcome write rolls back and records the resulting state",async()=>{
  const {directory,path,config}=setup();const recovery=await Recovery.open(path,config);const actual=await vi.importActual<typeof import("../../src/recovery/files")>("../../src/recovery/files");
  try{
    change(recovery,"backup");await recovery.backupNow();const backupId=recovery.status().backups[0].id;change(recovery,"current");const before=recovery.store!.readSnapshot();
    const preview=await recovery.prepareRestore(join(config.destination,`${backupId}.esmerbackup`),config.key);let failed=false;
    vi.mocked(durableWrite).mockImplementation(async(target,bytes)=>{if(!failed&&String(target).includes(".esmer-restore-outcome-")){failed=true;throw Object.assign(new Error("ENOSPC"),{code:"ENOSPC"});}return actual.durableWrite(target,bytes);});
    await expect(recovery.confirmRestore(preview.token)).rejects.toMatchObject({code:"ENOSPC"});expect(failed).toBe(true);expect(recovery.store!.readSnapshot()).toEqual(before);
    const outcome=readdirSync(directory).find(name=>name.startsWith(".esmer-restore-outcome-"))!;expect(JSON.parse(readFileSync(join(directory,outcome),"utf8"))).toMatchObject({identity:backupId,result:"rolled-back"});
  }finally{vi.mocked(durableWrite).mockImplementation(actual.durableWrite);await recovery.close();}
});

test("crash after durable success outcome keeps restored data and finishes journal cleanup on restart",async()=>{
  const {directory,path,config}=setup();let recovery=await Recovery.open(path,config);change(recovery,"backup");await recovery.backupNow();const backupId=recovery.status().backups[0].id;change(recovery,"newer");await recovery.close();
  recovery=await Recovery.open(path,undefined,{fault:point=>{if(point==="outcome-written")throw new Error("crash-after-commit");}});
  const preview=await recovery.prepareRestore(join(config.destination,`${backupId}.esmerbackup`),config.key);
  await expect(recovery.confirmRestore(preview.token)).rejects.toThrow("RESTORE_COMMITTED_RESTART_REQUIRED");expect(recovery.store).toBeNull();await recovery.close();
  recovery=await Recovery.open(path);
  try{expect(recovery.store!.readSnapshot().app.map(row=>row.entityId)).toEqual(["backup"]);const outcome=readdirSync(directory).find(name=>name.startsWith(".esmer-restore-outcome-"))!;expect(JSON.parse(readFileSync(join(directory,outcome),"utf8"))).toMatchObject({identity:backupId,result:"restored"});expect(readdirSync(directory)).not.toContain("analytics.sqlite.restore-journal");}finally{await recovery.close();}
});

test("unavailable rollback audit retains original files and reports recovery required until repaired",async()=>{
  const {directory,path}=setup();const original=openStore(path);original.appendRevision({kind:"setting",entityId:"original",value:{currency:"TRY",reason:"original",evidence:"fixture:original"}});original.close();
  const candidate=join(directory,`.esmer-candidate-${randomUUID()}.sqlite`);openStore(candidate).close();
  await expect(switchStore(path,candidate,()=>{},point=>{if(point==="candidate-moved")throw new Error("crash");})).rejects.toThrow();
  const journal=JSON.parse(readFileSync(`${path}.restore-journal`,"utf8")),outcome=join(directory,journal.outcome);
  await expect(recoverInterruptedSwitch(path,(point,index)=>{if(point==="rollback-advanced"&&index===2)mkdirSync(outcome);})).rejects.toThrow();
  let recovery=await Recovery.open(path);expect(recovery.store).toBeNull();expect(recovery.status()).toMatchObject({state:"failed",error:{code:"RESTORE_RECOVERY_REQUIRED"}});await recovery.close();
  rmSync(outcome,{recursive:true});recovery=await Recovery.open(path);try{expect(recovery.store!.readSnapshot().app[0].entityId).toBe("original");}finally{await recovery.close();}
});
