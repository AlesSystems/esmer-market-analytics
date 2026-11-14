import { test, expect } from '@playwright/test';

test('a selected month presents its own literal result and period in every direction', async ({ page }) => {
  await page.goto('/');
  for (const direction of ['A · Çalışma alanı', 'B · Ayın hesabı', 'C · Odaklı görünüm']) {
    await page.getByRole('button', { name: direction, exact: true }).click();
    await page.getByLabel('Görüntülenen ay').selectOption('2025-09');
    await expect(page.getByRole('heading', { name: 'Eylül 2025', exact: true })).toBeVisible();
    await expect(page.getByTestId('gross-result')).toHaveText('284.620,00 ₺');
    await page.getByLabel('Görüntülenen ay').selectOption('2025-06');
    await expect(page.getByRole('heading', { name: 'Haziran 2025', exact: true })).toBeVisible();
    await expect(page.getByTestId('gross-result')).toHaveText('−14.000,00 ₺');
    await expect(page.getByText('284.620,00 ₺', { exact: true })).toHaveCount(0);
  }
});
