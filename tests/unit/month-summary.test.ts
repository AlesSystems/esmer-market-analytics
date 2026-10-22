import {expect,test} from "vitest";
import {monthSummary,wordMoney,monthName} from "../../src/ui/pages/month-summary";

const totals={sales:"1970000",grossProfit:"296000.4",marginPct:"15.03"};

test("the summary sentence reads sales, gross profit and the per-100 figure in plain Turkish",()=>{
 expect(monthSummary("2025-10",totals)).toBe("Ekim'de 1,97 milyon ₺ satış yaptınız; tahmini brüt kâr 296 bin ₺ — her 100 ₺'lik satıştan 15 ₺.");
 expect(monthSummary("2025-08",{sales:"480",grossProfit:"57.5",marginPct:"13.37"})).toBe("Ağustos'ta 480 ₺ satış yaptınız; tahmini brüt kâr 57,5 ₺ — her 100 ₺'lik satıştan 13 ₺.");
});

test("with unknown-cost sales the per-100 figure names its base: known-cost sales",()=>{
 expect(monthSummary("2025-10",{sales:"480",grossProfit:"57.5",marginPct:"13.37",unknownCostSales:"50"})).toBe("Ekim'de 480 ₺ satış yaptınız; tahmini brüt kâr 57,5 ₺ — maliyeti bilinen her 100 ₺'lik satıştan 13 ₺.");
 expect(monthSummary("2025-10",{sales:"480",grossProfit:"57.5",marginPct:"13.37",unknownCostSales:"0.00"})).toBe("Ekim'de 480 ₺ satış yaptınız; tahmini brüt kâr 57,5 ₺ — her 100 ₺'lik satıştan 13 ₺.");
 expect(monthSummary("2025-09",{sales:"40",grossProfit:"-4",marginPct:"-10.00",unknownCostSales:"5"})).toBe("Eylül'de 40 ₺ satış yaptınız; tahmini brüt zarar 4 ₺ — maliyeti bilinen her 100 ₺'lik satışta 10 ₺ zarar.");
});

test("a loss reads as a loss, never as a negative gain",()=>{
 expect(monthSummary("2025-09",{sales:"40",grossProfit:"-4",marginPct:"-10.00"})).toBe("Eylül'de 40 ₺ satış yaptınız; tahmini brüt zarar 4 ₺ — her 100 ₺'lik satışta 10 ₺ zarar.");
});

test("unknown values drop out of the sentence instead of printing null or zero",()=>{
 expect(monthSummary("2025-10",{sales:"480",grossProfit:null,marginPct:null})).toBe("Ekim'de 480 ₺ satış yaptınız; maliyetler bilinmediği için brüt kâr hesaplanamadı.");
 expect(monthSummary("2025-10",{sales:null,grossProfit:null,marginPct:null})).toBe("Ekim ayının satış tutarı bilinmiyor.");
 expect(monthSummary("2025-10",{sales:"480",grossProfit:"57.5",marginPct:null})).toBe("Ekim'de 480 ₺ satış yaptınız; tahmini brüt kâr 57,5 ₺.");
});

test("word money and month names",()=>{
 expect(wordMoney("1234567.89")).toBe("1,23 milyon ₺");
 expect(wordMoney("999.999")).toBe("1.000 ₺");
 expect(wordMoney("12500")).toBe("12,5 bin ₺");
 expect(wordMoney("0")).toBe("0 ₺");
 expect(wordMoney("-2500000")).toBe("-2,5 milyon ₺");
 expect(monthName("2026-01")).toBe("Ocak 2026");
});
