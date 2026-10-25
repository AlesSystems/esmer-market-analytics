import { openSection, openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";
import { executablePath } from "../helpers/desktop-executable";

test("Bu ay opens the report as a destination without inline duplication", async () => {
 const userData=await mkdtemp(join(tmpdir(),"esmer-clean-overview-"));
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importPackage(businessPackage());}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{const page=await app.firstWindow();await openWorkspace(page);await expect(page.getByRole("heading",{name:"Bu ay",level:1})).toBeVisible();await expect(page.getByRole("heading",{name:"Aylık Ürün Kârlılığı",exact:true})).toHaveCount(0);await page.getByRole("button",{name:"Aylık raporlara git",exact:true}).click();await expect(page.getByRole("navigation",{name:"Ana gezinme"}).getByRole("button",{name:"Rapor ve Excel",exact:true})).toHaveAttribute("aria-current","page");await expect(page.getByRole("navigation",{name:"Rapor bölümleri"}).getByRole("button",{name:"Aylık rapor",exact:true})).toHaveAttribute("aria-pressed","true");await expect(page.getByRole("heading",{name:"Aylık Ürün Kârlılığı",exact:true})).toBeVisible();}finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

test("expense figure excludes owner contributions and uses the existing classified summary", async () => {
 const {Expenses}=await import("../../src/expenses/import"),{workbook,row}=await import("../helpers/expense-fixtures");
 const userData=await mkdtemp(join(tmpdir(),"esmer-overview-expense-")),store=openStore(join(userData,"analytics.sqlite"));
 try {
  store.importPackage(businessPackage());const expenses=new Expenses(store),operating=[...row];operating[1]="15.09.2025";operating[2]=null;
  const owner=[...operating];owner[0]="owner-1";owner[3]="Sentetik sahip katkısı";owner[4]="owner-contribution";owner[5]="500";owner[7]="500";
  const preview=expenses.preview(await workbook([operating,owner]));expect(preview.errors).toEqual([]);expenses.confirm({previewId:preview.previewId,keepCandidateRows:[]});
 } finally {store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try {const page=await app.firstWindow();await openWorkspace(page);await expect(page.getByRole("textbox",{name:"Dönem",exact:true})).toHaveValue("2025-09");await openSection(page,"Giderler");const figure=page.getByRole("region",{name:"Gider göstergeleri",exact:true}).getByRole("article").filter({has:page.getByRole("heading",{name:"Kayıtlı giderler",exact:true})});await expect(figure.locator("strong")).toHaveText("50,00 ₺");await expect(page.getByRole("table")).toContainText("Sentetik sahip katkısı");}finally{await app.close();await rm(userData,{recursive:true,force:true});}
});

