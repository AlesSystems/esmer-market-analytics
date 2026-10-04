import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,rm,mkdir} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {openStore} from "../../src/store/store";
import {writeRawEstimatePackage} from "../../src/source/raw-package";
import {rawSnapshot} from "../helpers/raw-fixture";
const executablePath=process.env.ESMER_EXECUTABLE??resolve(`release/mac${process.arch==="arm64"?"-arm64":""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`);
for(const destination of ["Satışlar","Alışlar ve maliyet"]){
 test(`${destination}: source document stays compact, exact and scrollable`,async()=>{
  const userData=await mkdtemp(join(tmpdir(),"document-layout-"));
  const snapshot=rawSnapshot(),type=destination==="Satışlar"?"11":"1";
  snapshot.headers[0].FIS_TURU=type;
  snapshot.lines=Array.from({length:7},(_,i)=>({...snapshot.lines[0],ID:String(100+i),STOK:String(300+i),FIS_TURU:type,TOPLAM_OTV:i===0?null:"0.000",BELGE_TARIHINDEKI_SON_ALIS_FIYATI:"12.345678901234567890"}));
  const store=openStore(join(userData,"analytics.sqlite"));store.importSourcePreview(writeRawEstimatePackage(snapshot,"fixture:document-layout","seven-lines"));store.close();
  const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
  try{
   const page=await app.firstWindow();await page.setViewportSize({width:1440,height:1000});
   await page.getByRole("button",{name:destination,exact:true}).click();
   await page.getByRole("button",{name:"1",exact:true}).click();
   await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toBeVisible();
   if(process.env.ESMER_CAPTURE_BEFORE==="1"&&destination==="Satışlar"){
    await mkdir("work/poteto/source-document-layout",{recursive:true});await page.screenshot({path:"work/poteto/source-document-layout/before.png",fullPage:true});
   }
   const first=page.getByRole("row").filter({has:page.getByRole("cell",{name:"100",exact:true})});
   await expect(first).toBeInViewport();
   const control=page.getByRole("checkbox",{name:"Tam kaynak değerlerini göster",exact:true});await control.focus();await page.keyboard.press("Space");await expect(control).toBeChecked();
   await expect(page.getByText("2025-10-01T12:00:00.000",{exact:true})).toBeVisible();
   const table=page.getByRole("table",{name:"Kaydedilmiş belge satırları",exact:true});
   await expect(table.locator("tbody tr")).toHaveCount(7);
   await expect(table.getByText("12.345678901234567890",{exact:true})).toHaveCount(7);
   await expect(table.getByText("2.000",{exact:true})).toHaveCount(7);
   await expect(table.locator("tbody tr").first().getByRole("cell").nth(7)).toHaveText("—");
   await expect(table.locator("tbody tr").nth(1).getByRole("cell").nth(7)).toContainText("0,000");
   const scroll=page.getByRole("region",{name:"Belge satırları yatay kaydırma",exact:true});await scroll.focus();await page.keyboard.press("End");await expect(scroll).toBeFocused();
   await table.locator("tbody tr").last().scrollIntoViewIfNeeded();await expect(table.locator("tbody tr").last()).toBeInViewport();
   expect(await scroll.evaluate(node=>node.clientHeight>=node.scrollHeight)).toBe(true);
   for(const size of [{width:1120,height:720},{width:390,height:844}]){
    await page.setViewportSize(size);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   }
   if(process.env.ESMER_CAPTURE_EVIDENCE==="1"){
    await mkdir("work/poteto/source-document-layout",{recursive:true});await page.setViewportSize({width:1440,height:1000});await control.uncheck();await page.screenshot({path:`work/poteto/source-document-layout/after-${type}.png`,fullPage:true});
   }
   await page.getByRole("button",{name:"Belgelere dön",exact:true}).click();await expect(page.getByRole("button",{name:"1",exact:true})).toBeVisible();
  }finally{await app.close();await rm(userData,{recursive:true,force:true});}
 });
}
