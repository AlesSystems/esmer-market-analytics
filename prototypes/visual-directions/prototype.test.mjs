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

test('zero, unavailable and partial months retain their distinct meanings', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Görüntülenen ay').selectOption('2025-07');
  await expect(page.getByTestId('gross-result')).toHaveText('0,00 ₺');
  await page.getByLabel('Görüntülenen ay').selectOption('2025-05');
  await expect(page.getByTestId('gross-result')).toHaveText('Hesaplanamıyor');
  await page.getByRole('button', { name: 'Nasıl hesaplandı?' }).click();
  await expect(page.getByRole('dialog')).toContainText('Bilinmeyen maliyet sıfır sayılmadığı');
  await page.keyboard.press('Escape');
  await page.getByLabel('Görüntülenen ay').selectOption('2025-10');
  await expect(page.getByText('1–18 Ekim 2025 · Kısmi ay', { exact: true })).toBeVisible();
  await expect(page.getByText('Ayın yalnızca 18 günü var. Önceki ayla tutar karşılaştırması yapılmıyor.', { exact: true })).toBeVisible();
  await expect(page.getByText('Tam ay verisi gerekiyor', { exact: true })).toBeVisible();
  await page.getByLabel('Görüntülenen ay').selectOption('2025-04');
  await expect(page.getByRole('heading', { name: 'Bu ayın verisi yok' })).toBeVisible();
  await expect(page.getByTestId('gross-result')).toHaveCount(0);
  await page.getByRole('button', { name: 'Son veri olan aya git' }).click();
  await expect(page.getByRole('heading', { name: 'Ekim 2025', exact: true })).toBeVisible();
});

test('product investigation preserves the month, search and focus when detail closes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ürünler', exact: true }).click();
  await page.getByLabel('Ürün adı veya numarası ara').fill('4158');
  const product = page.getByRole('button', { name: 'Bulaşık deterjanı 750 ml', exact: true });
  await product.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toContainText('Ürün #4158 · Eylül 2025');
  await expect(page.getByRole('dialog')).toContainText('Bilinmeyen miktar veya maliyet sıfır değildir.');
  await page.keyboard.press('Escape');
  await expect(product).toBeFocused();
  await expect(page.getByLabel('Ürün adı veya numarası ara')).toHaveValue('4158');
  await expect(page.getByLabel('Görüntülenen ay')).toHaveValue('2025-09');
  await page.getByLabel('Ürün adı veya numarası ara').fill('olmayan ürün');
  await expect(page.getByText('Bu aramada ürün bulunamadı. Aramayı temizleyerek örnekleri yeniden görebilirsiniz.')).toBeVisible();
});

test('expense actions are honest previews and never imply a saved record or net result', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Giderler', exact: true }).click();
  await expect(page.getByText('Giderler tamamlanmalı', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Excel’den gider ekle', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Gerçek dosya seçilmez veya kaydedilmez.');
  await page.getByRole('button', { name: 'Görünüme dön', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Excel’den gider ekle', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Giderleri incele', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('herhangi bir onay kaydetmez');
  await page.keyboard.press('Escape');
  await expect(page.getByText('Giderler tamamlanmalı', { exact: true })).toBeVisible();
});

test('every direction remains operable with narrow windows, larger text and keyboard dialogs', async ({ page }) => {
  await page.setViewportSize({ width: 680, height: 800 });
  await page.goto('/');
  await expect(page.getByText('Sentetik veriler', { exact: true })).toBeVisible();
  for (const direction of ['A · Çalışma alanı', 'B · Ayın hesabı', 'C · Odaklı görünüm']) {
    await page.getByRole('button', { name: direction, exact: true }).click();
    await page.getByRole('button', { name: 'Görünüm ve araçlar' }).click();
    const sizeButton = page.getByRole('button', { name: /Büyük yazı kullan|Normal yazıya dön/ });
    if ((await sizeButton.textContent()) === 'Büyük yazı kullan') {
      const normalTitle = await page.getByRole('dialog').getByRole('heading').boundingBox();
      await sizeButton.click();
      const largerTitle = await page.getByRole('dialog').getByRole('heading').boundingBox();
      expect(largerTitle.height, 'the reading preference must enlarge dialog text too').toBeGreaterThan(normalTitle.height);
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Görünüm ve araçlar' })).toBeFocused();
    await page.getByRole('button', { name: 'Nasıl hesaplandı?' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Nasıl hesaplandı?' })).toBeFocused();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, 'the page itself must not overflow; financial tables may scroll within their region').toBe(false);
  }
});

test('visible actions retain the existing forty-pixel minimum hit area', async ({ page }) => {
  await page.goto('/');
  for (const width of [1440, 680]) {
    await page.setViewportSize({ width, height: 900 });
    for (const direction of ['A · Çalışma alanı', 'B · Ayın hesabı', 'C · Odaklı görünüm']) {
      await page.getByRole('button', { name: direction, exact: true }).click();
      const buttons = await page.getByRole('button').all();
      for (const button of buttons) {
        const box = await button.boundingBox();
        const label = `${direction}, ${width}px: ${await button.innerText() || await button.getAttribute('aria-label')}`;
        expect(box.height, label).toBeGreaterThanOrEqual(40);
        expect(box.width, label).toBeGreaterThanOrEqual(40);
      }
    }
  }
});
