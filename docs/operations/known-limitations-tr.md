# Bilinen sınırlar (v1)

Bu liste uygulamanın bilinen sınırlarını ve açık işlerini tek yerde izler. Bir durumu güncellemek için ilgili satırdaki `Durum` değerini `açık`, `v1 için kabul` veya `düzeltildi` olarak değiştirin.

27.10.2026 durumu: uygulama sürümü 1.0.1. `main` dalındaki `6c11ed4` için [Windows CI başarılı](../evidence/2026-10-27-windows-ci.md). Otomatik testler, elle yapılacak Windows ve sahip kabulünün yerine geçmez. #109 ve #110 kapalı olsa da aşağıdaki açık kontrollerin kabul kaydı henüz yoktur.

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
| açık | Windows elle kullanım kabulü bekliyor | CI build and packaged tests passed. Manual install, Turkish UI and Excel, native 125% and 150% scaling, and uninstall on Windows 10 or 11 remain unrecorded. | [Windows kabul adımları](windows-v1-handoff.md) |
| düzeltildi | Windows CI derlemesi ve otomatik testler geçti | Main 6c11ed4, app 1.0.1, 27.10.2026. Installer and portable inspected; 48 desktop tests passed. | [CI kaydı](../evidence/2026-10-27-windows-ci.md) |
| açık | Canlı SQL yenilemesi üretimde doğrulanmadı | Month view not verified against production; access needs Eralp's permission. | [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110) |
| açık | Canlı bağlantı maliyet sütununu okur; Eralp onayı bekliyor | Live refresh reads the historical-cost column; production use needs Eralp's approval. | [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110) |
| düzeltildi | Gerçek yedekten ilk paket yapıldı | First package (Sep–Oct 2025) made from the restored backup on 2026-10-25; app figures matched independent SQL totals. | — |
| açık | Tutarlar kaynak hassasiyetiyle gösteriliyor | Real amounts show up to 8+ decimals (e.g. 1.234,56789012 ₺); display rounding to kuruş needs an owner decision. | — |
| açık | Sahip kurulumu yapılmadı | Owner installation not done. | [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110) |
| açık | Kurtarma ayrı temiz bilgisayarda kabul edilmedi | Windows CI restored an encrypted backup into a fresh profile on the same runner. A separate-machine exercise remains post-v1. | [CI kaydı](../evidence/2026-10-27-windows-ci.md) |
| açık | Elektrik kesintisinde dosya kalıcılığı kanıtlanmadı | Durability of Windows directory changes on power loss is not proven. | — |
