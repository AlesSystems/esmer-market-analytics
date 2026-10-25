import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,rm,writeFile,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {readSheet} from "read-excel-file/node";
import {executablePath} from "../helpers/desktop-executable";
import {openWorkspace,importPackage,openSection} from "../helpers/desktop-navigation";
import {monthProfitPackage} from "../helpers/month-profit-fixture";

test("Rapor ve Excel exports the month to Excel and opens a source document and returns focus to its row",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"reports-page-")),file=join(userData,"month.json"),output=join(userData,"out.xlsx");await writeFile(file,monthProfitPackage());
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);
  await openSection(page,"Rapor ve Excel");
  await expect(page.getByRole("button",{name:"Excel’e aktar",exact:true})).toBeDisabled();
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);
  await importPackage(page);
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
