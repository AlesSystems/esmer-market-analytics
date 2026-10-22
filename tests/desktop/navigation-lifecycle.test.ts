import { openReportView, openSection, openWorkspace } from "../helpers/desktop-navigation";
import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {openStore} from "../../src/store/store";
import {businessPackage,businessRecords,addPurchase} from "../helpers/business-fixtures";
import {SalesReports} from "../../src/reports/query";
import {ReportVersions} from "../../src/reports/versions";
import {writeRawPackage} from "../../src/source/raw-package";
import {rawSnapshot} from "../helpers/raw-fixture";
import {executablePath} from "../helpers/desktop-executable";

// The old sidebar screens now live inside Rapor ve Excel. Its sub-views keep one hosted workspace mounted,
// so "leave and return" is exercised through the Rapor bölümleri buttons and through Ayarlar.
test("cancelled invoice reads settle after report-view and Settings return",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"esmer-invoice-lifecycle-")),records=businessRecords();addPurchase(records,"P1");
 const line=records.lines.find(row=>row.documentId==="P1")!;for(let i=1;i<61;i++)records.lines.push({...structuredClone(line),id:`P1-${i}`});
 for(let i=0;i<55;i++)records.documents.push({...structuredClone(records.documents.find(row=>row.id==="P1")!),id:`E-${String(i).padStart(3,"0")}`});
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage(records));}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);await openReportView(page,"Alış belgeleri");await expect(page.getByRole("button",{name:"Belgeyi aç E-000",exact:true})).toBeVisible();
  await app.evaluate(({ipcMain})=>{const registry=ipcMain as unknown as {_invokeHandlers:Map<string,(event:unknown,operation:string,payload:unknown)=>unknown>},original=registry._invokeHandlers.get("esmer:request")!;ipcMain.removeHandler("esmer:request");ipcMain.handle("esmer:request",async(event,operation,payload)=>{const result=await original(event,operation,payload);if(operation==="inspectPurchaseDocument"&&Reflect.get(globalThis,"holdInvoice"))return new Promise(resolve=>Reflect.set(globalThis,"releaseInvoice",()=>resolve(result)));return result;});});
  const hold=()=>app.evaluate(()=>Reflect.set(globalThis,"holdInvoice",true));const release=()=>app.evaluate(()=>{Reflect.set(globalThis,"holdInvoice",false);Reflect.get(globalThis,"releaseInvoice")?.();Reflect.deleteProperty(globalThis,"releaseInvoice");});
  await hold();await page.getByRole("button",{name:"Belgeyi aç E-000",exact:true}).click();await expect(page.getByText("Fatura kayıtları yükleniyor…",{exact:true})).toBeVisible();await openReportView(page,"Aylık rapor");await expect(page.getByRole("heading",{name:"Aylık Ürün Kârlılığı",exact:true})).toBeVisible();await release();await openReportView(page,"Alış belgeleri");await expect(page.getByText("Fatura kayıtları yükleniyor…",{exact:true})).toHaveCount(0);await expect(page.getByRole("button",{name:"Sonraki 50 kayıt",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Sonraki 50 kayıt",exact:true}).click();await page.getByRole("button",{name:"Belgeyi aç P1",exact:true}).click();await expect(page.getByRole("region",{name:"Fatura ayrıntıları",exact:true})).toBeVisible();
  await hold();await page.getByRole("button",{name:"Sonraki 50 kayıt",exact:true}).click();await expect(page.getByText("Fatura kayıtları yükleniyor…",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Ayarlar",exact:true}).click();await expect(page.getByRole("heading",{name:"Ayarlar",level:1})).toBeVisible();await release();await openReportView(page,"Alış belgeleri");await expect(page.getByText("Fatura kayıtları yükleniyor…",{exact:true})).toHaveCount(0);await expect(page.getByRole("button",{name:"Sonraki 50 kayıt",exact:true})).toBeEnabled();await page.getByRole("button",{name:"Sonraki 50 kayıt",exact:true}).click();await expect(page.getByText("51–61 / 61",{exact:true})).toBeVisible();
 }finally{await app.evaluate(()=>Reflect.get(globalThis,"releaseInvoice")?.()).catch(()=>{});await app.close();await rm(userData,{recursive:true,force:true});}
});

test("recorded archive retains its detail and filtered second page without another history read",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"esmer-saved-lifecycle-")),store=openStore(join(userData,"analytics.sqlite"));
 try{const versions=new ReportVersions(store,new SalesReports(store));let previous:string|null=null;for(let i=0;i<12;i++){store.importPackage(businessPackage(undefined,{extractionId:`archive-${i}`}));const candidate=versions.open({period:"2025-09"});if(candidate.status!=="monthly")throw Error("Expected monthly");versions.accept({candidateId:candidate.report.id,previousAcceptedId:previous,reason:`review-72-${i}`});previous=candidate.report.id;}store.importSourcePreview(writeRawPackage(rawSnapshot(),"fixture:archive","raw-1"));}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-10");await page.getByLabel("Dönem",{exact:true}).fill("2025-09");
  await app.evaluate(({ipcMain})=>{const registry=ipcMain as unknown as {_invokeHandlers:Map<string,(event:unknown,operation:string,payload:unknown)=>unknown>},original=registry._invokeHandlers.get("esmer:request")!;let reads=0;ipcMain.removeHandler("esmer:request");ipcMain.handle("esmer:request",async(event,operation,payload)=>{const result=await original(event,operation,payload);if(operation==="listReportVersions"){Reflect.set(globalThis,"archiveReads",++reads);if(reads>1)return new Promise(resolve=>Reflect.set(globalThis,"releaseArchive",()=>resolve(result)));}return result;});});
  await openReportView(page,"Aylık rapor");await page.getByRole("button",{name:"Önceki kaydedilmiş raporlar",exact:true}).click();await page.getByLabel("Arşivde ara",{exact:true}).fill("review-72");await page.getByLabel("Sıralama",{exact:true}).selectOption("oldest");await page.getByRole("button",{name:"Sonraki sürümler",exact:true}).click();await page.getByRole("button",{name:"Kaydedilmiş sürümü aç",exact:true}).first().click();await expect(page.getByRole("button",{name:"Rapor listesine dön",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Ayarlar",exact:true}).click();await openReportView(page,"Aylık rapor");await expect(page.getByRole("button",{name:"Rapor listesine dön",exact:true})).toBeVisible();expect(await app.evaluate(()=>Reflect.get(globalThis,"archiveReads"))).toBe(1);
  await page.getByRole("button",{name:"Rapor listesine dön",exact:true}).click();await expect(page.getByLabel("Arşivde ara",{exact:true})).toHaveValue("review-72");await expect(page.getByLabel("Sıralama",{exact:true})).toHaveValue("oldest");await expect(page.getByText("Sayfa 2 / 2",{exact:true})).toBeVisible();await openReportView(page,"Veri ve kaynak");await expect(page.getByRole("heading",{name:"Veri ve kaynak",level:1,exact:true})).toBeVisible();await openReportView(page,"Aylık rapor");await expect(page.getByText("Sayfa 2 / 2",{exact:true})).toBeVisible();expect(await app.evaluate(()=>Reflect.get(globalThis,"archiveReads"))).toBe(1);
 }finally{await app.evaluate(()=>Reflect.get(globalThis,"releaseArchive")?.()).catch(()=>{});await app.close();await rm(userData,{recursive:true,force:true});}
});

test("retained purchasing links return to their immediate parent with technical fields collapsed",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"esmer-purchase-parent-")),records=businessRecords();addPurchase(records,"P1");addPurchase(records,"D1");records.documents.find(row=>row.id==="D1")!.purchasing={...records.documents.find(row=>row.id==="D1")!.purchasing!,representation:"dispatch",convertedTo:"P1",invoiced:true};
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage(records));}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);const purchasing=()=>openReportView(page,"Alış belgeleri");await purchasing();await page.getByRole("button",{name:"D1",exact:true}).click();const detail=page.getByRole("main",{name:"Alış kaynak detayı"});await expect(detail.getByText("Kaynak kimliği",{exact:true})).not.toBeVisible();await expect(detail.getByText("Eşleme sürümü",{exact:true})).not.toBeVisible();await detail.getByText("Veri ve hesaplama ayrıntıları",{exact:true}).click();await expect(detail.getByText("Eşleme sürümü",{exact:true})).toBeVisible();
  const parent=detail.getByRole("button",{name:"P1",exact:true});await parent.click();await expect(detail.locator("dl").first()).toContainText("P1");await page.getByRole("button",{name:"Önceki belgeye dön",exact:true}).click();await expect(parent).toBeFocused();await expect(detail.locator("dl").first()).toContainText("D1");await parent.click();await page.keyboard.press("Escape");await expect(parent).toBeFocused();await expect(detail.locator("dl").first()).toContainText("D1");
  await openReportView(page,"Veri ve kaynak");await expect(page.getByRole("heading",{name:"Satışlar",exact:true})).toBeVisible();await purchasing();await expect(detail.getByRole("heading",{name:"Maliyet ve alış kaynak detayı",exact:true})).toBeVisible();await expect(detail.locator("dl").first()).toContainText("D1");
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

// Rapor ve Excel stays mounted once visited, so an open purchase document survives other sections.
test("open purchase detail survives leaving Rapor ve Excel for another section",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"esmer-purchase-section-")),records=businessRecords();addPurchase(records,"D1");
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage(records));}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);await openReportView(page,"Alış belgeleri");await page.getByRole("button",{name:"D1",exact:true}).click();const detail=page.getByRole("main",{name:"Alış kaynak detayı"});await expect(detail.locator("dl").first()).toContainText("D1");
  await openSection(page,"Bu ay");await expect(page.getByRole("heading",{name:"Bu ay",level:1})).toBeVisible();await openSection(page,"Rapor ve Excel");await expect(detail.locator("dl").first()).toContainText("D1",{timeout:3000});
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});
