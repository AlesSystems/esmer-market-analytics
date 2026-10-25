import { openWorkspace, openReportView, openSection, openSettings, importPackage } from "../helpers/desktop-navigation";
import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {openStore} from "../../src/store/store";
import {writeRawPackage} from "../../src/source/raw-package";
import {rawSnapshot} from "../helpers/raw-fixture";
import {businessPackage} from "../helpers/business-fixtures";
import {SalesReports} from "../../src/reports/query";
import {ReportVersions} from "../../src/reports/versions";
import {Expenses} from "../../src/expenses/import";
import {workbook,row} from "../helpers/expense-fixtures";
/** The old Satışlar screen: all source documents narrowed to the sales-related type codes. */
async function openSourceSales(page:import("@playwright/test").Page){await page.getByRole("button",{name:"Tüm kaynak belgeleri",exact:true}).click();await page.getByLabel("Kayıt kapsamı").selectOption("sales");}
const executablePath=process.env.ESMER_EXECUTABLE??(process.platform==="darwin"?resolve(`release/mac${process.arch==="arm64"?"-arm64":""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`):process.platform==="win32"?resolve("release/win-unpacked/Esmer Market Analytics.exe"):resolve("release/linux-unpacked/esmer-market-analytics"));
test("raw backup drives all destinations, preserved reports and scoped detail offline",async({},testInfo)=>{
    test.skip(true, "old UI, removed in P5");
 const userData=await mkdtemp(join(tmpdir(),"source-workspace-")),database=join(userData,"analytics.sqlite");
 const snapshot=rawSnapshot();snapshot.headers=[snapshot.headers[0],{...snapshot.headers[0],ID:"2",FIS_TURU:"1"},{...snapshot.headers[0],ID:"3",FIS_TURU:"999"}];snapshot.lines=[{...snapshot.lines[0],STOK:"333"},{...snapshot.lines[0],ID:"3",FIS:"2",FIS_TURU:"1",STOK:"444"}];
 const store=openStore(database);store.importPackage(businessPackage());
 const reports=new ReportVersions(store,new SalesReports(store));const candidate=reports.open({period:"2025-09"});if(candidate.status!=="monthly")throw Error("missingreport");reports.accept({candidateId:candidate.report.id,previousAcceptedId:null,reason:"Synthetic retained report"});
 const expenses=new Expenses(store);const preview=expenses.preview(await workbook([[row[0],"15.10.2025","01.11.2025",...row.slice(3)]]));expenses.confirm({previewId:preview.previewId,keepCandidateRows:[]});
 store.importSourcePreview(writeRawPackage(snapshot,"fixture:workspace","batch-1"));store.close();
 let app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  let page=await app.firstWindow();await openWorkspace(page);await openReportView(page,"Veri ve kaynak");await expect(page.getByRole("heading",{name:"Veri ve kaynak",exact:true})).toBeVisible();
  await expect(page.getByRole("group",{name:"Günlük kaynak belge kayıtları"})).toBeVisible();
  await expect(page.getByRole("list",{name:"Kaynak belge türlerine göre kayıt sayıları"})).toBeVisible();
  await page.getByText("Belge türlerinin tam sayılarını göster",{exact:true}).click();
  await page.getByText("Günlük tam sayıları göster",{exact:true}).click();
  await expect(page.getByRole("table",{name:"Günlük kaynak belge kayıtları tablosu"})).toBeVisible();
  await expect(page.getByRole("table",{name:"Kaynak belge türleri tablosu"})).toBeVisible();
  await expect(page.getByText("3 / 3 tür kodu gösteriliyor",{exact:false})).toBeVisible();
  await expect(page.getByRole("table",{name:"Kaynak belge türleri tablosu"}).getByRole("button",{name:"999 · Tür anlamı doğrulanmadı"})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath("source-workspace.png"),fullPage:true});
  await openSourceSales(page);await expect(page.getByRole("heading",{name:"Satışlar",exact:true})).toBeVisible();
  await expect(page.getByRole("cell",{name:"123,4567890123456789",exact:true})).toBeVisible();
  await expect(page.getByRole("cell",{name:"01.10.2025",exact:true})).toBeVisible();
  await page.getByText("Gelişmiş filtreler",{exact:true}).click();
  await page.getByLabel("Ürün kayıt ID’si",{exact:true}).fill("333");
  await page.getByRole("button",{name:"Filtreleri temizle",exact:true}).click();
  await expect(page.getByLabel("Ürün kayıt ID’si",{exact:true})).toHaveValue("");
  await page.getByRole("button",{name:"Ürün kimliklerini göster",exact:true}).click();
  await page.getByRole("button",{name:"333",exact:true}).click();
  await expect(page.getByRole("button",{name:"1",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Filtreleri temizle",exact:true}).click();
  await expect(page.getByLabel("Ürün kayıt ID’si",{exact:true})).toHaveValue("");
  await expect(page.locator("main[aria-busy]")).toHaveAttribute("aria-busy","false");
  if(!await page.locator(".source-advanced").evaluate(node=>node.hasAttribute("open")))await page.getByText("Gelişmiş filtreler",{exact:true}).click();
  await page.getByLabel("Ürün kayıt ID’si",{exact:true}).pressSequentially("333");await expect(page.getByLabel("Ürün kayıt ID’si",{exact:true})).toHaveValue("333");await page.getByRole("button",{name:"Filtreleri uygula",exact:true}).click();
  await page.getByRole("button",{name:"1",exact:true}).click();await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toBeVisible();await expect(page.getByRole("heading",{name:"Belge satırları",exact:true})).toBeVisible();
  await expect(page.getByText("KDV toplamı · doğrulanmadı",{exact:true})).toBeVisible();
  await page.getByRole("region",{name:"Kaynak belge ayrıntıları",exact:true}).getByText("Veri ve hesaplama ayrıntıları",{exact:true}).click();
  await page.getByRole("checkbox",{name:"Tam kaynak değerlerini göster",exact:true}).check();
  await expect(page.getByText("3.4567890123456789",{exact:true})).toHaveCount(2);
  await expect(page.getByRole("columnheader",{name:"Kaynak miktar",exact:true})).toBeVisible();
  await expect(page.getByRole("cell",{name:"2 2.000",exact:true})).toBeVisible();
  await expect(page.getByRole("columnheader",{name:"FIS",exact:true})).toHaveCount(0);
  await openReportView(page,"Alış belgeleri");await expect(page.getByRole("button",{name:"2",exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"1",exact:true})).toHaveCount(0);
  await openSection(page,"Giderler");await expect(page.getByRole("heading",{name:"Giderler",exact:true})).toBeVisible();await expect(page.getByRole("cell",{name:"Kira Faaliyet gideri",exact:true})).toBeVisible();
  await openReportView(page,"Aylık rapor");await expect(page.getByRole("heading",{name:"Raporlar",exact:true})).toBeVisible();await page.getByRole("button",{name:"Önceki kaydedilmiş raporlar",exact:true}).click();await expect(page.getByText("Bu dönem için kaydedilmiş rapor yok.",{exact:true})).toBeVisible();
  page.locator(".sidebar").getByLabel("Dönem",{exact:true}).fill("2025-09");await page.getByRole("button",{name:"Kaydedilmiş sürümü aç",exact:true}).click();await expect(page.getByText("Sentetik gösterim raporu — gerçek market sonuçları değildir.",{exact:true})).toBeVisible();
  page.locator(".sidebar").getByLabel("Dönem",{exact:true}).fill("2025-10");await openReportView(page,"Veri ve kaynak");await expect(page.getByRole("heading",{name:"Veri ve kaynak",exact:true})).toBeVisible();
  const writer=openStore(database);writer.importSourcePreview(writeRawPackage(snapshot,"fixture:workspace","batch-2"));writer.close();
  await page.getByRole("button",{name:"Tüm kaynak belgeleri",exact:true}).click();await expect(page.getByText("Kaynak sürümü değişti. Yeni sürümü açın.",{exact:false})).toBeVisible();await page.getByRole("button",{name:"Kaynağı yeniden aç",exact:true}).click();await expect(page.getByRole("heading",{name:"Veri ve kaynak",exact:true})).toBeVisible();await openSourceSales(page);await page.getByRole("button",{name:"1",exact:true}).click();await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toBeVisible();
  await openReportView(page,"Veri ve kaynak");await expect(page.getByRole("heading",{name:"Veri ve kaynak",exact:true})).toBeVisible();page.locator(".sidebar").getByLabel("Dönem",{exact:true}).fill("2025-11");
  await expect(page.getByText("Kapsam dışında",{exact:true}).first()).toBeVisible();
  await expect(page.getByText("Belge türleri bu dönem için gösterilemiyor; dönem yedek kapsamında değil.",{exact:true})).toBeVisible();
  await expect(page.getByText("Günlük kayıtlar bu dönem için gösterilemiyor; dönem yedek kapsamında değil.",{exact:true})).toBeVisible();
  await app.close();app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});page=await app.firstWindow();await openWorkspace(page);await expect(page.locator(".sidebar").getByLabel("Dönem",{exact:true})).toHaveValue("2025-11");await openReportView(page,"Veri ve kaynak");await expect(page.getByRole("heading",{name:"Veri ve kaynak",exact:true})).toBeVisible();await expect(page.getByText("Kapsam dışında",{exact:true}).first()).toBeVisible();
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});

