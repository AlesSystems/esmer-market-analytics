import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {_electron as electron, expect} from '@playwright/test';
import {openStore} from '../../../src/store/store';
import {writeRawPackage} from '../../../src/source/raw-package';
import {rawSnapshot} from '../../../tests/helpers/raw-fixture';

const out=resolve('docs/evidence/images/owner-workspace-2026-09-26');
await mkdir(out,{recursive:true});
const profile=await mkdtemp(join(tmpdir(),'esmer-owner-synthetic-'));
const snapshot=rawSnapshot(),header=snapshot.headers[0],line=snapshot.lines[0];
snapshot.headers=[];snapshot.lines=[];
const daily=[18,24,17,31,40,36,22,28,35,45,33,16];
let next=1;
for(let day=1;day<=daily.length;day++)for(let item=0;item<daily[day-1];item++){
 const id=String(next++),type=item%13===0?'1':item%17===0?'12':item%29===0?'999':'11';
 snapshot.headers.push({...header,ID:id,FIS_TURU:type,FIS_TARIHI:`2025-10-${String(day).padStart(2,'0')}T12:00:00.000`});
 snapshot.lines.push({...line,ID:id,FIS:id,FIS_TURU:type,STOK:String(item%18+1)});
}
const store=openStore(join(profile,'analytics.sqlite'));
store.importSourcePreview(writeRawPackage(snapshot,'fixture:owner-experience','synthetic-owner-experience-2026-09-26'));store.close();
const app=await electron.launch({executablePath:resolve('release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics'),args:[`--user-data-dir=${profile}`]});
try {
 const page=await app.firstWindow();await page.setViewportSize({width:1440,height:1000});
 await expect(page.getByRole('heading',{name:'Aylık Market Özeti',exact:true})).toBeVisible();
 const states=[];
 for(const [label,name] of [['Özet','overview'],['Satışlar','sales'],['Alışlar ve maliyet','purchasing'],['Giderler','expenses'],['Raporlar','reports']]){
  await page.getByRole('navigation',{name:'Ana gezinme'}).getByRole('button',{name:label,exact:true}).click();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole('main')).toHaveCount(1);
  await page.screenshot({path:join(out,`${name}-1440.png`)});
  states.push({page:label,mainLandmarks:await page.getByRole('main').count(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
 }
 await page.getByRole('button',{name:'Özet',exact:true}).click();
 await page.setViewportSize({width:800,height:900});
 await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
 await page.screenshot({path:join(out,'overview-800.png'),fullPage:true});
 await writeFile(join(out,'capture.json'),JSON.stringify({fixture:'synthetic-owner-experience-2026-09-26',generated:true,headers:snapshot.headers.length,lines:snapshot.lines.length,states},null,2)+'\n');
} finally {await app.close();await rm(profile,{recursive:true,force:true});}
