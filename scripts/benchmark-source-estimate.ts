import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { arch, cpus, release, tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { estimateSnapshot, estimatePackage } from '../tests/helpers/estimate-fixture.ts';
import { openStore } from '../src/store/store.ts';

const lines=99999,samples=3,directory=mkdtempSync(join(tmpdir(),'esmer-estimate-benchmark-'));
try {
 const shapes=[];
 for(const products of [3529,99999]) {
  const source=estimateSnapshot(),template=source.lines[0];
  source.lines=Array.from({length:lines},(_,i)=>({...template,ID:String(i+2),STOK:String(i%products+3)}));
  const bytes=estimatePackage(source,'synthetic-perf'),path=join(directory,`${products}.sqlite`),initial=openStore(path);
  let hash:string;
  try {const imported=initial.importSourcePreview(bytes);assert.equal(imported.status,'preview-imported');if(imported.status!=='preview-imported')throw Error('Synthetic import failed');hash=imported.hash;}finally{initial.close();}
  const results=[];
  for(let sample=1;sample<=samples;sample++) {
   const store=openStore(path);
   try {
    for(const {name,offset,productId} of [
     {name:'cold-page',offset:0,productId:null},
     {name:'warm-page',offset:50,productId:null},
     {name:'warm-page',offset:100,productId:null},
     {name:'warm-exact-product',offset:0,productId:String(products+2)},
    ]) {
     const start=performance.now(),value=store.querySourceEstimate({hash,period:'2025-10',view:'products',offset,productId}),ms=Math.round((performance.now()-start)*100)/100;
     assert.equal(value.status,'source-estimate');if(value.status!=='source-estimate')throw Error('Estimate unavailable');
     assert.equal(value.total,productId===null?products:1);
     assert.equal(value.report.summary.totalLines,lines);
     assert.equal(value.report.summary.candidateSaleAmount,'11999880');
     assert.equal(value.report.summary.candidateCost,'13999860');
     assert.equal(value.report.summary.contribution,'-1999980');
     assert.equal(value.ranking.length,10);
     if(productId!==null)assert.equal(value.products[0].productId,productId);
     results.push({sample,name,offset,ms,total:value.total});
    }
   } finally {store.close();}
  }
  shapes.push({lines,products,bytes:bytes.length,sourceHash:hash,results});
 }
 console.log(JSON.stringify({synthetic:true,node:process.version,platform:process.platform,os:release(),arch:arch(),cpu:cpus()[0].model,samples,coldCondition:'Store reopened against persisted SQLite; JS process and OS filesystem cache remain warm. Timings exclude import, store open, IPC and rendering.',shapes},null,2));
} finally {rmSync(directory,{recursive:true,force:true});}
