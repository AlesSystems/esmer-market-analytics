import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {openStore} from "../../src/store/store";
import {writeRawPackage} from "../../src/source/raw-package";
import {rawSnapshot} from "../helpers/raw-fixture";
import {monthLabel, openSettingsItem, openWorkspace } from "../helpers/desktop-navigation";

const executablePath=process.env.ESMER_EXECUTABLE??(process.platform==="darwin"?resolve(`release/mac${process.arch==="arm64"?"-arm64":""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`):process.platform==="win32"?resolve("release/win-unpacked/Esmer Market Analytics.exe"):resolve("release/linux-unpacked/esmer-market-analytics"));

test("packaged stale status acknowledges retained raw-only source records",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"live-tracking-stale-")),database=join(userData,"analytics.sqlite");
 const seed=openStore(database),first=seed.importSourcePreview(writeRawPackage(rawSnapshot(),"fixture:tracking","capture-1"));seed.close();
 if(first.status!=="preview-imported")throw Error("fixture");
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);
  await expect(monthLabel(page)).toHaveAttribute("data-month","2025-10");
  const configFile=join(userData,"synthetic-source.json");
  await writeFile(configFile,JSON.stringify({server:"localhost",port:1,database:"synthetic",user:"reader",password:"SYNTHETIC",scope:"isolated-copy",lineage:"fixture:tracking",expectedDatabaseId:rawSnapshot().databaseId,from:"2025-10-01",to:"2025-10-12"}));
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},configFile);
  await openSettingsItem(page,/^Canlı bağlantı/);
  await page.getByRole("button",{name:"SQL kaynağını içe aktar",exact:true}).click();
  await expect(page.getByText("Kaynağa ulaşılamadı.",{exact:true})).toBeVisible({timeout:15000});
  await expect(page.getByText("Son geçerli yerel veriler kullanılıyor.",{exact:true})).toBeVisible();
  await expect(page.getByRole("region",{name:"Canlı bağlantı",exact:true}).getByText("01.10.2025",{exact:true})).toBeVisible();
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});
