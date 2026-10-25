import { openWorkspace, openReportView, openSection } from "../helpers/desktop-navigation";
import {test,expect,_electron as electron,type Page} from "@playwright/test";
import {mkdtemp,rm,mkdir,readFile,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {openStore} from "../../src/store/store";
import {businessPackage} from "../helpers/business-fixtures";
import {writeRawPackage} from "../../src/source/raw-package";
import {rawSnapshot} from "../helpers/raw-fixture";
import {estimatePackage,estimateSnapshot} from "../helpers/estimate-fixture";
const executablePath=process.env.ESMER_EXECUTABLE??(process.platform==="darwin"?resolve(`release/mac${process.arch==="arm64"?"-arm64":""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`):process.platform==="win32"?resolve("release/win-unpacked/Esmer Market Analytics.exe"):resolve("release/linux-unpacked/esmer-market-analytics"));
const period=(page:Page)=>page.locator(".sidebar").getByLabel("Dönem",{exact:true});
for(const empty of [false,true])test(`demo prioritizes ${empty?"empty":"estimated"} imported source across one workspace`,async()=>{
    test.skip(true, "old UI, removed in P5");
 const userData=await mkdtemp(join(tmpdir(),"esmer-demo-")),store=openStore(join(userData,"analytics.sqlite"));
 try{store.importPackage(businessPackage());const snapshot=estimateSnapshot();if(empty){snapshot.headers=[];snapshot.lines=[];}store.importSourcePreview(estimatePackage(snapshot));}finally{store.close();}
 const initialMonth="2025-10";
 let app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{const page=await app.firstWindow();await openWorkspace(page);await expect(period(page)).toHaveValue(initialMonth);await period(page).fill("2025-10");await page.getByRole("button",{name:"Ayarlar",exact:true}).click();await expect(page.getByRole("button",{name:"Korunan mali veri görünümü",exact:true})).toHaveCount(0);await page.getByRole("button",{name:"Ayarları kapat",exact:true}).click();
  // Bu ay leads with the source month, never the retained financial dataset.
  await expect(page.getByRole("heading",{name:"Ekim 2025",level:1})).toBeVisible();await expect(page.getByRole("region",{name:"Aylık performans"})).toHaveCount(0);
  await openReportView(page,"Aylık rapor");await expect(page.getByRole("region",{name:"Kaynak tahmini"})).toContainText("Doğrulanmamış tahmin");if(!empty)await expect(page.getByRole("region",{name:"Kaynak tahmini"})).toContainText("-20,00 ₺");await expect(page.getByRole("table",{name:"Ürün tahminleri",exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true})).toBeVisible();const output=join(userData,"demo.xlsx");await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},output);await page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true}).click();await expect(page.getByText("Doğrulanmamış tahmin kaydedildi.",{exact:true})).toBeVisible();expect((await readFile(output)).length).toBeGreaterThan(1000);await page.getByRole("button",{name:"Önceki kaydedilmiş raporlar",exact:true}).click();await expect(page.getByRole("region",{name:"Kaynak tahmini"})).toBeHidden();await page.getByRole("button",{name:"Güncel rapora dön",exact:true}).click();await expect(period(page)).toHaveValue("2025-10");
  if(!empty&&process.env.ESMER_CAPTURE_EVIDENCE){const directory=resolve("work/poteto/v0.5-demo/screenshots");await mkdir(directory,{recursive:true});await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1120,760));for(const name of ["Bu ay","Ürünler","Rapor ve Excel","Giderler"] as const){await openSection(page,name);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:join(directory,`${name}.png`)});}await page.getByRole("button",{name:"Ayarlar",exact:true}).click();await page.screenshot({path:join(directory,"Ayarlar.png")});await page.getByRole("button",{name:"Ayarları kapat",exact:true}).click();await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0];window.setSize(680,800);window.webContents.setZoomFactor(2);});await openSection(page,"Bu ay");await page.screenshot({path:join(directory,"compact-zoom.png"),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await openReportView(page,"Alış belgeleri");await expect(period(page)).toHaveValue("2025-10");
  for(const name of ["Giderler","Bu ay"] as const){await openSection(page,name);await expect(period(page)).toHaveValue("2025-10");}
 await app.close();app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});const reopened=await app.firstWindow();await openWorkspace(reopened);await expect(period(reopened)).toHaveValue("2025-10");await expect(reopened.getByRole("heading",{name:"Ekim 2025",level:1})).toBeVisible();await openReportView(reopened,"Aylık rapor");await expect(reopened.getByRole("region",{name:"Kaynak tahmini"})).toBeVisible();
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("source read failure cannot fall through to retained financial results",async()=>{
    test.skip(true, "old UI, removed in P5");
 const userData=await mkdtemp(join(tmpdir(),"esmer-demo-failure-")),store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage());store.importSourcePreview(estimatePackage());}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});try{const page=await app.firstWindow();await openWorkspace(page);await openReportView(page,"Aylık rapor");await expect(page.getByRole("region",{name:"Kaynak tahmini"})).toBeVisible();await app.evaluate(({ipcMain})=>{const registry=ipcMain as unknown as {_invokeHandlers:Map<string,(event:unknown,operation:string,payload:unknown)=>unknown>},original=registry._invokeHandlers.get("esmer:request")!;ipcMain.removeHandler("esmer:request");ipcMain.handle("esmer:request",(event,operation,payload)=>operation==="querySourceWorkspace"?{status:"source-unavailable",code:"SERVICE_UNAVAILABLE",message:"Sentetik kaynak okuma hatası"}:original(event,operation,payload));});await page.reload();await openWorkspace(page);
  // Rapor ve Excel shows the read failure with a retry, never the retained financial report.
  await openSection(page,"Rapor ve Excel");const main=page.locator(".reports-page");await expect(main.getByRole("alert")).toContainText("Sentetik kaynak okuma hatası");await expect(main.getByRole("button",{name:"Yeniden dene",exact:true})).toBeVisible();await expect(page.getByRole("region",{name:"Aylık performans"})).toHaveCount(0);await expect(page.getByRole("heading",{name:"Seçili rapor",exact:true})).toHaveCount(0);await expect(page.getByRole("region",{name:"Kaynak tahmini"})).toHaveCount(0);
  await page.getByRole("button",{name:"Ayarlar",exact:true}).click();await expect(page.getByRole("alert").getByText("Sentetik kaynak okuma hatası",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Ayarları kapat",exact:true}).click();
  await openSection(page,"Giderler");await expect(page.getByRole("heading",{name:"Giderler",exact:true})).toBeVisible();}finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("financial imports retain source precedence and source replacement refreshes the current report",async()=>{
    test.skip(true, "old UI, removed in P5");
 const userData=await mkdtemp(join(tmpdir(),"esmer-demo-refresh-")),store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage());store.importSourcePreview(estimatePackage());}finally{store.close();}
 const financialFile=join(userData,"financial.json"),sourceFile=join(userData,"source.json"),snapshot=estimateSnapshot();snapshot.lines[0].BELGE_TARIHINDEKI_SON_ALIS_FIYATI="30";await writeFile(financialFile,businessPackage(undefined,{extractionId:"demo-financial-new"}));await writeFile(sourceFile,estimatePackage(snapshot,"demo-source-new"));
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});try{const page=await app.firstWindow();await openWorkspace(page);await openReportView(page,"Aylık rapor");await expect(page.getByRole("region",{name:"Kaynak tahmini"})).toContainText("-20,00 ₺");
  for(const file of [financialFile,sourceFile]){await page.getByRole("button",{name:"Ayarlar",exact:true}).click();await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);await page.getByRole("button",{name:"Veri paketi içe aktar",exact:true}).click();
   // A successful import returns to Bu ay; the report then reads the active source.
   await expect(page.getByRole("heading",{name:"Ekim 2025",level:1})).toBeVisible();await expect(page.getByRole("region",{name:"Aylık performans"})).toHaveCount(0);await openReportView(page,"Aylık rapor");await expect(page.getByRole("region",{name:"Kaynak tahmini"})).toContainText(file===financialFile?"-20,00 ₺":"60,00 ₺");await expect(page.getByRole("region",{name:"Aylık performans"})).toHaveCount(0);await expect(period(page)).toHaveValue("2025-10");}
  await expect(page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true})).toBeVisible();}finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("raw-only imports lead with recorded counts and lookup while reports explain unavailable estimates",async()=>{
    test.skip(true, "old UI, removed in P5");
 const userData=await mkdtemp(join(tmpdir(),"esmer-demo-raw-")),store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage());store.importSourcePreview(writeRawPackage(rawSnapshot(),"fixture:demo-raw","demo-raw-1"));}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});try{const page=await app.firstWindow();await openWorkspace(page);
  await expect(page.getByRole("heading",{name:"Kâr tahmini için veri paketi gerekiyor",exact:true})).toBeVisible();await expect(page.getByRole("region",{name:"Ayın rakamları"})).toHaveCount(0);
  await openReportView(page,"Veri ve kaynak");await expect(page.getByRole("region",{name:"Kaynak kayıt göstergeleri",exact:true})).toBeVisible();await expect(page.getByRole("region",{name:"Kaynak tahmini"})).toHaveCount(0);await page.getByRole("button",{name:"Tüm kaynak belgeleri"}).click();await expect(page.getByLabel("Belge türü (kaynak kodu)",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Ürün kimliklerini göster",exact:true}).click();await expect(page.getByRole("button",{name:"3",exact:true})).toBeVisible();await expect(page.getByRole("region",{name:"Kaynak tahmini"})).toHaveCount(0);
  await openReportView(page,"Aylık rapor");await expect(page.getByText("Bu paket maliyet adayı içermiyor; tahmin hazırlanamadı.",{exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Veri paketi içe aktarmaya git",exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true})).toHaveCount(0);await expect(page.getByRole("button",{name:"Önceki kaydedilmiş raporlar",exact:true})).toBeVisible();}finally{await app.close();await rm(userData,{recursive:true,force:true});}
});
