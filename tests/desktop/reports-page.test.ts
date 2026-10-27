import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,rm,writeFile,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {readSheet} from "read-excel-file/node";
import {executablePath} from "../helpers/desktop-executable";
import {openWorkspace,importPackage,openSection} from "../helpers/desktop-navigation";
import {monthProfitPackage,monthProfitSnapshot} from "../helpers/month-profit-fixture";
import {writeRawEstimatePackage} from "../../src/source/raw-package";
import type {SqlSnapshot} from "../../src/source/sql-server";
import type {ElectronApplication,Page} from "@playwright/test";

/** 60 sale documents on 2025-10 (ids 1001-1060) and one in 2025-08; September has none. */
function sixtyDocuments(){
 const base=monthProfitSnapshot(),h=base.headers[0],l=base.lines[0];
 const headers:SqlSnapshot["headers"]=[],lines:SqlSnapshot["lines"]=[];
 const add=(id:string,date:string)=>{headers.push({...h,ID:id,FIS_TURU:"11",FIS_TARIHI:`${date}T12:00:00.000`});lines.push({...l,ID:`${id}1`,FIS:id,STOK:"1",FIS_TURU:"11",MIKTAR_FIS:"1",TOPLAM_KDV_MATRAHI:"10",BELGE_TARIHINDEKI_SON_ALIS_FIYATI:"7"});};
 add("301","2025-08-15");
 for(let i=1;i<=60;i++)add(String(1000+i),`2025-10-${String(1+i%20).padStart(2,"0")}`);
 return writeRawEstimatePackage({...base,headers,lines,products:base.products!.filter(p=>p.ID==="1")} as SqlSnapshot,"fixture:sixty","sixty-1");
}
/** Replaces the esmer:request handler: `intercept` may answer querySourceWorkspace; otherwise the real one runs. */
async function intercept(app:ElectronApplication,body:string){
 await app.evaluate(({ipcMain},code)=>{
  const listeners=ipcMain as typeof ipcMain&{_invokeHandlers:Map<string,(...args:unknown[])=>unknown>};
  const handler=listeners._invokeHandlers.get("esmer:request")!;
  const calls={n:0};
  const decide=new Function("calls","operation","return ("+code+")(calls,operation)") as (c:{n:number},o:unknown)=>unknown;
  ipcMain.removeHandler("esmer:request");
  ipcMain.handle("esmer:request",(...args)=>{
   if(args[1]==="querySourceWorkspace"){calls.n++;const answer=decide(calls,args[1]);if(answer)return answer;}
   return handler(...args);
  });
 },body);
}
const importFile=async(app:ElectronApplication,page:Page,file:string)=>{
 await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);
 await importPackage(page);
 await expect(page.getByRole("heading",{name:"Ayarlar",exact:true,level:1})).toBeHidden(); // a slow import closes Ayarlar and returns to Bu ay
};

