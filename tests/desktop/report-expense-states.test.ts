import { openWorkspace, openReportView, openSection } from "../helpers/desktop-navigation";
import {test, expect, _electron as electron} from "@playwright/test";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {DatabaseSync} from "node:sqlite";
import {openStore} from "../../src/store/store";
import {writeRawPackage} from "../../src/source/raw-package";
import {rawSnapshot} from "../helpers/raw-fixture";
import {businessPackage} from "../helpers/business-fixtures";
import {SalesReports} from "../../src/reports/query";
import {ReportVersions} from "../../src/reports/versions";

const executablePath=process.env.ESMER_EXECUTABLE??(process.platform==="darwin"?resolve(`release/mac${process.arch==="arm64"?"-arm64":""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`):process.platform==="win32"?resolve("release/win-unpacked/Esmer Market Analytics.exe"):resolve("release/linux-unpacked/esmer-market-analytics"));

test("report history failure has retry, while a successful empty history explains readiness",async()=>{
    test.skip(true, "old UI, removed in P5");
 const userData=await mkdtemp(join(tmpdir(),"report-states-")),database=join(userData,"analytics.sqlite");
 const store=openStore(database);store.importSourcePreview(writeRawPackage(rawSnapshot(),"fixture:reports","batch-1"));store.close();
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);await expect(page.getByRole("heading",{name:"Kâr tahmini için veri paketi gerekiyor",exact:true})).toBeVisible();
  const db=new DatabaseSync(database);db.exec("ALTER TABLE report_versions RENAME TO report_versions_unavailable");db.close();
  await openReportView(page, "Aylık rapor");
  await page.getByRole("button",{name:"Önceki kaydedilmiş raporlar",exact:true}).click();
  await expect(page.getByRole("button",{name:"Raporları yeniden yükle"})).toBeVisible();
  await expect(page.getByText("Bu dönem için kaydedilmiş rapor yok.",{exact:true})).not.toBeVisible();
  await expect(page.getByText("Bu dönem için kaydedilmiş rapor yok.",{exact:true})).toHaveCount(0);
  const restored=new DatabaseSync(database);restored.exec("ALTER TABLE report_versions_unavailable RENAME TO report_versions");restored.close();
  await page.getByRole("button",{name:"Raporları yeniden yükle"}).click();
  await expect(page.getByText("Bu dönem için kaydedilmiş rapor yok.",{exact:true})).toBeVisible();
  await expect(page.getByText("Açık SQL yedeğinin mali anlamları doğrulanmadı;",{exact:false})).toBeVisible();
  await expect(page.getByRole("main")).toHaveCount(1);
  const failedAgain=new DatabaseSync(database);failedAgain.exec("ALTER TABLE report_versions RENAME TO report_versions_unavailable");failedAgain.close();
  await page.locator(".sidebar").getByLabel("Dönem",{exact:true}).fill("2025-11");await expect(page.getByRole("button",{name:"Raporları yeniden yükle"})).toBeVisible();await expect(page.getByText("Bu dönem için kaydedilmiş rapor yok.",{exact:true})).not.toBeVisible();
  await page.locator(".sidebar").getByLabel("Dönem",{exact:true}).fill("2025-10");await expect(page.getByRole("button",{name:"Raporları yeniden yükle"})).toBeVisible();await expect(page.getByText("Bu dönem için kaydedilmiş rapor yok.",{exact:true})).not.toBeVisible();
  const repaired=new DatabaseSync(database);repaired.exec("ALTER TABLE report_versions_unavailable RENAME TO report_versions");repaired.close();await page.getByRole("button",{name:"Raporları yeniden yükle"}).click();await expect(page.getByText("Bu dönem için kaydedilmiş rapor yok.",{exact:true})).toBeVisible();
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("source expenses and opened saved reports expose one main landmark and useful empty expense action",async()=>{
    test.skip(true, "old UI, removed in P5");
 const userData=await mkdtemp(join(tmpdir(),"expense-report-landmarks-")),database=join(userData,"analytics.sqlite");
 const store=openStore(database);store.importPackage(businessPackage());
 const reports=new ReportVersions(store,new SalesReports(store));const candidate=reports.open({period:"2025-09"});if(candidate.status!=="monthly")throw Error("missing fixture report");reports.accept({candidateId:candidate.report.id,previousAcceptedId:null,reason:"Synthetic review"});
 store.importSourcePreview(writeRawPackage(rawSnapshot(),"fixture:landmarks","batch-1"));store.close();
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);await expect(page.getByRole("heading",{name:"Kâr tahmini için veri paketi gerekiyor",exact:true})).toBeVisible();
  await openSection(page, "Giderler");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByText("Bu dönemde gider kaydı yok.",{exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Excel’den aktar"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Şablonu kaydet"})).toBeVisible();
  await page.getByRole("button",{name:"Excel’den aktar"}).click();
  await expect(page.getByRole("heading",{name:"1. Şablonu indir / dosya seç"})).toBeFocused();
  await openReportView(page, "Aylık rapor");
  await page.getByRole("button",{name:"Önceki kaydedilmiş raporlar",exact:true}).click();
  await page.locator(".sidebar").getByLabel("Dönem",{exact:true}).fill("2025-09");
  await expect(page.getByRole("button",{name:"Kaydedilmiş sürümü aç",exact:true})).toBeVisible();
  const db=new DatabaseSync(database);db.exec("ALTER TABLE report_versions RENAME TO report_versions_unavailable");db.close();
  await page.getByRole("button",{name:"Kaydedilmiş sürümü aç",exact:true}).click();
  await expect(page.getByRole("alert")).toContainText("Yerel hizmet başlatılamadı. Uygulamayı yeniden açın.");
  const restored=new DatabaseSync(database);restored.exec("ALTER TABLE report_versions_unavailable RENAME TO report_versions");restored.close();
  await page.getByRole("button",{name:"Kaydedilmiş sürümü aç",exact:true}).click();
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByText("Sentetik gösterim raporu — gerçek market sonuçları değildir.",{exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Raporlar",exact:true})).toBeFocused();
  await page.getByRole("button",{name:"Rapor listesine dön",exact:true}).click();
  await expect(page.getByRole("button",{name:"Kaydedilmiş sürümü aç",exact:true})).toBeFocused();
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});
