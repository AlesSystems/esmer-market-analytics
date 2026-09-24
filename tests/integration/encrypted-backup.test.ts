import { afterEach, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openStore } from "../../src/store/store";
const directories: string[] = [];
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, {recursive:true,force:true}); });
test("a committed app change retains pending backup intent after the store restarts", () => {
  const directory = mkdtempSync(join(tmpdir(), "encrypted-backup-")); directories.push(directory);
  const path = join(directory, "analytics.sqlite");
  const store = openStore(path);
  store.appendRevision({kind:"setting",entityId:"currency",value:{currency:"TRY",reason:"Recovery test",evidence:"fixture:recovery"}});
  store.close();
  const db = new DatabaseSync(path);
  try {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE name='recovery_state'").get();
    expect(table, "business commits need durable backup intent").toBeDefined();
    const state = db.prepare("SELECT changed,verified FROM recovery_state WHERE singleton=1").get();
    expect(state?.changed).toBeGreaterThan(Number(state?.verified));
  } finally { db.close(); }
});

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { Recovery } from "../../src/recovery/backup";
import { decodeRecoveryKey, encodeRecoveryKey, generateRecoveryKey } from "../../src/recovery/keys";
import { decryptSnapshot } from "../../src/recovery/cipher";
import { migrate } from "../../src/store/migrations";
function setup() {
  const directory=mkdtempSync(join(tmpdir(),"recovery-crypto-")); directories.push(directory);
  const destination=join(directory,"external"); mkdirSync(destination);
  return {directory,path:join(directory,"analytics.sqlite"),config:{destination,key:generateRecoveryKey()}};
}
function change(recovery:Recovery,id:string) {
  recovery.store!.appendRevision({kind:"setting",entityId:id,value:{currency:"TRY",reason:"Recovery test",evidence:"fixture:recovery"}});
}

test("online backup coalesces writes after snapshot and restart discovers an unacknowledged publication",async()=> {
  const {directory,path,config}=setup(); let first=true; let recovery:Recovery;
  recovery=await Recovery.open(path,config,{fault:boundary=>{if(boundary==="snapshot"&&first){first=false;change(recovery,"during-backup");}}});
  try {
    change(recovery,"before-backup"); await recovery.backupNow();
    expect(recovery.status().backups).toHaveLength(2);
    expect(recovery.status().state).toBe("ready");
    const latest=recovery.status().backups[0]; const plain=join(directory,"verified.sqlite");
    await decryptSnapshot(join(config.destination,`${latest.id}.esmerbackup`),plain,config.key);
    const db=new DatabaseSync(plain); try {expect(db.prepare("SELECT count(*) AS n FROM app_revisions").get()?.n).toBe(2);}finally{db.close();}
    expect(readdirSync(directory).filter(name=>name.startsWith(".esmer-recovery-"))).toEqual([]);
  } finally {await recovery.close();}
  recovery=await Recovery.open(path,config,{fault:boundary=>{if(boundary==="published")throw new Error("interrupted");}});
  change(recovery,"after-publication"); await expect(recovery.backupNow()).rejects.toThrow("interrupted"); await recovery.close();
  recovery=await Recovery.open(path,config);
  try {expect(recovery.status().backups).toHaveLength(3); await recovery.resume(); expect(recovery.status().state).toBe("ready");}finally{await recovery.close();}
});

test("five latest verified ordinary backups retain older pins and every pre-upgrade checkpoint",async()=> {
  const {path,config}=setup(); let recovery=await Recovery.open(path,config);
  let pinned="",upgrade="";
  try {
    await recovery.backupNow(); pinned=recovery.status().backups[0].id; await recovery.pinBackup(pinned,true);
    await recovery.backupNow("pre-upgrade"); upgrade=recovery.status().backups[0].id;
    for(let i=0;i<7;i++){change(recovery,`revision-${i}`);await recovery.backupNow();}
    expect(recovery.status().backups).toHaveLength(7);
    expect(recovery.status().backups.find(x=>x.id===pinned)?.pinned).toBe(true);
    expect(recovery.status().backups.find(x=>x.id===upgrade)?.kind).toBe("pre-upgrade");
    expect(readdirSync(config.destination).filter(x=>x.endsWith(".esmerbackup"))).toHaveLength(7);
  }finally{await recovery.close();}
  recovery=await Recovery.open(path,config);
  try{expect(recovery.status().backups.find(x=>x.id===pinned)?.pinned).toBe(true);}finally{await recovery.close();}
});

