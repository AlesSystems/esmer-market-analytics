import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";
import { executablePath } from "../helpers/desktop-executable";
test("one working month survives every business page and application restart", async () => {
 const userData = await mkdtemp(join(tmpdir(), "esmer-business-navigation-"));
 const store = openStore(join(userData,"analytics.sqlite"));
 try { store.importPackage(businessPackage(undefined,{cutoff:"2025-10-31",coverage:{from:"2025-09-01",to:"2025-10-31",complete:true}})); } finally {store.close();}
 let app = await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {
  let page = await app.firstWindow();
  await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-09");
  await page.getByLabel("Dönem",{exact:true}).fill("2025-11");
  for(const name of ["Satışlar","Alışlar ve maliyet","Giderler","Raporlar","Özet"]) {
   await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name,exact:true}).click();
   await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-11");
  }
  await app.close(); app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]}); page=await app.firstWindow();
  await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-11");
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Giderler",exact:true}).click();
  await expect(page.getByRole("button",{name:"Gider ekle",exact:true})).toHaveCount(1);
  await expect(page.getByRole("button",{name:"Excel’den aktar",exact:true})).toHaveCount(1);
 } finally {await app.close();await rm(userData,{recursive:true,force:true});}
});

test("overview opens the report as a destination without inline duplication", async () => {
 const userData=await mkdtemp(join(tmpdir(),"esmer-clean-overview-"));
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage());}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{const page=await app.firstWindow();await expect(page.getByRole("heading",{name:"Ay bir bakışta",exact:true})).toBeVisible();await expect(page.getByRole("heading",{name:"Aylık Ürün Kârlılığı",exact:true})).toHaveCount(0);await page.getByRole("button",{name:/Ayın raporunu aç/}).click();await expect(page.getByRole("button",{name:"Raporlar",exact:true})).toHaveAttribute("aria-current","page");}finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("delayed and failed month responses cannot relabel old totals or disable local expense records", async () => {
 const userData=await mkdtemp(join(tmpdir(),"esmer-month-response-"));
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage());}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {
  const page=await app.firstWindow();await expect(page.getByRole("heading",{name:"Ay bir bakışta",exact:true})).toBeVisible();
  await app.evaluate(({ipcMain})=>{
   const registry=ipcMain as unknown as {_invokeHandlers:Map<string,(event:unknown,operation:string,payload:unknown)=>unknown>},original=registry._invokeHandlers.get("esmer:request")!;
   ipcMain.removeHandler("esmer:request");ipcMain.handle("esmer:request",async(event,operation,payload)=>{
    const period=(payload as {period?:string})?.period;
    if(operation==="openSales"&&period==="2025-11")return {status:"unavailable",code:"SERVICE_UNAVAILABLE",message:"Sentetik dönem okuma hatası"};
    const result=await original(event,operation,payload);
    if(operation==="openSales"&&period==="2025-08")await new Promise(resolve=>setTimeout(resolve,500));
    return result;
   });
  });
  await page.getByLabel("Dönem",{exact:true}).fill("2025-08");await expect(page.getByRole("region",{name:"Aylık performans",exact:true})).toHaveCount(0);
  await page.getByLabel("Dönem",{exact:true}).fill("2025-10");await expect(page.getByRole("region",{name:"Aylık performans",exact:true})).toBeVisible();
  await expect(page.getByRole("region",{name:"Aylık performans",exact:true})).not.toContainText("200,00 ₺");
  await page.getByLabel("Dönem",{exact:true}).fill("2025-11");await expect(page.getByRole("alert")).toContainText("Sentetik dönem okuma hatası");
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Giderler",exact:true}).click();
  await page.getByRole("button",{name:"Gider ekle",exact:true}).click();await page.getByLabel("Kategori",{exact:true}).fill("Sentetik kira");
  await page.getByLabel("Dönem",{exact:true}).fill("2025-12");await expect(page.getByRole("alertdialog")).toBeVisible();await page.getByRole("button",{name:"Düzenlemeye devam et",exact:true}).click();
  await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-11");
  expect(await page.evaluate(()=>window.esmer.getPreferences())).toMatchObject({status:"preferences",preferences:{selectedMonth:"2025-11"}});
 } finally {await app.close();await rm(userData,{recursive:true,force:true});}
});

