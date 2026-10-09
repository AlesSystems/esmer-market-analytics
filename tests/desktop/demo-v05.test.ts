import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {openStore} from "../../src/store/store";
import {businessPackage} from "../helpers/business-fixtures";
import {estimatePackage,estimateSnapshot} from "../helpers/estimate-fixture";
const executablePath=process.env.ESMER_EXECUTABLE??resolve("release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics");
for(const empty of [false,true])test(`demo prioritizes ${empty?"empty":"estimated"} imported source across one workspace`,async()=>{
 const userData=await mkdtemp(join(tmpdir(),"esmer-demo-")),store=openStore(join(userData,"analytics.sqlite"));
 try{store.importPackage(businessPackage());const snapshot=estimateSnapshot();if(empty){snapshot.headers=[];snapshot.lines=[];}store.importSourcePreview(estimatePackage(snapshot));}finally{store.close();}
 const initialMonth=empty?"2025-09":"2025-10";
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{const page=await app.firstWindow();await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue(initialMonth);await page.getByLabel("Dönem",{exact:true}).fill("2025-09");await page.getByRole("button",{name:"Ayarlar",exact:true}).click();await expect(page.getByRole("button",{name:"Korunan mali veri görünümü",exact:true})).toHaveCount(0);await page.getByRole("button",{name:"Ayarları kapat",exact:true}).click();
  await expect(page.getByRole("region",{name:"Kaynak tahmini"})).toContainText("Doğrulanmamış tahmin");await expect(page.getByRole("table",{name:"Ürün tahminleri",exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Satışlar",exact:true}).click();await expect(page.getByRole("table",{name:"Ürün tahminleri",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Raporlar",exact:true}).click();await expect(page.getByRole("button",{name:"Tahmini Excel olarak kaydet",exact:true})).toBeVisible();await page.getByRole("button",{name:"Önceki kaydedilmiş raporlar",exact:true}).click();await expect(page.getByRole("region",{name:"Kaynak tahmini"})).toBeHidden();await page.getByRole("button",{name:"Güncel rapora dön",exact:true}).click();await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-09");
  for(const name of ["Alışlar ve maliyet","Giderler","Özet"]){await page.getByRole("button",{name,exact:true}).click();await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-09");}
 }finally{await app.close();await rm(userData,{recursive:true,force:true});}
});
