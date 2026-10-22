import {describe,expect,test} from "vitest";
import {categoryColors,categoryPalette} from "../../src/ui/ExpenseCharts";
import {reasonColors} from "../../src/ui/purchasing/PurchasingCharts";
import {foldRest,paletteColors} from "../../src/ui/charts";
import {count} from "../../src/ui/format";

describe("stable chart colours",()=>{
 test("shown expense categories get distinct hues chosen by name, never by count",()=>{
  expect(categoryPalette).toHaveLength(5);
  const names=["Personel","Kira","Nakliye","İşçilik","Elektrik"];
  const colors=categoryColors(names);
  expect(new Set(Object.values(colors)).size).toBe(5);
  expect(categoryColors(names.toReversed())).toEqual(colors);
  expect(colors["Elektrik"]).toBe(categoryPalette[0]);
 });
 test("shown exclusion reasons get distinct hues in fixed code order, never by count",()=>{
  const shown=["RETURN_ATTRIBUTION","MISSING_COST","UNDOCUMENTED_ZERO","UNVALIDATED_COST"];
  const colors=reasonColors(shown);
  expect(new Set(Object.values(colors)).size).toBe(shown.length);
  expect(reasonColors(shown.toReversed())).toEqual(colors);
  expect(colors.MISSING_COST).toBe(reasonColors(["MISSING_COST","RETURN_ATTRIBUTION"]).MISSING_COST);
 });
});

describe("shared chart helpers",()=>{
 test("paletteColors follows the given order and wraps the palette",()=>{
  expect(paletteColors(["b","a","c"],["x","y"],(a,b)=>a.localeCompare(b))).toEqual({a:"x",b:"y",c:"x"});
 });
 test("foldRest keeps every entry when it fits and reserves one slot for the rest otherwise",()=>{
  expect(foldRest([1,2,3],3)).toEqual({head:[1,2,3],rest:[]});
  expect(foldRest([1,2,3,4],3)).toEqual({head:[1,2],rest:[3,4]});
 });
 test("count groups whole numbers in Turkish",()=>expect(count(1234567)).toBe("1.234.567"));
});
