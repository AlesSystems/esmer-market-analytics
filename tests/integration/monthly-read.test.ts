import { expect, test, vi } from "vitest";
import { OperationJobs } from "../../src/desktop/jobs";
import { createMonthlyRead } from "../../src/desktop/monthly-read";
const context={sessionId:"session",datasetId:"dataset",appRevision:2,calculationVersion:"monthly-v1",period:"2025-09"};

test("overlapping monthly navigation shares one pending read instead of displaying busy",async()=>{
 const jobs=new OperationJobs();
 let finish!:(value:{status:"monthly";period:string})=>void;
 const service=vi.fn(()=>new Promise<{status:"monthly";period:string}>(resolve=>{finish=resolve;}));
 const read=createMonthlyRead(()=>jobs.run("queryMonthly",service));
 const summary=read(context),sales=read({...context});
 finish({status:"monthly",period:"2025-09"});
 expect(await summary).toEqual({status:"monthly",period:"2025-09"});
 expect(await sales).toEqual({status:"monthly",period:"2025-09"});
 expect(service).toHaveBeenCalledTimes(1);
 expect(jobs.status()).toEqual({status:"idle"});
});

test("each pinned context field keeps distinct reads behind the existing job gate",async()=>{
 const jobs=new OperationJobs();let finish!:(value:{status:"monthly"})=>void;
 const service=vi.fn(()=>new Promise<{status:"monthly"}>(resolve=>{finish=resolve;}));
 const read=createMonthlyRead(()=>jobs.run("queryMonthly",service));
 const original=read(context);
 for(const change of [{sessionId:"new-session"},{datasetId:"new-dataset"},{appRevision:3},{calculationVersion:"monthly-v2"},{period:"2025-10"}])expect(await read({...context,...change})).toEqual({status:"busy"});
 expect(await jobs.run("importPackage",async()=>({status:"cancelled"}))).toEqual({status:"busy"});
 finish({status:"monthly"});await original;
 expect(service).toHaveBeenCalledTimes(1);
});

test("completed and rejected reads are evicted so later navigation revalidates",async()=>{
 const service=vi.fn().mockResolvedValueOnce({status:"monthly",generation:1}).mockRejectedValueOnce(new Error("temporary")).mockResolvedValueOnce({status:"monthly",generation:2});
 const read=createMonthlyRead(service);
 expect(await read(context)).toEqual({status:"monthly",generation:1});
 await expect(read(context)).rejects.toThrow("temporary");
 expect(await read(context)).toEqual({status:"monthly",generation:2});
 expect(service).toHaveBeenCalledTimes(3);
});

test("an active import still rejects monthly reads without starting another job",async()=>{
 const jobs=new OperationJobs();let finish!:(value:{status:"cancelled"})=>void;
 const imported=jobs.run("importPackage",()=>new Promise<{status:"cancelled"}>(resolve=>{finish=resolve;}));
 const service=vi.fn(async()=>({status:"monthly"}));
 const read=createMonthlyRead(()=>jobs.run("queryMonthly",service));
 expect(await read(context)).toEqual({status:"busy"});expect(service).not.toHaveBeenCalled();
 finish({status:"cancelled"});await imported;
 expect(await read(context)).toEqual({status:"monthly"});
});
