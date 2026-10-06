import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";
import { executablePath } from "../helpers/desktop-executable";
test("one working month survives every business page and application restart", async () => {
 const userData = await mkdtemp(join(tmpdir(), "esmer-business-navigation-"));
 const store = openStore(join(userData,"analytics.sqlite"));
 try { store.importPackage(businessPackage(undefined,{cutoff:"2025-10-31",coverage:{from:"2025-09-01",to:"2025-10-31",complete:true}})); } finally {store.close();}
 let app = await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {
  let page = await app.firstWindow();
  await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-09");
  await page.getByLabel("Dönem",{exact:true}).fill("2025-11");
  for(const name of ["Satışlar","Alışlar ve maliyet","Giderler","Raporlar","Özet"]) {
   await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name,exact:true}).click();
   await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-11");
  }
  await app.close(); app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]}); page=await app.firstWindow();
  await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-11");
  await page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Giderler",exact:true}).click();
  await expect(page.getByRole("button",{name:"Gider ekle",exact:true})).toHaveCount(1);
  await expect(page.getByRole("button",{name:"Excel’den aktar",exact:true})).toHaveCount(1);
 } finally {await app.close();await rm(userData,{recursive:true,force:true});}
});

test("overview opens the report as a destination without inline duplication", async () => {
 const userData=await mkdtemp(join(tmpdir(),"esmer-clean-overview-"));
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage());}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{const page=await app.firstWindow();await expect(page.getByRole("heading",{name:"Ay bir bakışta",exact:true})).toBeVisible();await expect(page.getByRole("heading",{name:"Aylık Ürün Kârlılığı",exact:true})).toHaveCount(0);await page.getByRole("button",{name:/Ayın raporunu aç/}).click();await expect(page.getByRole("button",{name:"Raporlar",exact:true})).toHaveAttribute("aria-current","page");}finally{await app.close();await rm(userData,{recursive:true,force:true});}
});
