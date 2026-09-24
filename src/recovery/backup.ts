import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { DatabaseSync, backup } from "node:sqlite";
import { mkdir, open, readFile, readdir, rename, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { openStore } from "../store/store";
import { SCHEMA_VERSION } from "../store/schema";
import type { BackupEntry, RecoveryConfig, RecoveryStatus, RestorePreview } from "./contracts";
import { recoveryFailure } from "./contracts";
import { keyIdentity } from "./keys";
import { decryptSnapshot, encryptSnapshot } from "./cipher";
import { cleanupTemporaryDirectories, durableWrite, syncDirectory, temporaryDirectory } from "./files";
import { validateSnapshot } from "./validate";
import { recoverInterruptedSwitch, restoreCommitted, switchStore, type SwitchBoundary } from "./restore";
type Store = ReturnType<typeof openStore>;
type Options={holdStoreUntilConfigured?:boolean;fault?:(boundary:SwitchBoundary|"snapshot"|"encrypted"|"verified"|"published"|"migration")=>void};
type Preview={token:string;directory:string;candidate:string;generation:number|null;summary:RestorePreview;backupId:string};
export class Recovery {
  store: Store | null = null;
  private config?: RecoveryConfig;
  private entries: BackupEntry[]=[];
  private running: Promise<void> | null=null;
  private error: string | null=null;
  private preview: Preview | null=null;
  private switching=false;
  private closed=false;
  private constructor(readonly databasePath:string,private readonly options:Options) {}
  static async open(databasePath:string,config?:RecoveryConfig,options:Options={}):Promise<Recovery> {
    const recovery=new Recovery(databasePath,options);
    await mkdir(dirname(databasePath),{recursive:true,mode:0o700});
    try { await recoverInterruptedSwitch(databasePath); } catch { recovery.error="RESTORE_RECOVERY_REQUIRED"; return recovery; }
    await cleanupTemporaryDirectories(databasePath);
    if (config) { keyIdentity(config.key); recovery.config={destination:config.destination,key:Buffer.from(config.key)}; }
    if (config) try { await recovery.loadCatalogue(); } catch { recovery.error="DESTINATION_UNAVAILABLE"; }
    if (options.holdStoreUntilConfigured) { recovery.error="RECOVERY_CONFIG_UNAVAILABLE"; return recovery; }
    try { await recovery.openConfiguredStore(); } catch { recovery.error="STORE_UNAVAILABLE"; }
    return recovery;
  }
  private async openConfiguredStore() {
    if (this.config && await stat(this.databasePath).then(()=>true,()=>false)) {
      const existing=new DatabaseSync(this.databasePath,{readOnly:true});
      try {
        const version=Number(existing.prepare("PRAGMA user_version").get()?.user_version);
        if (version>0 && version<SCHEMA_VERSION) {
          if (this.error) throw new Error(this.error);
          validateSnapshot(this.databasePath);
          await this.capture(path=>backup(existing,path),"pre-upgrade");
        }
      } finally { existing.close(); }
    }
    this.store=openStore(this.databasePath);
  }
  status():RecoveryStatus {
    const state=this.store?.recoveryGeneration();
    return {status:"recovery",state:this.error?"failed":!this.config?"setup-required":this.running?"running":state && state.changed>state.verified?"pending":"ready",lastVerifiedAt:state?.lastVerifiedAt??null,...(this.error?{error:recoveryFailure(this.error)}:{}),backups:this.entries.map(entry=>({...entry}))};
  }
  async configure(config:RecoveryConfig):Promise<RecoveryStatus> {
    if (this.running || this.switching) throw new Error("RECOVERY_BUSY");
    if (this.error==="RESTORE_RECOVERY_REQUIRED") throw new Error(this.error);
    keyIdentity(config.key); if (!(await stat(config.destination)).isDirectory()) throw new Error("DESTINATION_UNAVAILABLE");
    const previous={config:this.config,entries:this.entries,error:this.error};
    this.config={destination:config.destination,key:Buffer.from(config.key)}; this.entries=[]; this.error=null;
    try { await this.loadCatalogue(); if (!this.store) await this.openConfiguredStore(); return await this.backupNow(); }
    catch(error) { this.config.key.fill(0); this.config=previous.config; this.entries=previous.entries; this.error=previous.error; throw error; }
  }
  async resume():Promise<void> {
    if (!this.config || !this.store || this.error || this.switching || this.closed) return;
    if (this.running) return this.running;
    if (this.store.recoveryGeneration().changed<=this.store.recoveryGeneration().verified) return;
    await this.backupNow();
  }
  async backupNow(kind:BackupEntry["kind"]="ordinary"):Promise<RecoveryStatus> {
    if (!this.config) throw new Error("RECOVERY_SETUP_REQUIRED");
    if (!this.store || this.switching || this.closed) throw new Error("STORE_UNAVAILABLE");
    if (this.running) { await this.running; return this.status(); }
    this.error=null;
    this.running=(async()=> {
      await this.loadCatalogue();
      do {
        const entry=await this.capture(path=>this.store!.backupTo(path),kind);
        this.store!.markBackupVerified(entry.generation,entry.id,entry.createdAt);
        await this.audit("backup","ok",entry.id,entry.generation);
      } while (!this.switching && this.store!.recoveryGeneration().changed>this.store!.recoveryGeneration().verified);
    })();
    try { await this.running; }
    catch(error) { this.error="BACKUP_FAILED"; await this.audit("backup","failed",null,null,"BACKUP_FAILED"); throw error; }
    finally { this.running=null; }
    return this.status();
  }
  private cataloguePath() { return join(this.config!.destination,`.esmer-catalogue-${keyIdentity(this.config!.key)}.json`); }
  private signature(text:string) { return createHmac("sha256",this.config!.key).update("esmer-catalogue-v1\0").update(text).digest("hex"); }
  private async saveCatalogue() {
    const entries=JSON.stringify(this.entries);
    await durableWrite(this.cataloguePath(),JSON.stringify({entries,mac:this.signature(entries)}));
  }
  private async loadCatalogue() {
    if (!this.config) return;
    const catalogue=await readFile(this.cataloguePath(),"utf8").catch(error=>{if(error.code==="ENOENT")return null;throw error;});
    this.entries=[];
    if (catalogue) {
      if (catalogue.length>1024*1024) throw new Error("INVALID_CATALOGUE");
      const value=JSON.parse(catalogue);
      if (typeof value.entries!=="string" || typeof value.mac!=="string" || !/^[a-f0-9]{64}$/.test(value.mac) || !timingSafeEqual(Buffer.from(value.mac,"hex"),Buffer.from(this.signature(value.entries),"hex"))) throw new Error("INVALID_CATALOGUE");
      const entries=JSON.parse(value.entries);
      if (!Array.isArray(entries) || !entries.every(entry=>entry && /^[a-f0-9-]{36}$/.test(entry.id) && typeof entry.pinned==="boolean" && ["ordinary","pre-upgrade"].includes(entry.kind) && typeof entry.createdAt==="string")) throw new Error("INVALID_CATALOGUE");
      this.entries=entries;
    }
    const names=await readdir(this.config.destination);
    this.entries=this.entries.filter(entry=>names.includes(`${entry.id}.esmerbackup`));
    for (const name of names.filter(name=>/^[a-f0-9-]{36}\.esmerbackup$/.test(name)&&!this.entries.some(entry=>`${entry.id}.esmerbackup`===name))) {
      const directory=await temporaryDirectory(this.databasePath);
      try {
        const candidate=join(directory,"discovered.sqlite");
        const header=await decryptSnapshot(join(this.config.destination,name),candidate,this.config.key);
        validateSnapshot(candidate);
        if (`${header.id}.esmerbackup`!==name) continue;
        this.entries.push({id:header.id,createdAt:header.createdAt,kind:header.kind,pinned:false});
      } catch { continue; }
      finally { await rm(directory,{recursive:true,force:true}); }
    }
    this.entries.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
    await this.saveCatalogue();
  }
  private async capture(snapshot:(path:string)=>Promise<unknown>,kind:BackupEntry["kind"]) {
    if (!this.config) throw new Error("RECOVERY_SETUP_REQUIRED");
    const directory=await temporaryDirectory(this.databasePath);
    const id=randomUUID(),createdAt=new Date().toISOString();
    const partial=join(this.config.destination,`.${id}.partial`),target=join(this.config.destination,`${id}.esmerbackup`);
    try {
      const plain=join(directory,"snapshot.sqlite"); await snapshot(plain); this.options.fault?.("snapshot");
      const summary=validateSnapshot(plain);
      await encryptSnapshot(plain,partial,this.config.key,{id,createdAt,kind,generation:summary.generation}); this.options.fault?.("encrypted");
      const verified=join(directory,"verified.sqlite");
      const header=await decryptSnapshot(partial,verified,this.config.key);
      const checked=validateSnapshot(verified);
      if (checked.generation!==header.generation) throw new Error("INVALID_BACKUP");
      this.options.fault?.("verified"); await rename(partial,target); await syncDirectory(this.config.destination); this.options.fault?.("published");
      this.entries.unshift({id,createdAt,kind,pinned:false}); await this.saveCatalogue();
      const keep=new Set(this.entries.filter(entry=>entry.kind==="ordinary").slice(0,5).map(entry=>entry.id));
      const remove=this.entries.filter(entry=>!entry.pinned&&entry.kind!=="pre-upgrade"&&!keep.has(entry.id));
      for (const entry of remove) await rm(join(this.config.destination,`${entry.id}.esmerbackup`),{force:true});
      this.entries=this.entries.filter(entry=>!remove.includes(entry)); await this.saveCatalogue();
      return header;
    } finally { await rm(partial,{force:true}); await rm(directory,{recursive:true,force:true}); }
  }
  async pinBackup(id:string,pinned:boolean):Promise<{status:"saved"}> {
    if (this.running || this.switching || typeof pinned!=="boolean") throw new Error("RECOVERY_BUSY");
    const entry=this.entries.find(entry=>entry.id===id); if (!entry) throw new Error("BACKUP_NOT_FOUND");
    const previous=entry.pinned; entry.pinned=pinned;
    try { await this.saveCatalogue(); } catch(error) { entry.pinned=previous; throw error; }
    return {status:"saved"};
  }
  async prepareRestore(backupPath:string,key:Uint8Array):Promise<RestorePreview> {
    if (this.switching || this.closed) throw new Error("RECOVERY_BUSY");
    if (this.error==="RESTORE_RECOVERY_REQUIRED" || this.error==="RESTORE_COMMITTED_RESTART_REQUIRED") throw new Error(this.error);
    if (this.preview) await this.cancelRestore(this.preview.token);
    const generation=this.store?.recoveryGeneration().changed??null;
    const directory=await temporaryDirectory(this.databasePath),candidate=join(directory,"restore.sqlite");
    try {
      const header=await decryptSnapshot(backupPath,candidate,key);
      const summary=validateSnapshot(candidate,true,()=>this.options.fault?.("migration"));
      if (summary.generation!==header.generation) throw new Error("INVALID_BACKUP");
      const token=randomUUID();
      const result:RestorePreview={status:"restore-preview",token,createdAt:header.createdAt,cutoff:summary.cutoff,revisions:summary.revisions,reports:summary.reports};
      await this.audit("restore-preview","ok",header.id,header.generation,null,true);
      this.preview={token,directory,candidate,generation,summary:result,backupId:header.id}; return result;
    } catch(error) { await rm(directory,{recursive:true,force:true}); await this.audit("restore-preview","failed",null,null,"INVALID_BACKUP"); throw error; }
  }
  async cancelRestore(token:string):Promise<{status:"cancelled"}> {
    if (this.switching || !this.preview || this.preview.token!==token) throw new Error("INVALID_RESTORE_TOKEN");
    await rm(this.preview.directory,{recursive:true,force:true}); this.preview=null; return {status:"cancelled"};
  }
  async confirmRestore(token:string):Promise<{status:"restored"}> {
    if (!this.preview || this.preview.token!==token || this.switching) throw new Error("INVALID_RESTORE_TOKEN");
    const preview=this.preview;
    if (preview.generation!==(this.store?.recoveryGeneration().changed??null)) throw new Error("RESTORE_STALE");
    this.switching=true;
    let closed=false,committed=false;
    const candidate=join(dirname(this.databasePath),`.esmer-candidate-${randomUUID()}.sqlite`);
    try {
      if (this.running) {
        let timer:ReturnType<typeof setTimeout>|undefined;
        try { await Promise.race([this.running.catch(()=>{}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("RECOVERY_BUSY")),30_000);})]); }
        finally { clearTimeout(timer); }
      }
      if (preview.generation!==(this.store?.recoveryGeneration().changed??null)) throw new Error("RESTORE_STALE");
      validateSnapshot(preview.candidate);
      await this.audit("restore-intent","ok",preview.backupId,preview.generation,null,true);
      await rename(preview.candidate,candidate);
      this.store?.close(); this.store=null; closed=true;
      await switchStore(this.databasePath,candidate,()=>{this.store=openStore(this.databasePath);},this.options.fault,preview.backupId,preview.generation);
      committed=true; this.error=null; return {status:"restored"};
    } catch(error) {
      if (closed) {
        this.store?.close(); this.store=null;
        try {
          if (error instanceof Error && error.message==="RESTORE_COMMITTED_RESTART_REQUIRED" || await restoreCommitted(this.databasePath)) {
            this.error="RESTORE_COMMITTED_RESTART_REQUIRED";
            throw new Error(this.error);
          }
          await recoverInterruptedSwitch(this.databasePath);
          if (!await stat(this.databasePath).then(()=>true,()=>false)) throw new Error("RESTORE_RECOVERY_REQUIRED");
          this.store=openStore(this.databasePath);
        } catch {
          this.error=this.error==="RESTORE_COMMITTED_RESTART_REQUIRED"?this.error:"RESTORE_RECOVERY_REQUIRED";
          throw new Error(this.error);
        }
      }
      await this.audit("restore","failed",preview.backupId,preview.generation,"RESTORE_FAILED"); throw error;
    } finally {
      this.switching=false; this.preview=null;
      try {
        await rm(preview.directory,{recursive:true,force:true});
        if (!await stat(`${this.databasePath}.restore-journal`).then(()=>true,()=>false)) await rm(candidate,{force:true});
      } catch(error) {
        if (committed || this.error==="RESTORE_COMMITTED_RESTART_REQUIRED") { this.error="RESTORE_COMMITTED_RESTART_REQUIRED"; throw new Error(this.error); }
        if (this.error==="RESTORE_RECOVERY_REQUIRED") throw new Error(this.error);
        throw error;
      }
    }
  }
  private async audit(operation:string,result:"ok"|"failed",identity:string|null=null,generation:number|null=null,code:string|null=null,required=false) {
    try {
      const path=join(dirname(this.databasePath),"recovery-audit.jsonl");
      const file=await open(path,"a",0o600);
      try { await file.writeFile(JSON.stringify({at:new Date().toISOString(),operation,result,identity,generation,code})+"\n"); await file.sync(); } finally { await file.close(); }
      await syncDirectory(dirname(path));
    } catch { this.error="AUDIT_UNAVAILABLE"; if (required) throw new Error("AUDIT_UNAVAILABLE"); }
  }
  async close() {
    this.closed=true;
    if (this.running) await this.running.catch(()=>{});
    if (this.preview) await this.cancelRestore(this.preview.token);
    this.store?.close(); this.store=null;
    this.config?.key.fill(0);
  }
}
