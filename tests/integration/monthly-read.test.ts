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
