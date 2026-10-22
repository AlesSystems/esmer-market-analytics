# Aylık veri paketi hazırlama

Bu rehber geliştirici içindir. Her ay yedekten, sahibinin içe aktaracağı tahmin paketini hazırlar. Paket seçilen ayı ve en çok 5 önceki ayı kapsar. Ürün adları, reyonlar ve birimler pakete dahildir.

`BELGE_TARIHINDEKI_SON_ALIS_FIYATI` sütununu bu komutla okumak için sahibinin açık onayı gerekir. Onay gizlilik ve tahmin sözleşmelerine yazılmadan komutu gerçek yedekte çalıştırmayın.

Kapsam ve sınır kararı: [aylık paket kararı](../decisions/issue-101-monthly-window.md). Ölçümler: [aylık veri yolu kanıtı](../evidence/2026-10-22-monthly-data-path.md).

## Her ay

1. Son `.bak` yedeğini yalıtılmış bir SQL Server'a geri yükleyin. Canlı market sunucusunu kullanmayın.
2. Yalnızca okuma yetkili hesabı kullanın. Hesap yalnızca şu sütunları okuyabilmelidir:
   - `FIS`: [önizleme izin listesindeki](../contracts/privacy.md#isolated-backup-record-preview-allowlist) sütunlar.
   - `FIS_DETAY`: önizleme sütunları ve `BELGE_TARIHINDEKI_SON_ALIS_FIYATI`.
   - `DOVIZ_AD`: `ID`, `AD`.
   - `STOK`: `ID`, `AD`, `STOK_GRUP`, `STOK_BIRIM`.
   - `STOK_GRUP` ve `STOK_BIRIM`: `ID`, `AD`.

   Müşteri, tedarikçi (`STOK.CARI` dahil) ve personel sütunlarına izin vermeyin. `sa`, `dbo` veya yazma yetkili hesap reddedilir.
3. Bağlantı dosyasını depo dışında tutun. `scope` değeri `isolated-copy` olmalıdır. `expectedDatabaseId` geri yüklenen veritabanının GUID'idir. `from` ve `to` okunabilecek en geniş tarih aralığıdır. Bunu bir kez geniş yazın, örneğin bütün yıl: `"from": "2025-01-01"`, `"to": "2025-12-31"`. Komut bu aralığın dışına çıkmaz; seçilen aylar aralığın içinde kalmalıdır. macOS'te dosya izni `0600` olmalıdır.
4. Depo klasöründe komutu çalıştırın:

   ```sh
   npm run prepare:month -- /gizli/baglanti.json 2025-09
   ```

   İsterseniz ay sayısını (1–6) ve çıktı yolunu da verin:

   ```sh
   npm run prepare:month -- /gizli/baglanti.json 2025-09 3 /gizli/esmer-eylul.json
   ```

   Çıktı yolu verilmezse dosya bağlantı dosyasının yanına `esmer-2025-09.json` adıyla yazılır. Aynı adlı dosya varsa komut kaynağı okumadan durur.
5. Başarılı çıktıyı okuyun. Örnek: `MONTHLY_ESTIMATE_PREPARED 2025-07-01..2025-09-30 months=3/6`. Burada 6 ay istendi, 3 ay sığdı. Okuma veya yazma sırasında paket 100.000 satır ya da 32 MiB sınırını aşarsa en eski ay çıkarılır.
6. Paketi sahibine verin. Sahibi uygulamada **Ayarlar → Veri paketi içe aktar** ile dosyayı seçer. Yeni paket eskisinin yerini alır. Giderler, ayarlar, rapor geçmişi ve kabul edilmiş raporlar korunur.
7. Paketi ve bağlantı dosyasını Git'e, kanıt klasörüne veya ekran görüntüsüne koymayın. Geri yüklenen kopyayı işiniz bitince kapatın.

## Hata olursa

- `SOURCE_REJECTED`: hesap fazla yetkili, bir sütun eksik, okuma izni yok veya tek ay bile 100.000 satır ya da 32 MiB sınırını aşıyor. Ürün sütunu adları gerçek şemada doğrulanmamıştır. Eksikse paket yazılmaz.
- `SOURCE_CHANGED`: `expectedDatabaseId` geri yüklenen veritabanıyla eşleşmiyor.
- `SOURCE_UNAVAILABLE` veya `SOURCE_TIMEOUT`: sunucuya ulaşılamadı veya okuma 60 saniyeyi aştı.
- `OUTPUT_EXISTS`: çıktı dosyası zaten var. Başka bir ad seçin.
- `INVALID_CONFIG_FILE`: bağlantı dosyası okunamıyor, geçerli JSON değil, alanları hatalı, çok büyük veya izinleri `0600` değil.
- `WINDOW_OUTSIDE_CONFIG`: seçilen aylar bağlantı dosyasındaki `from`–`to` aralığının dışında. Aralığı genişletin veya daha az ay seçin.
- `INVALID_PACKAGE`: okunan kayıtlar paket kurallarına uymuyor. Paket yazılmaz.

Ham önizleme paketi için [SQL önizleme rehberi](prepare-sql-preview.md) geçerlidir.
