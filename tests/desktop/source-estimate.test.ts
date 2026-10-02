import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,rm,writeFile,readFile,mkdir} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {estimateSnapshot,estimatePackage} from "../helpers/estimate-fixture";
import {money} from "../../src/ui/format";
const executablePath=process.env.ESMER_EXECUTABLE??(process.platform==="darwin"?resolve(`release/mac${process.arch==="arm64"?"-arm64":""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`):process.platform==="win32"?resolve("release/win-unpacked/Esmer Market Analytics.exe"):resolve("release/linux-unpacked/esmer-market-analytics"));
test("packaged estimated import shows loss, returns, exact scope, product drilldown and export offline",async({},testInfo)=>{
 const userData=await mkdtemp(join(tmpdir(),"estimate-desktop-")),file=join(userData,"estimate.json"),output=join(userData,"estimate.xlsx");const s=estimateSnapshot();s.headers.push({...s.headers[0],ID:"3",FIS_TURU:"12"});s.lines.push({...s.lines[0],ID:"4",FIS:"3",FIS_TURU:"12",TOPLAM_KDV_MATRAHI:"30"});await writeFile(file,estimatePackage(s));
 let app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  let page=await app.firstWindow();await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);await page.getByRole("button",{name:"Veri paketi içe aktar",exact:true}).click();
  const estimate=page.getByRole("region",{name:"Kaynak tahmini"});await expect(estimate.getByRole("heading",{name:"Tahmini satış katkısı (kapsanan satırlar)",exact:true})).toBeVisible();await expect(estimate.getByText("-20,00 ₺",{exact:true}).first()).toBeVisible();await expect(estimate.getByText("-30,00 ₺",{exact:true}).first()).toBeVisible();await expect(estimate.getByText("Doğrulanmamış tahmin — net kâr değildir.",{exact:false})).toBeVisible();
  const screenshot=testInfo.outputPath("source-estimate.png");await page.screenshot({path:screenshot});
  const evidence=resolve("workstreams/estimated-v1/evidence");await mkdir(evidence,{recursive:true});await writeFile(join(evidence,"source-estimate.png"),await readFile(screenshot));
  await page.getByLabel("Ürün kayıt ID’siyle ara",{exact:true}).fill("3");await page.getByRole("button",{name:"Tahmini ürünü ara",exact:true}).click();await expect(estimate.getByRole("button",{name:"Ürün #3",exact:true})).toBeVisible();await page.getByRole("button",{name:"Tüm tahmini ürünler",exact:true}).click();
  await app.evaluate(({webContents})=>{webContents.getAllWebContents().find(w=>w.getType()==="window")?.setZoomFactor(1.25);});
  await app.evaluate(({BrowserWindow})=>{BrowserWindow.getAllWindows()[0].setSize(680,800);});
  await page.getByText("Tahmin yöntemi ve kaynak sürümü",{exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true}).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true})).toBeInViewport();
  await app.evaluate(({webContents})=>{webContents.getAllWebContents().find(w=>w.getType()==="window")?.setZoomFactor(2);});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  await page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true}).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true})).toBeInViewport();
  await page.getByText("Tahmin yöntemi ve kaynak sürümü",{exact:true}).click();
  await app.evaluate(({BrowserWindow})=>{const window=BrowserWindow.getAllWindows()[0];window.setSize(1180,1000);window.webContents.setZoomFactor(1);});
  await page.getByRole("button",{name:"Ürün #3",exact:true}).click();await page.getByRole("button",{name:"1",exact:true}).click();await expect(page.getByRole("heading",{name:"Kaynak belge 1",exact:true})).toBeVisible();await expect(page.getByRole("columnheader",{name:"Tarihsel alış maliyeti adayı · doğrulanmadı",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Özet",exact:true}).click();await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},output);const exportButton=page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true});await exportButton.focus();await page.keyboard.press("Enter");await expect(page.getByText("Doğrulanmamış tahmin kaydedildi.",{exact:true})).toBeVisible();expect((await readFile(output)).byteLength).toBeGreaterThan(1000);
  await app.close();app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});page=await app.firstWindow();await expect(page.getByRole("region",{name:"Kaynak tahmini"}).getByText("-20,00 ₺",{exact:true}).first()).toBeVisible();await page.getByLabel("Dönem",{exact:true}).fill("2025-11");await expect(page.getByRole("region",{name:"Kaynak tahmini"}).getByText("Bilinmiyor",{exact:true}).first()).toBeVisible();
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});

test("private prepared estimate imports exports and restarts offline without revealing operands",async()=>{
 const {ESMER_ESTIMATE_PACKAGE:packagePath,ESMER_ESTIMATE_EXPECTED:expectedPath,ESMER_ESTIMATE_EXPORT:exportPath}=process.env;
 test.skip(!packagePath||!expectedPath||!exportPath,"Private package, expectation and export opt-in required");
 let expected:{summary:{contribution:string|null}};
 try{expected=JSON.parse(await readFile(expectedPath!,"utf8"));}catch{throw Error("PRIVATE_EXPECTATION_UNAVAILABLE");}
 expect(typeof expected.summary.contribution==="string"||expected.summary.contribution===null).toBe(true);
 const expectedAmount=expected.summary.contribution===null?"Bilinmiyor":money(expected.summary.contribution);
 const userData=await mkdtemp(join(tmpdir(),"estimate-private-desktop-"));
 let app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  let page=await app.firstWindow();
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},packagePath!);
  await page.getByRole("button",{name:"Veri paketi içe aktar",exact:true}).click();
  const matches=async()=>{
   const region=page.getByRole("region",{name:"Kaynak tahmini"});
   await expect(region.getByRole("heading",{name:"Tahmini satış katkısı (kapsanan satırlar)",exact:true})).toBeVisible();
   return (await region.locator("article.metric").first().locator("strong").textContent())===expectedAmount;
  };
  await expect.poll(matches).toBe(true);
  await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},exportPath!);
  await page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true}).click();
  await expect(page.getByText("Doğrulanmamış tahmin kaydedildi.",{exact:true})).toBeVisible();
  let exported=false;try{exported=(await readFile(exportPath!)).byteLength>1000;}catch{exported=false;}expect(exported).toBe(true);
  await app.close();app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});page=await app.firstWindow();await expect.poll(matches).toBe(true);
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});
