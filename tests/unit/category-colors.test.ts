import {describe,expect,test} from "vitest";
import {categoryColor,categoryPalette} from "../../src/ui/ExpenseCharts";
import {reasonColor,reasonColors} from "../../src/ui/purchasing/PurchasingCharts";
import {purchasingWarningLabels} from "../../src/ui/purchasing/PurchasingWorkspace";

describe("stable chart colours",()=>{
 test("an expense category keeps one colour from the five-hue palette whatever its rank",()=>{
  expect(categoryPalette).toEqual(["var(--viz-sales)","var(--viz-contribution)","var(--viz-accent-3)","var(--exp-violet)","var(--exp-gold)"]);
  const names=["Kira","Elektrik","Su","Personel","Bakım","Nakliye","Eski kayıt","Vergi","Sigorta"];
  const first=names.map(categoryColor);
  expect(names.toReversed().map(categoryColor).toReversed()).toEqual(first);
  for(const color of first)expect(categoryPalette).toContain(color);
  expect(new Set(first).size).toBeGreaterThanOrEqual(3);
  expect(categoryColor("Kira")).toBe(categoryColor("Kira"));
 });
 test("a purchasing exclusion reason is coloured by its fixed position among the reason codes",()=>{
  const codes=Object.keys(purchasingWarningLabels);
  for(const [index,code] of codes.entries())expect(reasonColor(code,purchasingWarningLabels)).toBe(reasonColors[index%reasonColors.length]);
  expect(reasonColor("MISSING_COST",purchasingWarningLabels)).toBe(reasonColor("MISSING_COST",purchasingWarningLabels));
  expect(reasonColor("UNKNOWN_CODE",{...purchasingWarningLabels,UNKNOWN_CODE:"x"})).toBe(reasonColors[codes.length%reasonColors.length]);
 });
});
