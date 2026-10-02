import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,rm,writeFile,readFile,mkdir} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {estimateSnapshot,estimatePackage} from "../helpers/estimate-fixture";
import {openStore} from "../../src/store/store";
const executablePath=process.env.ESMER_EXECUTABLE??(process.platform==="darwin"?resolve(`release/mac${process.arch==="arm64"?"-arm64":""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`):process.platform==="win32"?resolve("release/win-unpacked/Esmer Market Analytics.exe"):resolve("release/linux-unpacked/esmer-market-analytics"));
test("packaged estimated import shows loss, returns, exact scope, product drilldown and export offline",async({},testInfo)=>{
 const userData=await mkdtemp(join(tmpdir(),"estimate-desktop-")),file=join(userData,"estimate.json"),output=join(userData,"estimate.xlsx");const s=estimateSnapshot();s.headers.push({...s.headers[0],ID:"3",FIS_TURU:"12"});s.lines.push({...s.lines[0],ID:"4",FIS:"3",FIS_TURU:"12",TOPLAM_KDV_MATRAHI:"30"});await writeFile(file,estimatePackage(s));
 let app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  let page=await app.firstWindow();await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);await page.getByRole("button",{name:"Veri paketi içe aktar",exact:true}).click();
  const estimate=page.getByRole("region",{name:"Kaynak tahmini"});await expect(estimate.getByRole("heading",{name:"Tahmini satış katkısı (kapsanan satırlar)",exact:true})).toBeVisible();await expect(estimate.getByText("-20,00 ₺",{exact:true}).first()).toBeVisible();await expect(estimate.getByText("-30,00 ₺",{exact:true}).first()).toBeVisible();await expect(estimate.getByText("Doğrulanmamış tahmin — net kâr değildir.",{exact:false})).toBeVisible();
  await page.getByLabel("Ürün kayıt ID’siyle ara",{exact:true}).fill("3");await page.getByRole("button",{name:"Tahmini ürünü ara",exact:true}).click();await expect(estimate.getByRole("button",{name:"Ürün #3",exact:true})).toBeVisible();await page.getByRole("button",{name:"Tüm tahmini ürünler",exact:true}).click();
  await app.evaluate(({webContents})=>{webContents.getAllWebContents().find(w=>w.getType()==="window")?.setZoomFactor(1.25);});
  await estimate.getByRole("heading",{name:"Tahmini satış katkısı",exact:true}).scrollIntoViewIfNeeded();
  const screenshot=testInfo.outputPath("source-estimate.png");await page.screenshot({path:screenshot,fullPage:true});
  // Public evidence only uses the synthetic fixture.
  const evidence=resolve("workstreams/estimated-v1/evidence");await mkdir(evidence,{recursive:true});await writeFile(join(evidence,"source-estimate.png"),await readFile(screenshot));
  await page.getByRole("button",{name:"Ürün #3",exact:true}).click();await page.getByRole("button",{name:"1",exact:true}).click();await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toBeVisible();await expect(page.getByRole("columnheader",{name:"Tarihsel alış maliyeti adayı · doğrulanmadı",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Özet",exact:true}).click();await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},output);const exportButton=page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true});await exportButton.focus();await page.keyboard.press("Enter");await expect(page.getByText("Doğrulanmamış tahmin kaydedildi.",{exact:true})).toBeVisible();expect((await readFile(output)).byteLength).toBeGreaterThan(1000);
  await app.close();app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});page=await app.firstWindow();await expect(page.getByRole("region",{name:"Kaynak tahmini"}).getByText("-20,00 ₺",{exact:true}).first()).toBeVisible();await page.getByLabel("Dönem",{exact:true}).fill("2025-11");await expect(page.getByRole("region",{name:"Kaynak tahmini"}).getByText("Bilinmiyor",{exact:true}).first()).toBeVisible();
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});

test("private prepared estimate package opens offline without revealing operands in test output",async()=>{
 test.skip(!process.env.ESMER_ESTIMATE_PACKAGE,"Private package opt-in required");
 const userData=await mkdtemp(join(tmpdir(),"estimate-private-desktop-"));
 // No private row assertions or screenshots; trace/video must remain disabled for this opt-in.
 const store=openStore(join(userData,"analytics.sqlite"));const result=store.importSourcePreview(await readFile(process.env.ESMER_ESTIMATE_PACKAGE!));store.close();expect(result.status).toBe("preview-imported");
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});try{const page=await app.firstWindow();await expect(page.getByRole("region",{name:"Kaynak tahmini"}).getByRole("heading",{name:"Tahmini satış katkısı (kapsanan satırlar)",exact:true})).toBeVisible();await expect(page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true})).toBeVisible();}finally{await app.close();await rm(userData,{recursive:true,force:true});}
});
