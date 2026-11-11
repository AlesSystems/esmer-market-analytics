# Bilinen sınırlar (v1)

Bu liste uygulamanın bilinen sınırlarını ve açık işlerini tek yerde izler. Bir durumu güncellemek için ilgili satırdaki `Durum` değerini `açık`, `v1 için kabul` veya `düzeltildi` olarak değiştirin.

11.11.2026 durumu: uygulama sürümü 1.0.1. `main` dalındaki `7f5020c` Windows CI kontrolünden geçti. Geliştirme bilgisayarında Windows 11 kurulum, yerel dosya pencereleri, Excel, gerçek %125 ve %150 ölçekleme, yeniden açma ve kaldırma [kayıt altına alındı](../evidence/2026-11-11-windows-v1-smoke.md). Bu kontroller Eralp'in kabulü veya onun bilgisayarına kurulum değildir. Sahip ve üretim izinleri [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110), bağımsız kurtarma ve kalıcılık [#138](https://github.com/AlesSystems/esmer-market-analytics/issues/138) içinde açık kalır.

| Durum | Sınır | Not | Konu |
| --- | --- | --- | --- |
| v1 için kabul | Tahmin doğrulanmış kâr değildir | Estimate from recorded source; not verified profit. See decision record. | [#98](https://github.com/AlesSystems/esmer-market-analytics/issues/98) |
| v1 için kabul | Eksik maliyet kâra dahil edilmez | Missing cost is excluded from gross profit and never treated as zero. | — |
| v1 için kabul | İadeler kâra dahil değildir | Returns are not in profit; shown separately, so the estimate can look high. | — |
| v1 için kabul | Kısmi son ay tutarla karşılaştırılmaz | Partial last month is not compared in amounts. | — |
| v1 için kabul | Tarihsel maliyet son alış fiyatıdır | Last purchase price, not weighted average stock cost. | — |
| v1 için kabul | Net kâr için ay giderleri tamamlanmalı | Net profit shows only after the owner marks the month's expenses complete. | [#106](https://github.com/AlesSystems/esmer-market-analytics/issues/106) |
| v1 için kabul | Paket sınırı 100.000 satır / 32 MiB | Package caps; about three September-sized months fit. | — |
| v1 için kabul | Kaynak satırlar yalnızca Satış belgeleri | Only Satış documents; document totals include KDV. | [#104](https://github.com/AlesSystems/esmer-market-analytics/issues/104) |
| v1 için kabul | Vergi, bordro, müşteri analizi, satış sistemi değil | Not a tax, payroll, customer-analysis or POS system. | — |
| v1 için kabul | Kurucu imzasız | Unsigned installer shows a Windows publisher warning. | [#109](https://github.com/AlesSystems/esmer-market-analytics/issues/109) |
| düzeltildi | Windows 11 kullanım kontrolü geçti | Agent-operated native walkthrough passed with synthetic data, including real Excel and 125%/150% Windows scaling. Owner acceptance remains separate. | [Windows kullanım kaydı](../evidence/2026-11-11-windows-v1-smoke.md) |
| düzeltildi | Windows CI derlemesi ve otomatik testler geçti | Main 7f5020c passed CI on 10.11.2026. Local Windows 11 validation passed 185 unit, 302 integration and 68 packaged desktop tests on 11.11.2026. | [Windows kaydı](../evidence/2026-11-11-windows-v1-smoke.md) |
| açık | Canlı SQL yenilemesi üretimde doğrulanmadı | Month view not verified against production; access needs Eralp's permission. | [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110) |
| açık | Canlı bağlantı maliyet sütununu okur; Eralp onayı bekliyor | Live refresh reads the historical-cost column; production use needs Eralp's approval. | [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110) |
| düzeltildi | Gerçek yedekten ilk paket yapıldı | First package (Sep–Oct 2025) made from the restored backup on 2026-10-25; app figures matched independent SQL totals. | — |
| açık | Tutarlar kaynak hassasiyetiyle gösteriliyor | Real amounts show up to 8+ decimals (e.g. 1.234,56789012 ₺); display rounding to kuruş needs an owner decision. | — |
| açık | Sahip kurulumu yapılmadı | Owner installation not done. | [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110) |
| açık | Kurtarma ayrı temiz bilgisayarda kabul edilmedi | Native-dialog restore into a fresh Windows 11 profile preserved expenses and exports. A separate-machine exercise remains post-v1. | [#138](https://github.com/AlesSystems/esmer-market-analytics/issues/138) |
| açık | Elektrik kesintisinde dosya kalıcılığı kanıtlanmadı | Durability of Windows directory changes on power loss is not proven. | [#138](https://github.com/AlesSystems/esmer-market-analytics/issues/138) |
