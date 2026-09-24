import { expect, test } from "vitest";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Worker } from "node:worker_threads";
import { build } from "esbuild";
import { Recovery } from "../../src/recovery/backup";
import { generateRecoveryKey } from "../../src/recovery/keys";
import { populateRecoveryStore } from "../helpers/recovery-fixtures";
import type { ServiceResponse } from "../../src/domain/contracts";

test("worker serializes recovery previews, drains an admitted export and gates requests during restore",async()=>{
  const directory=await mkdtemp(join(tmpdir(),"recovery-worker-"));
  const databasePath=join(directory,"analytics.sqlite"),destination=join(directory,"external"),key=generateRecoveryKey();
  await mkdir(destination);
  const recovery=await Recovery.open(databasePath,{destination,key});
  const report=await populateRecoveryStore(recovery.store!);await recovery.backupNow();
  const backupPath=join(destination,`${recovery.status().backups[0].id}.esmerbackup`);await recovery.close();
  const script=join(directory,"worker.cjs");await build({entryPoints:[resolve("src/service/worker.ts")],outfile:script,bundle:true,platform:"node",format:"cjs",target:"node24"});
  const worker=new Worker(script,{workerData:{databasePath}});let id=0;
  const completed:string[]=[];
  const request=(operation:string,payload?:object)=>new Promise<ServiceResponse["result"]>((resolveResult,reject)=>{
    const requestId=++id;
    const timer=setTimeout(()=>{worker.off("message",receive);reject(new Error("WORKER_TIMEOUT"));},10_000);
    const receive=(message:ServiceResponse)=>{if(message.id===requestId){clearTimeout(timer);worker.off("message",receive);completed.push(operation);resolveResult(message.result);}};
    worker.on("message",receive);worker.postMessage({id:requestId,operation,...(payload?{payload}:{})});
  });
  try{
    expect(await request("getAvailability")).toMatchObject({status:"ready"});
    const [preview,duplicate]=await Promise.all([request("prepareRestore",{backupPath,key}),request("prepareRestore",{backupPath,key})]);
    expect(preview.status).toBe("restore-preview");expect(duplicate).toMatchObject({status:"recovery-failed",code:"RECOVERY_BUSY"});
    if(preview.status!=="restore-preview")throw new Error("NO_PREVIEW");
    completed.length=0;
    const exported=request("exportReportVersion",{reportId:report.id});
    const restored=request("confirmRestore",{token:preview.token});
    const blocked=request("getAvailability");
    expect(await blocked).toMatchObject({status:"recovery-failed",code:"RECOVERY_BUSY"});
    expect((await exported).status).toBe("export");expect(await restored).toEqual({status:"restored"});
    expect(completed.indexOf("exportReportVersion")).toBeLessThan(completed.indexOf("confirmRestore"));
    expect(await request("getAvailability")).toMatchObject({status:"ready"});
    expect(await request("readReportVersion",{reportId:report.id})).toMatchObject({status:"monthly",report:{id:report.id}});
  }finally{await worker.terminate();await rm(directory,{recursive:true,force:true});}
});
