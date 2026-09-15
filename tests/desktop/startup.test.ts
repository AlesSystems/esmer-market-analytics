import { test, expect, _electron as electron } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === 'darwin'
  ? resolve(`release/mac${process.arch === 'arm64' ? '-arm64' : ''}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`)
  : process.platform === 'win32' ? resolve('release/win-unpacked/Esmer Market Analytics.exe') : resolve('release/linux-unpacked/esmer-market-analytics'));

test('empty packaged app starts offline without login or renderer privileges', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'esmer-desktop-'));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await expect(page.getByRole('heading', { name: 'Henüz veri içe aktarılmadı' })).toBeVisible();
    await expect(page.getByText('Canlı bağlantı kapalı')).toBeVisible();
    await expect(page.locator('input[type=password]')).toHaveCount(0);
    expect(await page.evaluate(() => ({ api: Object.keys(window.esmer), node: typeof window.require, process: typeof window.process }))).toEqual({ api: ['getAvailability'], node: 'undefined', process: 'undefined' });
    expect(await page.evaluate(() => window.esmer.getAvailability())).toEqual({ status: 'ready', store: 'empty', liveConnection: 'disabled' });
    expect(await app.evaluate(({ app }) => app.isPackaged)).toBe(true);
    await page.screenshot({ path: 'test-results/offline-startup.png' });
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});
