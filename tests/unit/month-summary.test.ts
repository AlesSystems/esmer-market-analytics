import {expect,test} from "vitest";
import {changeArrow,marginLine,monthChange,monthDative,monthLead,monthLocative,wordMoney,monthName,percentText} from "../../src/ui/pages/month-summary";

test("the lead names the month and the word-money sales; the hero amount follows it",()=>{
 expect(monthLead("2025-10","1970000")).toBe("Ekim'de 1,97 milyon ₺ satış yaptınız. Tahmini brüt kâr");
 expect(monthLead("2025-08","480")).toBe("Ağustos'ta 480 ₺ satış yaptınız. Tahmini brüt kâr");
 expect(monthLead("2025-10",null)).toBe("Ekim ayının satış tutarı bilinmiyor. Tahmini brüt kâr");
});

test("months take their Turkish locative and dative endings",()=>{
 expect(["2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12"].map(monthLocative))
  .toEqual(["Ocak'ta","Şubat'ta","Mart'ta","Nisan'da","Mayıs'ta","Haziran'da","Temmuz'da","Ağustos'ta","Eylül'de","Ekim'de","Kasım'da","Aralık'ta"]);
 expect(["2025-01","2025-04","2025-09","2025-10","2025-11","2025-12"].map(monthDative)).toEqual(["Ocak'a","Nisan'a","Eylül'e","Ekim'e","Kasım'a","Aralık'a"]);
});

test("the per-100 line reads from the margin and names its base when some sales have no cost",()=>{
 expect(marginLine({marginPct:"15.03",unknownCostSales:"0.00"})).toBe("Her 100 ₺'lik satıştan 15 ₺ kâr kaldı.");
 expect(marginLine({marginPct:"13.37",unknownCostSales:"50"})).toBe("Maliyeti bilinen her 100 ₺'lik satıştan 13 ₺ kâr kaldı.");
 expect(marginLine({marginPct:"-10.00",unknownCostSales:"0"})).toBe("Her 100 ₺'lik satışta 10 ₺ zarar.");
 expect(marginLine({marginPct:null,unknownCostSales:"0"})).toBeNull();
});

test("the change against last month reads fewer or more, with the dative month",()=>{
 expect(monthChange("2025-10","10.60")).toBe("Eylül'e göre %10,60 fazla");
 expect(monthChange("2025-10","-4.00")).toBe("Eylül'e göre %4,00 az");
 expect(monthChange("2026-01","0.00")).toBe("Aralık'a göre değişmedi");
 expect(monthChange("2025-10",null)).toBeNull();
});

test("word money and month names",()=>{
 expect(wordMoney("1234567.89")).toBe("1,23 milyon ₺");
 expect(wordMoney("999.999")).toBe("1.000 ₺");
 expect(wordMoney("12500")).toBe("12,5 bin ₺");
 expect(wordMoney("0")).toBe("0 ₺");
 expect(wordMoney("-2500000")).toBe("-2,5 milyon ₺");
 expect(monthName("2026-01")).toBe("Ocak 2026");
});

test("the money unit is chosen after rounding",()=>{
 expect(wordMoney("999960")).toBe("1 milyon ₺");
 expect(wordMoney("-999960")).toBe("-1 milyon ₺");
 expect(wordMoney("296000")).toBe("296 bin ₺");
});

test("a negative percentage puts the sign before the percent mark",()=>{
 expect(percentText("-10.00")).toBe("-%10,00");
 expect(percentText("13.37")).toBe("%13,37");
});

test("the change arrow points up for a rise, down for a fall and is absent for zero or no comparison", () => {
  expect(changeArrow("10.60")).toBe("up");
  expect(changeArrow("-3.20")).toBe("down");
  expect(changeArrow("0")).toBeNull();
  expect(changeArrow("0.00")).toBeNull();
  expect(changeArrow("-0.00")).toBeNull();
  expect(changeArrow(null)).toBeNull();
});