test("recorded invoice return restores its second page and the working month survives data-view changes", async () => {
 const {rawSnapshot}=await import("../helpers/raw-fixture"),{writeRawPackage}=await import("../../src/source/raw-package");
 const userData=await mkdtemp(join(tmpdir(),"esmer-source-return-")),snapshot=rawSnapshot();
 snapshot.headers=Array.from({length:60},(_,index)=>({...snapshot.headers[0],ID:String(index+1),FIS_TURU:"1"}));snapshot.lines=[];
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage());store.importSourcePreview(writeRawPackage(snapshot,"fixture:raw","batch-1"));}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {
  const page=await app.firstWindow();await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-10");
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Alışlar ve maliyet",exact:true}).click();
  await page.getByRole("button",{name:"Faturalar",exact:true}).click();await page.getByRole("button",{name:"Sonraki kaynak kayıtları",exact:true}).first().click();
  const row=page.getByRole("button",{name:"51",exact:true});await row.click();await expect(page.getByText("Fatura numarası mevcut değil",{exact:false})).toBeVisible();
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Alışlar ve maliyet",exact:true}).click();
  await expect(row).toBeFocused();await expect(page.getByRole("status").filter({hasText:"51–60 / 60"}).first()).toBeVisible();
  await page.getByLabel("Dönem",{exact:true}).fill("2025-09");await page.getByRole("button",{name:"Ayarlar",exact:true}).click();
  await page.getByRole("button",{name:"Korunan mali veri görünümü",exact:true}).click();await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-09");
  await page.getByRole("button",{name:"Ayarlar",exact:true}).click();await page.getByRole("button",{name:"Gerçek yedek görünümü",exact:true}).click();await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-09");
 } finally {await app.close();await rm(userData,{recursive:true,force:true});}
});

