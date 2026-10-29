import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,mkdir,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {openStore} from "../../src/store/store";
import {writeRawEstimatePackage} from "../../src/source/raw-package";
import {richEstimateSnapshot} from "../helpers/rich-estimate-fixture";
import {executablePath} from "../helpers/desktop-executable";
import {setMonth} from "../helpers/desktop-navigation";

// Synthetic names and categories for the rich fixture so the capture reads like a market.
const names=["Süt 1 L","Beyaz peynir","Ekmek","Çay 1 kg","Toz şeker","Ayçiçek yağı","Yumurta 10'lu","Makarna","Pirinç","Domates salçası","Zeytin","Tereyağı","Yoğurt","Ayran","Su 1,5 L","Kola 1 L","Bisküvi","Çikolata","Deterjan","Bulaşık sıvısı","Tuvalet kâğıdı","Kahve","Un","Mercimek","Nohut","Bulgur","Sucuk","Kaşar","Limon","Patates","Soğan","Elma","Muz","Portakal","Sabun","Şampuan","Diş macunu","Peçete","Çöp torbası","Kibrit","Tuz","Sirke","Ketçap","Mayonez","Bal","Reçel","Helva","Lokum"];
const categories=["Süt ürünleri","Fırın","Kuru gıda","İçecek","Temizlik","Manav","Atıştırmalık"];
const output=process.env.ESMER_CAPTURE_BU_AY;
test("capture Bu ay evidence",async()=>{
 test.skip(!output,"set ESMER_CAPTURE_BU_AY=1 to write docs/evidence/images/v1-bu-ay");
 test.setTimeout(120_000);
 const directory=resolve("docs/evidence/images/v1-bu-ay");await mkdir(directory,{recursive:true});
 const userData=await mkdtemp(join(tmpdir(),"bu-ay-capture-")),empty=await mkdtemp(join(tmpdir(),"bu-ay-empty-"));
 const s=richEstimateSnapshot();
 const snapshot={...s,products:names.map((NAME,i)=>({ID:String(1000+i),NAME,CATEGORY:categories[i%categories.length],UNIT:"adet"}))};
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importSourcePreview(writeRawEstimatePackage(snapshot as typeof s,"fixture:capture","capture-1"));}finally{store.close();}
 for(const [profile,shots] of [[userData,[["2025-10","bu-ay"],["2025-09","bu-ay-net-eksik"]]],[empty,[[null,"veri-paketi-yok"]]]] as const){
  const app=await electron.launch({executablePath,args:[`--user-data-dir=${profile}`]});
  try{
   const page=await app.firstWindow();await expect(page.getByRole("navigation",{name:"Ana gezinme"})).toBeVisible();
   for(const size of [{width:1440,height:900},{width:1100,height:560}]){
    await app.evaluate(({BrowserWindow},v)=>BrowserWindow.getAllWindows()[0].setContentSize(v.width,v.height),size);
    for(const [month,name] of shots){
     if(month)await setMonth(page,month);
     await expect(page.getByRole("heading",{level:1}).first()).toBeVisible();await page.locator(".app-body").focus();await page.waitForTimeout(700);
     await page.screenshot({path:join(directory,`${name}-${size.width}.png`)});
    }
   }
  }finally{await app.close();}
 }
 await rm(userData,{recursive:true,force:true});await rm(empty,{recursive:true,force:true});
});