test("Rapor ve Excel exports the month to Excel and opens a source document and returns focus to its row",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"reports-page-")),file=join(userData,"month.json"),output=join(userData,"out.xlsx");await writeFile(file,monthProfitPackage());
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);
  await openSection(page,"Rapor ve Excel");
  await expect(page.getByRole("button",{name:"Excel’e aktar",exact:true})).toBeDisabled();
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);
  await importPackage(page);
  await expect(page.getByRole("heading",{name:"Ayarlar",exact:true,level:1})).toBeHidden();
  await openSection(page,"Rapor ve Excel");
  await expect(page.getByRole("heading",{name:"Rapor ve Excel",level:1})).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(0);
  const exportButton=page.getByRole("button",{name:"Excel’e aktar",exact:true});await expect(exportButton).toBeEnabled();
  await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},output);
  await exportButton.click();
  await expect(page.getByText("Doğrulanmamış tahmin Excel dosyasına kaydedildi.",{exact:true})).toBeVisible();
  const rows=await readSheet(await readFile(output),"Özet");
  expect(rows.find(r=>r[0]==="Satış")?.[1]).toBe("480");
  await page.getByRole("button",{name:"Kaynak belgeleri aç",exact:true}).click();
  const row=page.getByRole("button",{name:/^Belgeyi aç /}).first();await expect(row).toBeVisible();
  await row.click();
  await expect(page.getByRole("region",{name:"Kaynak belge ayrıntıları"})).toBeVisible();
  await page.getByRole("button",{name:"Belgelere dön",exact:true}).click();
  await expect(row).toBeFocused();
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("Kaynak belgeler pages, returns to the opened row, reloads on SOURCE_CHANGED, retries failures and names empty months",async()=>{
 test.setTimeout(120_000);
 const userData=await mkdtemp(join(tmpdir(),"reports-docs-")),file=join(userData,"sixty.json");await writeFile(file,sixtyDocuments());
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);
  await importFile(app,page,file);
  await openSection(page,"Rapor ve Excel");
  await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-10");
  const docs=page.getByRole("region",{name:"Kaynak belgeler"});
  await page.getByRole("button",{name:"Kaynak belgeleri aç",exact:true}).click();
  await expect(docs.getByRole("status").filter({hasText:"1–50 / 60"})).toBeVisible();
  await expect(docs.getByRole("button",{name:/^Belgeyi aç /})).toHaveCount(50);
  await expect(docs.getByRole("button",{name:"Önceki belgeler",exact:true})).toBeDisabled();
  await docs.getByRole("button",{name:"Sonraki belgeler",exact:true}).click();
  await expect(docs.getByRole("status").filter({hasText:"51–60 / 60"})).toBeVisible();
  await expect(docs.getByRole("button",{name:/^Belgeyi aç /})).toHaveCount(10);
  await expect(docs.getByRole("button",{name:"Sonraki belgeler",exact:true})).toBeDisabled();
  await expect(docs.getByRole("button",{name:"Önceki belgeler",exact:true})).toBeFocused();
  const row=docs.getByRole("button",{name:/^Belgeyi aç /}).first();
  await row.click();
  await expect(docs.getByRole("button",{name:"Belgelere dön",exact:true})).toBeVisible();
  await docs.getByRole("button",{name:"Belgelere dön",exact:true}).click();
  await expect(row).toBeFocused();
  await expect(docs.getByRole("status").filter({hasText:"51–60 / 60"})).toBeVisible();
  // SOURCE_CHANGED once on the paged read: the list reloads from the first page.
  await docs.getByRole("button",{name:"Rapora dön",exact:true}).click();
  await intercept(app,`(calls)=>calls.n===2?{status:"source-unavailable",code:"SOURCE_CHANGED",message:"Kaynak sürümü değişti. Yeni sürümü açın."}:null`);
  await page.getByRole("button",{name:"Kaynak belgeleri aç",exact:true}).click();
  await expect(docs.getByRole("status").filter({hasText:"1–50 / 60"})).toBeVisible();
  await expect(docs.getByRole("alert")).toHaveCount(0);
  // A failing read shows an alert; Yeniden dene recovers.
  await docs.getByRole("button",{name:"Rapora dön",exact:true}).click();
  await intercept(app,`(calls)=>calls.n===1?{status:"source-unavailable",code:"NOT_FOUND",message:"Sentetik okuma hatası"}:null`);
  await page.getByRole("button",{name:"Kaynak belgeleri aç",exact:true}).click();
  await expect(docs.getByRole("alert")).toContainText("Sentetik okuma hatası");
  await docs.getByRole("button",{name:"Yeniden dene",exact:true}).click();
  await expect(docs.getByRole("status").filter({hasText:"1–50 / 60"})).toBeVisible();
  await expect(docs.getByRole("alert")).toHaveCount(0);
  // A month without documents.
  await docs.getByRole("button",{name:"Rapora dön",exact:true}).click();
  await page.getByLabel("Dönem",{exact:true}).fill("2025-09");
  await page.getByRole("button",{name:"Kaynak belgeleri aç",exact:true}).click();
  await expect(docs.getByText("Bu ay için kaynak belge yok.",{exact:true})).toBeVisible();
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("Rapor ve Excel without a package says a data package is needed",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"reports-empty-"));
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);
  await openSection(page,"Rapor ve Excel");
  await expect(page.getByRole("heading",{name:"Kâr tahmini için veri paketi gerekiyor",exact:true})).toBeVisible();
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});