test("overview expense figure excludes owner contributions and uses the existing classified summary", async () => {
 const {Expenses}=await import("../../src/expenses/import"),{workbook,row}=await import("../helpers/expense-fixtures");
 const userData=await mkdtemp(join(tmpdir(),"esmer-overview-expense-")),store=openStore(join(userData,"analytics.sqlite"));
 try {
  store.importPackage(businessPackage());const expenses=new Expenses(store),operating=[...row];operating[1]="15.09.2025";operating[2]=null;
  const owner=[...operating];owner[0]="owner-1";owner[3]="Sentetik sahip katkısı";owner[4]="owner-contribution";owner[5]="500";owner[7]="500";
  const preview=expenses.preview(await workbook([operating,owner]));expect(preview.errors).toEqual([]);expenses.confirm({previewId:preview.previewId,keepCandidateRows:[]});
 } finally {store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {const page=await app.firstWindow(),figure=page.getByRole("region",{name:"Aylık performans",exact:true}).getByRole("button",{name:/Kayıtlı giderler/});await expect(figure.locator("strong")).toHaveText("50,00 ₺");await expect(figure).toContainText("eksiksiz");}finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("transaction inspection replaces the primary sales product list", async () => {
 const userData=await mkdtemp(join(tmpdir(),"esmer-dedicated-sale-")),store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage());}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {
  const page=await app.firstWindow();await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Satışlar",exact:true}).click();await page.getByText("İşlemler ve satış dağılımı",{exact:true}).click();await page.getByRole("button",{name:"Tüm işlemleri göster",exact:true}).click();
  const row=page.getByRole("button",{name:"S1",exact:true});await row.click();await expect(page.getByRole("heading",{name:"İşlem Detayı",exact:true})).toBeVisible();
  await expect(page.getByRole("region",{name:"Ürün katkıları",exact:true})).toHaveCount(0);await expect(page.getByRole("region",{name:"Satış özeti",exact:true})).toHaveCount(0);await expect(page.getByRole("main")).toHaveCount(1);
  await page.getByRole("button",{name:"Satışlara dön",exact:true}).click();await expect(row).toBeFocused();
 } finally {await app.close();await rm(userData,{recursive:true,force:true});}
});

test("classic financial input keeps visible highlights and a searchable initial sales list", async () => {
 const {salesPackage}=await import("../helpers/sales-fixtures");const userData=await mkdtemp(join(tmpdir(),"esmer-classic-sales-")),store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(salesPackage());}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {const page=await app.firstWindow();await expect(page.getByRole("heading",{name:"Öne çıkan ürünler",exact:true})).toBeVisible();await expect(page.getByRole("button",{name:/İçme suyu/})).toBeVisible();await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Satışlar",exact:true}).click();const list=page.getByRole("region",{name:"Ürün katkıları",exact:true});await list.getByLabel("Ürün ara",{exact:true}).fill("içme");await expect(list.getByRole("button",{name:"İçme suyu",exact:true})).toBeVisible();await expect(list).toContainText("180,00 ₺");}finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("failed product highlights are a recoverable error rather than an empty month", async () => {
 const {writeFile}=await import("node:fs/promises"),{salesPackage}=await import("../helpers/sales-fixtures");const userData=await mkdtemp(join(tmpdir(),"esmer-highlight-error-")),path=join(userData,"fixture.esmer");await writeFile(path,salesPackage());const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {
  const page=await app.firstWindow();await expect(page.getByRole("heading",{name:"Henüz mali rapor verisi yok",exact:true})).toBeVisible();
  await app.evaluate(({ipcMain,dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});const registry=ipcMain as unknown as {_invokeHandlers:Map<string,(event:unknown,operation:string,payload:unknown)=>unknown>},original=registry._invokeHandlers.get("esmer:request")!;let failed=false;ipcMain.removeHandler("esmer:request");ipcMain.handle("esmer:request",(event,operation,payload)=>{if(operation==="readReportProducts"&&!failed){failed=true;return {status:"unavailable",code:"SERVICE_UNAVAILABLE",message:"Sentetik ürün yükleme hatası"};}return original(event,operation,payload);});},path);
  await page.getByRole("button",{name:"Veri paketi içe aktar",exact:true}).click();await expect(page.getByText("Ürün öne çıkanları okunamadı.",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Satışlar listesine git",exact:true}).click();await expect(page.getByRole("region",{name:"Ürün katkıları",exact:true}).getByRole("button",{name:"İçme suyu",exact:true})).toBeVisible();
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("recorded month failure remains visible during a protected retry and page changes", async () => {
 const {rawSnapshot}=await import("../helpers/raw-fixture"),{writeRawPackage}=await import("../../src/source/raw-package");const userData=await mkdtemp(join(tmpdir(),"esmer-source-retry-")),store=openStore(join(userData,"analytics.sqlite"));try{store.importSourcePreview(writeRawPackage(rawSnapshot(),"fixture:retry","batch-1"));}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {
  const page=await app.firstWindow();await expect(page.getByRole("heading",{name:"Aylık Market Özeti",exact:true})).toBeVisible();
  await app.evaluate(({ipcMain})=>{const registry=ipcMain as unknown as {_invokeHandlers:Map<string,(event:unknown,operation:string,payload:unknown)=>unknown>},original=registry._invokeHandlers.get("esmer:request")!;let attempts=0;ipcMain.removeHandler("esmer:request");ipcMain.handle("esmer:request",(event,operation,payload)=>{if(operation==="querySourceWorkspace"&&(payload as {period?:string}).period==="2024-01"){const failure={status:"source-unavailable",code:"SERVICE_UNAVAILABLE",message:"Sentetik korunacak dönem hatası"};if(++attempts===1)return failure;return new Promise(resolve=>Reflect.set(globalThis,"releaseSourceRetry",()=>resolve(failure)));}return original(event,operation,payload);});});
  await page.getByLabel("Dönem",{exact:true}).fill("2024-01");const retry=page.getByRole("button",{name:"Kaynağı yeniden aç",exact:true});await expect(retry).toBeVisible();await page.getByRole("button",{name:"Giderler",exact:true}).click();await expect(retry).toBeVisible();
  await page.getByRole("button",{name:"Gider ekle",exact:true}).click();await page.getByLabel("Kategori",{exact:true}).fill("Sentetik taslak");await retry.click();await page.getByRole("button",{name:"Düzenlemeye devam et",exact:true}).click();await expect(page.getByLabel("Kategori",{exact:true})).toHaveValue("Sentetik taslak");
  await retry.click();await page.getByRole("button",{name:"Bilgileri bırak",exact:true}).click();await expect(page.getByText("Kaynak kayıtları yükleniyor…",{exact:true})).toBeVisible();expect(await retry.isVisible()).toBe(true);await expect(page.getByRole("alert")).toContainText("Sentetik korunacak dönem hatası");
  await app.evaluate(()=>{Reflect.get(globalThis,"releaseSourceRetry")?.();Reflect.deleteProperty(globalThis,"releaseSourceRetry");});await expect(page.getByText("Kaynak kayıtları yükleniyor…",{exact:true})).toHaveCount(0);await expect(retry).toBeVisible();
 } finally {await app.evaluate(()=>Reflect.get(globalThis,"releaseSourceRetry")?.()).catch(()=>{});await app.close();await rm(userData,{recursive:true,force:true});}
});
