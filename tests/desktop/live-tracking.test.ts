import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {openStore} from "../../src/store/store";
import {writeRawPackage} from "../../src/source/raw-package";
import {rawSnapshot} from "../helpers/raw-fixture";
import {openSettings, openWorkspace } from "../helpers/desktop-navigation";

const executablePath=process.env.ESMER_EXECUTABLE??(process.platform==="darwin"?resolve(`release/mac${process.arch==="arm64"?"-arm64":""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`):process.platform==="win32"?resolve("release/win-unpacked/Esmer Market Analytics.exe"):resolve("release/linux-unpacked/esmer-market-analytics"));

test("packaged tracking retains month and filters while requiring fresh document selection across captures",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"live-tracking-")),database=join(userData,"analytics.sqlite");
 const snapshot=rawSnapshot();snapshot.to="2025-11-12";
 const seed=openStore(database),first=seed.importSourcePreview(writeRawPackage(snapshot,"fixture:tracking","capture-1"));seed.close();
 if(first.status!=="preview-imported")throw Error("fixture");
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);
  await expect(page.getByRole("heading",{name:"Aylık Market Özeti",exact:true})).toBeVisible();
  await page.getByLabel("Dönem",{exact:true}).fill("2025-10");
  await page.getByRole("button",{name:"Satışlar",exact:true}).click();
  await page.getByText("Gelişmiş filtreler",{exact:true}).click();
  await page.getByLabel("Ürün kayıt ID’si",{exact:true}).fill("3");
  await page.getByRole("button",{name:"Filtreleri uygula",exact:true}).click();
  await page.getByRole("button",{name:"1",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toBeVisible();
  const nextFile=join(userData,"capture-2.json");
  await writeFile(nextFile,writeRawPackage({...snapshot,capturedAt:"2026-10-03T10:01:00.000Z"},"fixture:tracking","capture-2"));
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},nextFile);
  await openSettings(page);
  await page.getByRole("button",{name:"Veri paketi içe aktar",exact:true}).click();
  await expect(page.getByLabel("Dönem",{exact:true})).toBeVisible();
  await expect(page.getByText("fixture:tracking · Paket: capture-2",{exact:false})).toHaveCount(1);
  await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-10");
  await expect(page.getByText("Kaynak sürümü değişti. Eski belge detayı kapatıldı; kayıt kimlikleri yeni kaynakta yeniden seçilmelidir.",{exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"1",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Belgelere dön",exact:true}).click();
  await expect(page.getByLabel("Ürün kayıt ID’si",{exact:true})).toHaveValue("3");
  async function importCapture(bytes:Uint8Array,name:string){
   const file=join(userData,`${name}.json`);await writeFile(file,bytes);
   await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);
   await openSettings(page);await page.getByRole("button",{name:"Veri paketi içe aktar",exact:true}).click();
  }
  await page.getByRole("button",{name:"1",exact:true}).click();
  const corrected={...snapshot,headers:[{...snapshot.headers[0],GENELTOPLAM:"456.00"}]};
  await importCapture(writeRawPackage(corrected,"fixture:tracking","capture-3"),"capture-3");
  await expect(page.getByText("fixture:tracking · Paket: capture-3",{exact:false})).toHaveCount(1);
  await expect(page.getByText("Kaynak sürümü değişti. Eski belge detayı kapatıldı; kayıt kimlikleri yeni kaynakta yeniden seçilmelidir.",{exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"1",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toBeVisible();
  const recordedAmount=page.locator(".source-document-summary dl>div").filter({has:page.getByText("Kaynak belge tutarı · doğrulanmadı",{exact:true})}).locator("dd");
  await expect(recordedAmount.getByText("456",{exact:true})).toBeVisible();
  await page.getByRole("region",{name:"Kaynak belge ayrıntıları",exact:true}).getByText("Veri ve hesaplama ayrıntıları",{exact:true}).click();
  await page.getByRole("checkbox",{name:"Tam kaynak değerlerini göster",exact:true}).check();
  await expect(recordedAmount.getByText("456.00",{exact:true})).toBeVisible();
  await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-10");
  await importCapture(writeRawPackage({...snapshot,headers:[],lines:[]},"fixture:tracking","capture-4"),"capture-4");
  await expect(page.getByText("Kaynak sürümü değişti. Eski belge detayı kapatıldı; kayıt kimlikleri yeni kaynakta yeniden seçilmelidir.",{exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toHaveCount(0);
  await expect(page.getByRole("button",{name:"1",exact:true})).toHaveCount(0);
  await expect(recordedAmount).toHaveCount(0);
  await expect(page.getByText("Eşleşen kayıt yok",{exact:true})).toHaveCount(2);
  await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-10");
  await expect(page.getByLabel("Ürün kayıt ID’si",{exact:true})).toHaveValue("3");
  await importCapture(writeRawPackage({...snapshot,databaseId:"00000000-0000-4000-8000-000000000002"},"fixture:tracking","capture-5"),"capture-5");
  await expect(page.getByText("fixture:tracking · Paket: capture-5",{exact:false})).toHaveCount(1);
  await expect(page.getByRole("heading",{name:"Aylık Market Özeti",exact:true})).toBeVisible();
  await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-10");
  await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toHaveCount(0);
  await expect(recordedAmount).toHaveCount(0);
  await page.getByRole("button",{name:"Satışlar",exact:true}).click();
  await expect(page.getByLabel("Ürün kayıt ID’si",{exact:true})).toHaveValue("");
  await expect(page.getByLabel("Belge türü (kaynak kodu)",{exact:true})).toHaveValue("");
  await expect(page.getByRole("button",{name:"1",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toHaveCount(0);
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("packaged stale status acknowledges retained raw-only source records",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"live-tracking-stale-")),database=join(userData,"analytics.sqlite");
 const seed=openStore(database),first=seed.importSourcePreview(writeRawPackage(rawSnapshot(),"fixture:tracking","capture-1"));seed.close();
 if(first.status!=="preview-imported")throw Error("fixture");
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);
  await expect(page.getByRole("heading",{name:"Aylık Market Özeti",exact:true})).toBeVisible();
  const configFile=join(userData,"synthetic-source.json");
  await writeFile(configFile,JSON.stringify({server:"localhost",port:1,database:"synthetic",user:"reader",password:"SYNTHETIC",scope:"isolated-copy",lineage:"fixture:tracking",expectedDatabaseId:rawSnapshot().databaseId,from:"2025-10-01",to:"2025-10-12"}));
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},configFile);
  await openSettings(page);
  await page.getByRole("button",{name:"SQL kaynağını içe aktar",exact:true}).click();
  await expect(page.getByText("Kaynağa ulaşılamadı.",{exact:true})).toBeVisible({timeout:15000});
  await expect(page.getByText("Son geçerli yerel veriler kullanılıyor.",{exact:true})).toBeVisible();
  await expect(page.getByRole("region",{name:"Canlı bağlantı",exact:true}).getByText("12.10.2025",{exact:true})).toBeVisible();
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});
