# Bilinen sınırlar (v1)

Bu liste uygulamanın bilinen sınırlarını ve açık işlerini tek yerde izler. Bir durumu güncellemek için ilgili satırdaki `Durum` değerini `açık`, `v1 için kabul` veya `düzeltildi` olarak değiştirin.

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
| açık | Windows derlemesi ve duman testi bekliyor | Build and smoke test pending on a real Windows host. | [#109](https://github.com/AlesSystems/esmer-market-analytics/issues/109) |
| açık | Windows CI çalışmıyor | Blocked by GitHub billing before execution. | — |
| açık | Canlı SQL yenilemesi üretimde doğrulanmadı | Month view not verified against production; access needs Eralp's permission. | [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110) |
| açık | Sahip kurulumu yapılmadı | Owner installation not done. | [#110](https://github.com/AlesSystems/esmer-market-analytics/issues/110) |
| açık | Kurtarma ayrı temiz bilgisayarda kabul edilmedi | Recovery not yet accepted on a separate clean machine. | — |
| açık | Elektrik kesintisinde dosya kalıcılığı kanıtlanmadı | Durability of Windows directory changes on power loss is not proven. | — |
