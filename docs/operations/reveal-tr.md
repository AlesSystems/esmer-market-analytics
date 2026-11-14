# Eralp ile çevrimdışı inceleme ve kabul kaydı

Bu liste 1.0.1 tahmin sürümü içindir; eski 0.2.0 gösterim akışının yerini alır. Altan kurulumu Eralp ile birlikte yapar. Kurulum, Eralp’in kabulü veya canlı kaynak izni değildir. Kutuları yalnızca oturumdaki gözlemden sonra doldurun.

## Oturumdan önce — Altan

- [ ] [Teslim listesindeki](eralp-offline-delivery.md) EXE dosyaları ve SHA-256 değerleri eşleşiyor.
- [ ] [Kurulum ön kontrolü](install-tr.md) tamamlandı; Windows sürümü/derlemesi, x64 ve ekran ölçeği kaydedildi. Windows 11 dışındaki ortamın ek kontrol sonucu yazıldı.
- [ ] Eralp kuruluma hazır olduğunu belirtti. Varsa önceki analiz verisi yedeklendi; satış sistemi değiştirilmedi.
- [ ] Kurucu çalıştırıldı, uygulama açıldı; Windows uyarısı veya engeli kaydedildi.
- [ ] Aşağıdaki ayrı gösterim alanı açıldı; canlı bağlantı kapalı ve hiçbir bağlantı dosyası yüklenmedi.

Sentetik kayıtları ve deneme giderlerini gerçek çalışma alanına yüklemeyin. Kurulan uygulamayı kapatın. Teslim klasöründe PowerShell açıp aynı doğrulanmış uygulamanın taşınabilir sürümünü ayrı inceleme alanıyla başlatın:

```powershell
$reviewProfile = Join-Path $env:LOCALAPPDATA 'EsmerMarket-OfflineReview-20261114'
& '.\Esmer Market Analytics 1.0.1.exe' "--user-data-dir=$reviewProfile"
```

Normal masaüstü kısayolu farklı çalışma alanını açar. Bu gösterim alanı önceden kullanılmışsa deneme kayıtlarını kontrol edin; mevcut verileri elle silmeyin. Sonraki gerçek kullanımda buradaki giderleri veya yedeği gerçek çalışma alanına taşımayın.

## Birlikte inceleyin

1. **Veriyi tanıyın.** Ayarlar > Veri paketi içe aktar ile **SENTETIK-INCELEME.json** seçin. Örnek Ağustos–Ekim 2025 dönemini kapsar; marketin verisi değildir. Genel mesajdaki “Gerçek kaynak” ifadesi bunu değiştirmez. Dönemi ve veri sonunu gösterin; bugünün verisi gibi sunmayın.
2. **Bu ay.** **Ekim 2025** seçin. Tahmini brüt kârı, maliyeti bilinen kapsamı ve tahmin açıklamasını açın. Eksik/uygunsuz maliyet sıfır sayılmaz; iadeler kârdan dışlanır. Tahmin doğrulanmış kâr değildir.
3. **Ürünler.** Bir ürünü bulun, kartını ve **Kaynak satırlar** bölümünü açın. Satış belgesi, dönem ve tutar bağlantısını gösterin. Bu sentetik örnekte ürün kimlikleri görünmesi beklenir; gerçek ürün adı gibi anlatmayın.
4. **Giderler.** **Şablonu indir**, **Excel’den içe aktar** ve tek gider ekleme akışını gösterin. Ayrı gösterim alanında Ekim için toplam **1.000 ₺** deneme gideri girin. Gerçek gider veya personel kaydı kullanmayın. Deneme tamamlık onayı, gerçek ay için Eralp’in onayı değildir.
5. **Net tahmin.** Giderler tamam değilken net tahminin görünmediğini, deneme ayı tamam işaretlenince göründüğünü gösterin. Temiz sentetik örnekte Ekim tahmini brüt kârı **144.100 ₺**, bu giderden sonra net tahmini **143.100 ₺** olur. Fark varsa dönem ve deneme kayıtlarını kontrol edip kaydedin; geçti saymayın.
6. **Excel.** Üst çubuktaki **Excel’e aktar** ile dosya kaydedin. Excel varsa açıp dönem, tutarlar, yöntem ve dışlamaları ekranla karşılaştırın. Yoksa kaydetmeyi kontrol edin, Excel’de açmayı yapılmadı olarak kaydedin.
7. **Okunabilirlik.** Eralp’in ekran ölçeğinde üç sekmeyi, ay değiştirmeyi ve metin boyutunu deneyin. Kesilen yazı ve anlaşılmayan terimleri not edin. Kuruşa yuvarlama tercihini kaydedin; bu oturum kaynak hassasiyetini veya uygulamanın hesaplamasını değiştirmez.
8. **Yedek.** [Kurtarma yönergesini](recovery-tr.md) okuyun. Ayrı gösterim alanında şifreli yedek alıp “Son doğrulanan yedek” durumunu görün. Yedek ile anahtarı farklı güvenli ortamlarda saklayın. Anahtarı göstermeyin veya kayıt dosyasına eklemeyin. Geri yükleme denemesini yalnızca ayrı, atıl sentetik alanda yapın; gerçek verinin üzerine yüklemeyin.
9. **Yeniden açın.** Uygulamayı kapatıp aynı PowerShell komutuyla açın. Dönem, deneme giderleri ve tamamlık durumu korunuyor mu kontrol edin.

Ayrı temiz bilgisayarda kurtarma ve fiziksel elektrik kesintisi doğrulaması bu oturumun şartı değildir; [#138](https://github.com/AlesSystems/esmer-market-analytics/issues/138) v1 sonrasına ertelenmiştir. Bu oturum onları geçti saymaz.

## Oturum kaydı — henüz doldurulmadı

Bu bölümü oturum için ayrı bir dosyaya kopyalayın. Kimlik bilgisi, gerçek veri satırı, kurtarma anahtarı veya kişisel dosya yolu eklemeyin.

| Alan | Oturumda doldurun |
| --- | --- |
| Tarih ve katılanlar | — |
| Sürüm, kaynak commit, kurucu SHA-256 | Teslim listesinden kopyalayın |
| Windows sürümü/derlemesi, x64, ekran ölçeği | — |
| Veri türü / paket kimliği / dönem / veri sonu | Sentetik örnek; gerçek paket varsa yalnızca onaylı opak kimliği |
| Kurulum ve Windows uyarısı | Geçti / sorun / yapılmadı; kısa not |
| Bu ay / Ürünler / Giderler | Her biri için geçti / sorun / yapılmadı |
| Excel / yeniden açma / yedek | Her biri için geçti / sorun / yapılmadı |
| Yedek ve anahtar saklama sorumlusu | Kişi ve yöntem; anahtar veya gizli yol yazmayın |
| Sonraki offline paketi kim, ne sıklıkta sağlayacak? | Henüz kararlaştırılmadı |
| Tutarların gösterimi tercihi | Mevcut hassasiyet / kuruş tercihi / sonra karar |
| Eralp’in kararı | Kabul / belirtilen düzeltmelerden sonra tekrar inceleme / karar verilmedi |
| Kalan düzeltmeler ve sorumlusu | — |

**Kabulün kapsamı:** çevrimdışı tahmin uygulamasının incelenen iş akışı ve bilinen sınırları. Gerçek gider tamlığı, doğrulanmış finansal sonuç veya üretim erişim izni bu formdan çıkarılamaz. Eralp’in kararını onun adına vermeyin. Gerçek veriye geçiş için uygun paket ve çalışma alanı ayrıca hazırlanır; bu teslim yeni kaynak incelemesi yapmaz.
