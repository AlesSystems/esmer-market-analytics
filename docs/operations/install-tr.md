# Esmer Market Analytics: kurulum ve kullanım

Uygulama internet olmadan çalışır. Verileriniz yalnızca bu bilgisayarda durur. Marketin satış sistemini değiştirmez.

14.11.2026 hazırlığı: ilk kurulum ve çevrimdışı inceleme Altan ile birlikte yapılacak. Canlı bağlantı kapalı kalacak. [İnceleme ve karar listesi](reveal-tr.md), [teslim dosyaları ve kimliği](eralp-offline-delivery.md).

## Kurulumdan önce

1. **Windows + R** tuşlarına basıp `winver` yazın. Windows sürümünü ve derlemesini inceleme kaydına yazın. **Ayarlar > Sistem > Hakkında > Sistem türü** altında x64 bilgisayar olduğunu kontrol edin.
2. Yerel kullanım kanıtı **Windows 11 x64** içindir. Windows 10 veya başka bir yapılandırmada Altan, teslim EXE’leri ve hazır sentetik paketle [elle kullanım kontrollerini](windows-v1-handoff.md#smoke-test-manual) tamamlamadan uyumluluğu geçti olarak kaydetmeyin. Eralp’in bilgisayarında derleme veya Node kurulumu gerekmez. ARM/32 bit için bu x64 teslimi doğrulanmış değildir.
3. Dosyanın SHA-256 değerini teslim listesiyle karşılaştırın. Yalnızca “1.0.1” adına güvenmeyin; aynı sürüm adıyla eski dosyalar vardır.
4. Önceden kullanılan bir analiz kurulumu varsa verisini koruyun ve önce yedek alın. Gösterim verilerini onun içine yüklemeyin.

## Kurulum

1. Size verilen **Esmer Market Analytics Setup** dosyasını çift tıklayın.
2. Windows "Bilinmeyen yayıncı" uyarısı gösterebilir; bu teslim imzasızdır. Altan dosyanın kimliğini doğruladıktan sonra, bu seçenekler varsa **Ek bilgi**, ardından **Yine de çalıştır** kullanılabilir. Dosya farklıysa veya güvenlik yazılımı engelliyorsa korumayı kapatmayın; Altan ile kontrol edin. Çıkan uyarıyı kaydedin.
3. Kurulum bitince uygulamayı açın. Üç sekme görürsünüz: **Bu ay**, **Ürünler**, **Giderler**. **Excel’e aktar** üst çubuktadır. Ayarlar dişli simgesinden açılır.

## İlk veri paketini yükleme

Veri paketi aylık bir dosyadır (`.json`). İlk incelemedeki **SENTETIK-INCELEME.json** marketin gerçek verisi değildir. Yalnızca [inceleme listesindeki](reveal-tr.md) ayrı gösterim alanında açın. Gerçek kullanım için yetkilendirilmiş paket, dönemi ve veri sonu ayrıca belirlenmelidir.

1. Dişli simgesinden **Ayarlar** menüsünü açın.
2. **Veri paketi içe aktar** deyin ve dosyayı seçin.
3. "Gerçek kaynak kayıtları içe aktarıldı." yazısını bekleyin. Bu genel mesaj sentetik paket için de görünür; verinin gerçek olduğunu kanıtlamaz. **Bu ay** sayfasında paketin dönemine ait rakamlar görünür.

## Her ay yenileme

- **Paketle:** Yeni dosyayı kimin, hangi sıklıkta hazırlayacağını Altan ile kararlaştırın. Aynı yoldan içe aktarın. Yeni paket eskisinin yerini alır. Giderleriniz, ayarlarınız ve kayıtlı raporlarınız silinmez.
- **Canlı bağlantı:** İlk incelemede kapalı bırakın; bağlantı dosyası yüklemeyin. Gerçek kaynağa ve tarihsel maliyet sütununa erişim için ayrı izin ve doğrulama gerekir. Çevrimdışı incelemenin kabulü bu izin değildir.
- Eski türde (analiz) paketler artık kabul edilmez: "Bu paket türü artık desteklenmiyor. Son geçerli veriler korundu." Altan'dan yeni aylık paket isteyin.

Rakamlar kayıtlı satıştan yapılan bir **tahmindir**; kesinleşmiş kâr değildir.

## Giderleri girme ve "tamam"

1. **Giderler** sayfasını açın.
2. **Şablonu indir** ile Excel dosyasını kaydedin, ayın giderlerini doldurun. Personel için yalnızca aylık toplamı yazın.
3. **Excel’den içe aktar** ile dosyayı yükleyin. Tek bir gideri **Elle ekle** ile de girebilirsiniz.
4. Bütün giderler tamamsa **Bu ayın giderleri tamam** deyin.

Net kâr, giderleri "tamam" yapana kadar **Bu ay** sayfasında görünmez. Bunu yapmadan net kâra bakmayın. Gider eklerseniz "tamam" işaretini yeniden verin.

## Excel’e aktarma

Üst çubuktaki **Excel’e aktar** düğmesine basın. Dosyanın nereye kaydedileceğini seçin. Dosyayı Excel'de açabilirsiniz.

## Yedekleme ve geri yükleme

Ayarlar menüsündeki **Yedekle / Geri yükle** öğesinden yedekleme kurun. Yedekler başka bir diske ya da USB belleğe gitmelidir. Kurtarma anahtarı dosyasını yedekten **ayrı** bir yerde saklayın. İkisini de kaybederseniz verilerinizi geri getiremezsiniz. Adım adım anlatım: [Yedekleme ve geri yükleme](recovery-tr.md).

## Kaldırma ve güncelleme

Güncellemeden veya kaldırmadan önce bir yedek alın. Uygulamayı kaldırmak veri klasörünü silmeyebilir; yine de yedeksiz kaldırmayın. Veri klasörünü elle silmeyin.

## Bilinen sınırlar

Uygulamanın neleri yapmadığı **Ayarlar > Hakkında** içinde de listelenir. Tam liste: [Bilinen sınırlar](known-limitations-tr.md). Kısaca: sayılar tahmindir, eksik maliyetli ürünler kâra katılmaz ve uygulama vergi, bordro veya satış programı değildir.
