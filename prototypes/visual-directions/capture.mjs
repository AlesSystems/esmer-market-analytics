import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const server = spawn(process.execPath, [join(root, 'serve.mjs'), '--port', '4180'], { stdio: 'pipe' });
let browser;
try {
  await new Promise((resolve, reject) => {
    server.stdout.once('data', resolve);
    server.once('error', reject);
    server.once('exit', code => reject(new Error(`Preview host exited: ${code}`)));
  });
  await mkdir(join(root, 'screenshots'), { recursive: true });
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4180');
  await page.evaluate(() => document.fonts.ready);
  for (const [key, title] of [['a', 'A · Çalışma alanı'], ['b', 'B · Ayın hesabı'], ['c', 'C · Odaklı görünüm']]) {
    await page.getByRole('button', { name: title, exact: true }).click();
    await page.screenshot({ path: join(root, 'screenshots', `${key}-1440.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 680, height: 800 });
  await page.getByRole('button', { name: 'A · Çalışma alanı', exact: true }).click();
  await page.getByRole('button', { name: 'Görünüm ve araçlar' }).click();
  await page.getByRole('button', { name: 'Büyük yazı kullan' }).click();
  await page.keyboard.press('Escape');
  await page.screenshot({ path: join(root, 'screenshots', 'a-680-large.png'), fullPage: true });
  await page.getByRole('button', { name: 'Nasıl hesaplandı?' }).click();
  await page.screenshot({ path: join(root, 'screenshots', 'explanation-680-large.png'), fullPage: true });
  process.stdout.write('Saved synthetic prototype screenshots in prototypes/visual-directions/screenshots/\n');
} finally {
  await browser?.close();
  server.kill();
}
