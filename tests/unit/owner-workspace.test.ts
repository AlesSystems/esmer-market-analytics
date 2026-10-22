// @vitest-environment happy-dom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { AppShell } from "../../src/ui/AppShell";

test("keyboard skip action moves focus directly into the owner workspace", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement("div"); document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(h(AppShell, { destination: "monthly", navigate: () => undefined, children: h("h1", null, "Sentetik çalışma alanı") })));
  const skip = host.querySelector<HTMLButtonElement>(".skip-workspace")!;
  expect(skip.textContent).toBe("İçeriğe geç");
  await act(async () => skip.click());
  expect(document.activeElement).toBe(host.querySelector(".app-body"));
  expect(host.querySelector('[aria-current="page"]')?.textContent).toBe("Özet");
  await act(async () => root.unmount()); host.remove();
});

const luminance = (hex: string) => {
  const rgb = hex.match(/\w\w/g)!.map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
const contrast = (a: string, b: string) => { const values = [luminance(a), luminance(b)].sort((x,y) => y-x); return (values[0] + .05) / (values[1] + .05); };
test("new owner palette keeps normal text contrast at least 4.5:1", () => {
  const css = readFileSync("src/ui/owner-workspace.css", "utf8");
  const token = (name: string) => css.match(new RegExp(`--market-${name}: (#\\w+);`))![1];
  for (const [foreground, background] of [["ink","paper"],["muted","paper"],["muted","surface"],["surface","action"],["paper","ink"]]) expect(contrast(token(foreground), token(background)), `${foreground}/${background}`).toBeGreaterThanOrEqual(4.5);
  expect(contrast("#694b17", "#fff0d6")).toBeGreaterThanOrEqual(4.5);
});