test("an unreadable source retains expense recovery and replacement-import access",async()=>{
    test.skip(true, "old UI, removed in P5");
 const {DatabaseSync}=await import("node:sqlite");const {writeFile}=await import("node:fs/promises");
 const userData=await mkdtemp(join(tmpdir(),"source-failure-")),database=join(userData,"analytics.sqlite"),file=join(userData,"replacement.json");
 const bytes=writeRawPackage(rawSnapshot(),"fixture:failure","batch-1");await writeFile(file,bytes);
 const store=openStore(database);store.importSourcePreview(bytes);store.close();
 const db=new DatabaseSync(database);db.prepare("UPDATE source_preview SET package_json='{}'").run();db.close();
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);
  // The failure is visible where the records open, with a retry.
  await openReportView(page,"Aylık rapor");await expect(page.getByRole("alert")).toBeVisible();await expect(page.getByRole("alert").getByRole("button",{name:"Yeniden dene",exact:true})).toBeVisible();
  // Expenses stay reachable.
  await openSection(page,"Giderler");await expect(page.getByRole("heading",{name:"Giderler",exact:true})).toBeVisible();
  // Bu ay must not pretend the data is still loading.
  await openSection(page,"Bu ay");await expect(page.getByText("Veriler hazırlanıyor…",{exact:true})).toHaveCount(0);
  // Recovery and replacement import stay reachable from Ayarlar.
  await openSettings(page);await page.getByRole("button",{name:"Yedekleme ve kurtarma",exact:true}).click();await expect(page.getByRole("heading",{name:"Yedekleme ve kurtarma",exact:true})).toBeVisible();
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);
  await importPackage(page);
  await openReportView(page,"Veri ve kaynak");await expect(page.getByRole("heading",{name:"Veri ve kaynak",exact:true})).toBeVisible();
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});