test("missing setup, unavailable destination and interrupted encryption preserve pending intent and last good copy",async()=> {
  const {directory,path,config}=setup(); let recovery=await Recovery.open(path);
  change(recovery,"pending"); await expect(recovery.backupNow()).rejects.toThrow("RECOVERY_SETUP_REQUIRED"); await recovery.close();
  recovery=await Recovery.open(path,config); await recovery.resume(); const good=recovery.status().backups[0]; await recovery.close();
  const bytes=readFileSync(join(config.destination,`${good.id}.esmerbackup`));
  recovery=await Recovery.open(path,config,{fault:boundary=>{if(boundary==="encrypted")throw new Error("disk-full");}});
  try {
    change(recovery,"next");await expect(recovery.backupNow()).rejects.toThrow("disk-full");
    expect(recovery.status().state).toBe("failed");
    expect(readFileSync(join(config.destination,`${good.id}.esmerbackup`))).toEqual(bytes);
    expect(readdirSync(directory).filter(x=>x.startsWith(".esmer-recovery-"))).toEqual([]);
    expect(readdirSync(config.destination).filter(x=>x.endsWith(".partial"))).toEqual([]);
    await expect(recovery.configure({destination:join(directory,"missing"),key:generateRecoveryKey()})).rejects.toThrow();
    expect(recovery.status().backups[0].id).toBe(good.id);
  }finally{await recovery.close();}
});

test("exported key survives independent import and snapshots contain no recovery secret",async()=> {
  const {directory,path,config}=setup(); const recovery=await Recovery.open(path,config);
  try {
    change(recovery,"secret-free");await recovery.backupNow();
    const key=decodeRecoveryKey(encodeRecoveryKey(config.key));expect(key).toEqual(config.key);
    const artifact=join(config.destination,`${recovery.status().backups[0].id}.esmerbackup`);
    const bytes=readFileSync(artifact);expect(bytes.includes(Buffer.from(config.key))).toBe(false);expect(bytes.includes(Buffer.from("Recovery test"))).toBe(false);
    const plain=join(directory,"plain.sqlite");await decryptSnapshot(artifact,plain,key);
    expect(readFileSync(plain).includes(Buffer.from(config.key))).toBe(false);
    const db=new DatabaseSync(plain);try{expect(db.prepare("SELECT name FROM sqlite_master WHERE name LIKE '%key%'").all()).toEqual([]);}finally{db.close();}
  }finally{await recovery.close();}
});

test("configured v5 store gets a verified pre-upgrade backup before migration",async()=> {
  const {directory,path,config}=setup();const db=new DatabaseSync(path);migrate(db,5);db.close();
  const recovery=await Recovery.open(path,config);
  try {
    const entry=recovery.status().backups.find(x=>x.kind==="pre-upgrade");expect(entry).toBeDefined();
    const original=join(directory,"old.sqlite");await decryptSnapshot(join(config.destination,`${entry!.id}.esmerbackup`),original,config.key);
    const old=new DatabaseSync(original);try{expect(old.prepare("PRAGMA user_version").get()?.user_version).toBe(5);}finally{old.close();}
  }finally{await recovery.close();}
});

test("failed business transaction never advances backup intent and stale plaintext is swept on startup",async()=> {
  const {directory,path}=setup();const store=openStore(path);const before=store.recoveryGeneration();
  expect(()=>store.appendRevision({kind:"setting",entityId:"bad",value:{currency:"TRY",reason:"",evidence:"fixture:recovery"}})).toThrow();
  expect(store.recoveryGeneration()).toEqual(before);store.close();
  const stale=join(directory,".esmer-recovery-00000000-0000-0000-0000-000000000000");mkdirSync(stale);writeFileSync(join(stale,"plaintext.sqlite"),"private");
  const recovery=await Recovery.open(path);try{expect(readdirSync(directory)).not.toContain(stale.split("/").at(-1));}finally{await recovery.close();}
});

test("native online backup remains coherent while the owning connection commits between page batches",async()=>{
  const {directory,path}=setup();const store=openStore(path);
  try{
    store.acceptReport({id:"large",pin:store.readPin(),calculationVersion:"fixture-v1",evidence:["fixture:large"],output:{payload:"x".repeat(2*1024*1024)}});
    let wroteDuringBackup=false;
    const snapshot=join(directory,"online.sqlite");
    await store.backupTo(snapshot,progress=>{
      if(progress.remainingPages>0&&!wroteDuringBackup){wroteDuringBackup=true;store.appendRevision({kind:"setting",entityId:"concurrent",value:{currency:"TRY",reason:"Concurrent page write",evidence:"fixture:concurrent"}});}
    });
    expect(wroteDuringBackup).toBe(true);
    const copy=openStore(snapshot);try{expect(copy.readSnapshot().app).toEqual(store.readSnapshot().app);expect(copy.readReport("large")).toEqual(store.readReport("large"));expect(copy.recoveryGeneration().changed).toBe(store.recoveryGeneration().changed);}finally{copy.close();}
  }finally{store.close();}
});

test("a corrupt retention catalogue cannot erase existing pins or prune their artifacts",async()=>{
  const {path,config}=setup();let recovery=await Recovery.open(path,config);await recovery.backupNow();const entry=recovery.status().backups[0];await recovery.pinBackup(entry.id,true);await recovery.close();
  const catalogue=readdirSync(config.destination).find(x=>x.startsWith(".esmer-catalogue-"))!;writeFileSync(join(config.destination,catalogue),"invalid");
  recovery=await Recovery.open(path,config);try{await expect(recovery.backupNow()).rejects.toThrow();expect(readdirSync(config.destination)).toContain(`${entry.id}.esmerbackup`);expect(readFileSync(join(config.destination,catalogue),"utf8")).toBe("invalid");}finally{await recovery.close();}
});
