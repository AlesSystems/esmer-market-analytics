import { performance } from 'node:perf_hooks';
import { estimateSnapshot, estimatePackage } from '../tests/helpers/estimate-fixture.ts';
import { openStore } from '../src/store/store.ts';
const size=99999;
const source=estimateSnapshot();
const template=source.lines[0];
source.lines=Array.from({length:size},(_,i)=>({...template,ID:String(i+2),STOK:String(i%3529+3)}));
const bytes=estimatePackage(source,'synthetic-perf');
const store=openStore(':memory:');
try {
 const imported=store.importSourcePreview(bytes); if(imported.status!=='preview-imported')throw Error(JSON.stringify(imported));
 const results=[];
 for(const offset of [0,50,100]){const start=performance.now();const value=store.querySourceEstimate({hash:imported.hash,period:'2025-10',view:'products',offset,productId:null});results.push({offset,ms:Math.round(performance.now()-start),status:value.status,total:value.status==='source-estimate'?value.total:null});}
 console.log(JSON.stringify({synthetic:true,node:process.version,platform:process.platform,lines:size,products:3529,bytes:bytes.length,results}));
}finally{store.close();}
