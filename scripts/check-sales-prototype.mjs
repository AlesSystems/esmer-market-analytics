// Small throwaway journey check. Run the preview first; no production acceptance implied.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
export async function checkSalesWireframe(p) {
  await p.getByRole('button', { name: 'Satış özeti', exact: true }).click();
  await p.getByRole('combobox', { name: 'Örnek durum', exact: true }).selectOption('normal');
  const heights = await p.locator('.bar').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().height));
  assert.ok(Math.abs(heights[0] / heights[2] - 70 / 165) < 0.01, '70:165 bar proportion');
  assert.ok(Math.abs(heights[1] / heights[2] - 130 / 165) < 0.01, '130:165 bar proportion');
  await p.getByRole('button', { name: 'İçecekler', exact: true }).click();
  await p.getByRole('button', { name: 'İçme suyu · 1,5 L', exact: true }).click();
  assert.match(await p.getByRole('table').innerText({}), /60,00/);
  await p.getByRole('button', { name: 'DEMO-S002', exact: true }).click();
  let panel = await p.getByRole('complementary').innerText({});
  assert.match(panel, /130,00/); // Full document.
  assert.match(panel, /60,00/); // Selected product contribution.
  await p.getByRole('article').filter({ hasText: 'İçme suyu · 1,5 L' }).getByRole('button', { name: 'Kaynak detayını göster' }).click();
  panel = await p.getByRole('complementary').innerText({});
  assert.match(panel, /DEMO-S002 \/ L003/);
  assert.match(panel, /DEMO-DATA-1 \/ DEMO-v1/);
  await p.getByRole('button', { name: 'Sonraki taslak', exact: true }).click();
  assert.match(await p.getByRole('complementary').innerText({}), /DEMO-S002 \/ L003/);
  await p.getByRole('button', { name: 'İşleme dön', exact: true }).click();
  await p.getByRole('button', { name: 'Kapat', exact: true }).click();
  await p.getByRole('button', { name: 'İçecekler', exact: true }).click();
  await p.getByRole('button', { name: 'Maden suyu · 200 ml', exact: true }).click();
  await p.getByRole('combobox', { name: 'İşlem türü', exact: true }).selectOption('return');
  assert.match(await p.getByRole('table').innerText({}), /−35,00/);
  assert.doesNotMatch(await p.getByRole('table').innerText({}), /DEMO-S002/);
  await p.getByRole('combobox', { name: 'Örnek durum', exact: true }).selectOption('discrepancy');
  await p.getByRole('button', { name: 'Farkı incele', exact: true }).click();
  assert.match(await p.getByRole('complementary').innerText({}), /Uzlaşma eksik/);
  await p.getByRole('combobox', { name: 'Örnek durum', exact: true }).selectOption('normal');
  await p.getByRole('button', { name: 'Satış özeti', exact: true }).click();
  return 'PASS: chart proportions, drill-down, selected/full totals, evidence, variant state, returns and discrepancy';
}
if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4175/?variant=A');
    console.log(await checkSalesWireframe(page));
  } finally { await browser.close(); }
}
