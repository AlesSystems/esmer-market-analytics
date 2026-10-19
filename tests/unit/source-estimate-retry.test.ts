// @vitest-environment happy-dom
import { act, createElement as h } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SourceEstimate } from "../../src/ui/SourceEstimate";
import { querySourceEstimate, type EstimateRequest, type EstimateResult } from "../../src/source/estimate";
import { estimateParsed } from "../helpers/estimate-fixture";

let root: Root;
let host: HTMLDivElement;
const request = { hash: "a".repeat(64), period: "2025-10", view: "products", offset: 0, productId: null } as const;
const response = (input: EstimateRequest): EstimateResult => querySourceEstimate(estimateParsed(), input.hash, input);
const read = vi.fn<(input: EstimateRequest) => Promise<EstimateResult>>();
const render = async (period: string = request.period, hash: string = request.hash) => { await act(async () => root.render(h(SourceEstimate, { hash, period, presentation: "products", heading: h("h1", null, "Sentetik tahmin"), onProduct: () => undefined }))); };
const button = (text: string) => Array.from(host.querySelectorAll("button")).find(node => node.textContent === text);
const click = async (text: string) => { const node = button(text); expect(node, text).toBeDefined(); await act(async () => node!.click()); };
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  Object.defineProperty(window, "esmer", { configurable: true, value: { querySourceEstimate: read } });
  read.mockReset();
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });

test("owner retries a transient read failure without changing the report context", async () => {
  read.mockRejectedValueOnce(new Error("temporary")).mockImplementation(async input => response(input));
  await render();
  expect(host.textContent).toContain("Tahmin okunamadı.");
  await click("Tahmini yeniden yükle");
  expect(read).toHaveBeenCalledTimes(2);
  expect(read.mock.calls[1][0]).toEqual(request);
  expect(host.textContent).not.toContain("Tahmin okunamadı.");
  expect(host.textContent).toContain("Doğrulanmamış tahmin");
});

test("retry remains on the failed product page and cannot be duplicated while pending", async () => {
  const first = response(request);
  if (first.status !== "source-estimate") throw new Error("Synthetic fixture must provide estimate");
  read.mockResolvedValueOnce({ ...first, total: 101 }).mockRejectedValueOnce(new Error("temporary"));
  await render(); await click("Sonraki tahmini ürünler");
  let finish!: (value: EstimateResult) => void;
  read.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await click("Tahmini yeniden yükle");
  expect(read.mock.calls[2][0]).toEqual({ ...request, offset: 50 });
  expect(button("Tahmini yeniden yükle")).toBeUndefined();
  expect(host.textContent).toContain("Tahmin yükleniyor…");
  await act(async () => finish({ ...first, offset: 50, total: 101 }));
  expect(host.textContent).toContain("51–100 / 101");
});

test("late retry response cannot replace a newly selected month", async () => {
  read.mockRejectedValueOnce(new Error("temporary")); await render();
  let finish!: (value: EstimateResult) => void;
  read.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await click("Tahmini yeniden yükle");
  read.mockImplementation(async input => response(input));
  await render("2025-11");
  await act(async () => finish(response(request)));
  expect(read.mock.calls.at(-1)![0].period).toBe("2025-11");
  expect(host.textContent).not.toContain("Ürün #3");
  expect(host.textContent).not.toContain("Tahmin okunamadı.");
});

test("retry preserves the exact product search and text", async () => {
  read.mockImplementationOnce(async input => response(input)).mockRejectedValueOnce(new Error("temporary"));
  await render();
  const input = host.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "3");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await click("Tahmini ürünü ara");
  read.mockImplementation(async next => response(next));
  await click("Tahmini yeniden yükle");
  expect(read.mock.calls.at(-1)![0]).toEqual({ ...request, productId: "3" });
  expect(host.querySelector("input")!.value).toBe("3");
});


test("late retry response cannot replace a newly selected source hash", async () => {
  read.mockRejectedValueOnce(new Error("temporary")); await render();
  let finish!: (value: EstimateResult) => void;
  read.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await click("Tahmini yeniden yükle");
  const nextHash = "b".repeat(64);
  read.mockResolvedValueOnce({ status: "source-unavailable", code: "ESTIMATE_UNAVAILABLE", message: "Yeni sentetik kaynak" });
  await render(request.period, nextHash);
  await act(async () => finish(response(request)));
  expect(read.mock.calls.at(-1)![0].hash).toBe(nextHash);
  expect(host.textContent).toContain("Yeni sentetik kaynak");
  expect(host.textContent).not.toContain("Ürün #3");
});
