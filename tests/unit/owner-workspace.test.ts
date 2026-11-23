// @vitest-environment happy-dom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { AppShell, WorkspaceHeader } from "../../src/ui/AppShell";

test("the rail holds the store identity, navigation and settings; page controls and the skip action remain usable", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement("div"); document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(h(AppShell, { section: "products", navigate: () => undefined, controls: h("span", { id: "controls" }, "kontroller"), menu: h("span", { id: "menu" }, "menü"), children: h(WorkspaceHeader, { title: "Sentetik çalışma alanı" }) })));
  const skip = host.querySelector<HTMLButtonElement>(".skip-workspace")!;
  expect(skip.textContent).toBe("İçeriğe geç");
  await act(async () => skip.click());
  expect(document.activeElement).toBe(host.querySelector(".app-body"));
  const bar = host.querySelector("header.topbar")!;
  const logo = bar.querySelector(".workspace-brand img");
  expect(logo?.getAttribute("alt")).toBe("Esmer Market");
  expect(logo?.getAttribute("src")).toBe("/assets/esmer-market-logo.png");
  const nav = bar.querySelector('nav[aria-label="Ana gezinme"]')!;
  expect([...nav.querySelectorAll("button")].map(button => button.textContent)).toEqual(["Bu ay", "Ürünler", "Giderler"]);
  expect([...nav.querySelectorAll("[aria-current]")].map(button => button.textContent)).toEqual(["Ürünler"]);
  expect(host.querySelector(".workspace-head h1")?.textContent).toBe("Sentetik çalışma alanı");
  expect(host.querySelector(".workspace-head #controls")?.textContent).toBe("kontroller");
  expect(bar.querySelector("#menu")?.textContent).toBe("menü");
  await act(async () => root.unmount()); host.remove();
});

const luminance = (hex: string) => {
  const rgb = hex.match(/\w\w/g)!.map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
const contrast = (a: string, b: string) => { const values = [luminance(a), luminance(b)].sort((x,y) => y-x); return (values[0] + .05) / (values[1] + .05); };
const css = readFileSync("src/ui/theme.css", "utf8");
const token = (name: string) => css.match(new RegExp(`--${name}: (#[0-9a-fA-F]{6});`))![1];

test("theme tokens carry the logo-inspired leaf green palette", () => {
  expect(Object.fromEntries(["page", "card", "line", "field", "ink", "ink-2", "soft", "hover", "accent", "accent-h", "accent-50", "accent-100", "bar", "gain", "loss", "warn", "warn-bg"].map(name => [name, token(name)])))
    .toEqual({ page: "#f4f5f8", card: "#ffffff", line: "#e0e2e9", field: "#8792a2", ink: "#252b39", "ink-2": "#626b7b", soft: "#f0f1f5", hover: "#f2f7e9", accent: "#4b7111", "accent-h": "#3b5b0c", "accent-50": "#eaf4d7", "accent-100": "#dcebbd", bar: "#749a28", gain: "#0f7b51", loss: "#bf2f2a", warn: "#965a00", "warn-bg": "#fff4e2" });
});

test("every text and control pairing of the theme keeps contrast at least 4.5:1", () => {
  const pairs: [string, string][] = [["ink", "page"], ["ink", "card"], ["ink", "accent-50"], ["ink-2", "page"], ["ink-2", "card"], ["ink-2", "soft"], ["ink-2", "hover"], ["card", "accent"], ["accent", "card"], ["accent", "page"], ["accent", "accent-50"], ["accent-h", "accent-50"], ["gain", "card"], ["loss", "card"], ["loss", "loss-bg"], ["warn", "card"], ["warn", "warn-bg"]];
  for (const [foreground, background] of pairs) expect(contrast(token(foreground), token(background)), `${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
  expect(contrast(token("bar"), token("card")), "chart bars on card").toBeGreaterThanOrEqual(3);
  expect(contrast(token("field"), token("card")), "field border on card").toBeGreaterThanOrEqual(3);
});

const sources = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sources(join(dir, entry.name)) : /\.(css|tsx?)$/.test(entry.name) ? [join(dir, entry.name)] : []);

test("the market-ledger, shadcn alias, chart and Glazed Tile token sets are gone", () => {
  const dead = /--market-|--viz-|--glaze|--grout|--cobalt|--turquoise|--coral|--saffron|--ink-soft|--muted-surface|--primary-foreground|Manrope|Newsreader/i;
  expect(sources("src/ui").filter(file => dead.test(readFileSync(file, "utf8")))).toEqual([]);
});
