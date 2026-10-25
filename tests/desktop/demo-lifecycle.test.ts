import { openWorkspace, openSection } from "../helpers/desktop-navigation";
import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {openStore} from "../../src/store/store";
import {businessPackage} from "../helpers/business-fixtures";
import {estimatePackage} from "../helpers/estimate-fixture";
import {executablePath} from "../helpers/desktop-executable";



for(const failure of [false,true])test(`pending initial source ${failure?"failure":"success"} never reveals retained financial metadata`,async()=>{
 const userData=await mkdtemp(join(tmpdir(),"esmer-demo-pending-")),store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage());store.importSourcePreview(estimatePackage());}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});try{const page=await app.firstWindow();await openWorkspace(page);await expect(page.getByRole("region",{name:"Ayın rakamları"})).toBeVisible();
  await app.evaluate(({ipcMain},failed)=>{const registry=ipcMain as unknown as {_invokeHandlers:Map<string,(event:unknown,operation:string,payload:unknown)=>unknown>},original=registry._invokeHandlers.get("esmer:request")!;ipcMain.removeHandler("esmer:request");ipcMain.handle("esmer:request",async(event,operation,payload)=>{const result=await original(event,operation,payload);return operation==="querySourceWorkspace"?new Promise(resolve=>Reflect.set(globalThis,"releaseInitialSource",()=>resolve(failed?{status:"source-unavailable",code:"SERVICE_UNAVAILABLE",message:"Sentetik kaynak hatası"}:result))):result;});},failure);
  await page.reload();await openWorkspace(page);
  // While the source is still being resolved, no retained financial metadata leaks into the workspace or Ayarlar.
  await expect(page.getByText("Veri kesim tarihi:",{exact:false})).toHaveCount(0);await expect(page.getByText("Sentetik gösterim verisi — gerçek market verisi değildir.",{exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Ayarlar",exact:true}).click();await expect(page.getByRole("status").getByText("Kaynak durumu kontrol ediliyor…",{exact:true})).toBeVisible();await expect(page.getByText("Etkin analiz paketi",{exact:true})).toHaveCount(0);await expect(page.getByRole("button",{name:"Veri paketi içe aktar",exact:true})).toBeEnabled();await expect(page.getByRole("button",{name:"Yedekleme ve kurtarma",exact:true})).toBeEnabled();
  await app.evaluate(()=>Reflect.get(globalThis,"releaseInitialSource")?.());if(failure)await expect(page.getByRole("alert").getByText("Sentetik kaynak hatası",{exact:true})).toBeVisible();else await expect(page.getByText("Etkin kaynak yedeği",{exact:true})).toBeVisible();await expect(page.getByText("Etkin analiz paketi",{exact:true})).toHaveCount(0);await page.getByRole("button",{name:"Ayarları kapat",exact:true}).click();
  // Rapor ve Excel reads the source itself: a failure is an alert, never the retained financial report; success opens the source estimate.
  await openSection(page,"Rapor ve Excel");const outcome=failure?page.locator(".reports-page").getByRole("alert").getByText("Sentetik kaynak hatası",{exact:true}):page.getByRole("region",{name:"Kaynak tahmini"});
  await expect(async()=>{await app.evaluate(()=>Reflect.get(globalThis,"releaseInitialSource")?.());await expect(outcome).toBeVisible({timeout:500});}).toPass({timeout:10000});
  await expect(page.getByText("Veri kesim tarihi:",{exact:false})).toHaveCount(0);await expect(page.getByRole("heading",{name:"Seçili rapor",exact:true})).toHaveCount(0);
 }finally{await app.evaluate(()=>Reflect.get(globalThis,"releaseInitialSource")?.()).catch(()=>{});await app.close();await rm(userData,{recursive:true,force:true});}
});
