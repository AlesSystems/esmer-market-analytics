# Esmer Market verilerini yedekleyin ve geri yükleyin

Bu işlemler yalnızca Esmer Market analiz uygulamasındaki verileri kapsar. Marketin satış sistemine bağlanmaz veya o sistemi değiştirmez. Günlük kullanım için parola ya da PIN gerekmez.

## Kurtarma için hazırlanın

1. Dişli simgesinden **Ayarlar** menüsünü açın. **Yedekle / Geri yükle** öğesini seçin.
2. Yedekleme kurulumunu başlatın ve yedeklerin saklanacağı klasörü seçin. Bilgisayar kaybolsa veya diski bozulsa da erişebileceğiniz harici bir ortam kullanın.
3. Kurtarma anahtarı dosyasını ayrı bir güvenli ortama kaydedin. Anahtarı yedek dosyalarıyla aynı klasörde saklamayın.
4. Sakladığınız anahtar dosyasını yeniden seçerek doğrulayın. Uygulamadaki saklama açıklamasını okuyup onaylayın.
5. İlk yedeğin doğrulandığını kontrol edin. Başarılı kurulum bildirimi tek başına yedeklerin başka bir bilgisayarda açılabildiğini kanıtlamaz.

Bilgisayarın kendi diskindeki başka bir klasör veya bölüm, bilgisayar kaybına karşı yeterli değildir. Anahtar dosyası ile yedeğin ikisini de kaybederseniz verileri bu yedekten kurtaramazsınız. Anahtar dosyasını gören ve yedeğe erişen biri verileri açabilir. Anahtarı ekran görüntülerine, e-postaya veya destek kayıtlarına eklemeyin.

## Yedeklerin durumunu kontrol edin

Başarılı veri paketi etkinleştirmesinden ve gider, düzeltme, tamamlık onayı veya rapor kaydından sonra uygulama otomatik yedek ister. Devam eden yedek sırasında yeni değişiklikler olursa kalan değişiklikler için yeni bir yedek hazırlanır. Uygulama kapanırsa bekleyen işlem sonraki açılışta yeniden denenir.

**Son doğrulanan yedek** zamanını kontrol edin. Bekleyen veya başarısız durum, son değişikliklerin henüz korunmadığı anlamına gelebilir. Hedef ortamı yeniden bağlayın, yeterli boş alan sağlayın ve **Şimdi yedekle** ile tekrar deneyin. Hata sırasında önceki doğrulanmış yedek korunur.

Uygulama son beş doğrulanmış normal yedeği tutar. Sabitlenen yedekler ve yükseltme öncesi kopyalar bu sayıya ek olarak korunur. Eski normal yedekler ancak yeni bir yedek doğrulandıktan sonra temizlenir. Saklamak istediğiniz bir kaydı sabitleyin. Sabitleme, dosyayı başka bir ortama kopyalamaz.

## Başka bir bilgisayara geri yükleyin

1. Bağımsız olarak sakladığınız yedeği ve kurtarma anahtarı dosyasını hazırlayın.
2. Yeni bilgisayarda uygulamayı açın. **Ayarlar > Yedekle / Geri yükle** öğesini seçin. Önceki bilgisayarın kullanıcı hesabına veya yerel anahtar deposuna gerek yoktur.
3. **Yedekten geri yükle** işlemini başlatın. Şifreli yedek dosyasını ve ardından kurtarma anahtarı dosyasını seçin.
4. Doğrulama tamamlandığında veri kesim tarihini, kayıt ve rapor sayılarını inceleyin.
5. Seçili yedekle mevcut analiz verilerinin değiştirilmesini açıkça onaylayın. Onaydan önce mevcut veriler değişmez. Onaydan sonra açık raporları yeniden açın.
6. Giderleri, düzeltmeleri, tamamlık onaylarını ve kayıtlı raporları kontrol edin. Bir kayıtlı raporu Excel'e aktarın ve yedek öncesindeki değerlerle karşılaştırın.
7. Yeni bilgisayarda yedekleme kurulumunu tamamlayın. Harici hedefe yeni bir yedek oluşturup doğrulandığını kontrol edin.

Geri yükleme birleştirme işlemi değildir. Yedekten sonra girilmiş kayıtlar seçili yedeğin içinde bulunmaz. Uygulama değiştirmeden önce mevcut veriyi kurtarılabilir bir kopyada tutar. Bu kopya aynı bilgisayardadır ve bağımsız yedek yerine geçmez.

## Bir işlem başarısız olursa

Yanlış anahtar, bozuk veya eksik dosya ya da desteklenmeyen veri sürümü mevcut verilerin yerine yüklenmez. Doğru anahtarı ve tam yedek dosyasını yeniden seçin. Disk alanı veya hedef erişimi hatasında ortamı kontrol edip tekrar deneyin.

Geri yükleme sırasında uygulama kapanırsa uygulamayı yeniden açın. Yerel veri dosyalarını veya kurtarma kayıtlarını elle silmeyin. **Çalışan veri doğrulanamadı** uyarısı varsa dosyaları koruyun; sorunu sıradan bir yedekleme hatası gibi tekrar tekrar denemeyin. **Geri yüklenen veriler ve sonuç kaydı kaydedildi** uyarısı varsa uygulamayı yeniden başlatın ve kayıtlı raporları kontrol edin. Sorun devam ederse ekrandaki hata kodunu kaydedin. Anahtarı veya finansal verileri paylaşmayın.

## Kabul sınırı

Bu kılavuz uygulamadaki yedekleme ve kurtarma adımlarını anlatır. [11 Kasım 2026 Windows 11 kaydı](../evidence/2026-11-11-windows-v1-smoke.md), yerel dosya pencereleriyle alınan şifreli yedeğin aynı bilgisayarda boş bir profile geri yüklenmesini doğrular. Giderler, tamamlık onayı ve Excel değerleri korundu. Dosyalar aynı diskteydi. Ayrı temiz Windows bilgisayarında, önceki işletim sistemi anahtar deposu olmadan ve bağımsız ortamda saklanan dosyalarla kurtarma kabulü [#138](https://github.com/AlesSystems/esmer-market-analytics/issues/138) içinde açık kalır.
