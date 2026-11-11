# Esmer Market Analytics: kurulum ve kullanım

Uygulama internet olmadan çalışır. Verileriniz yalnızca bu bilgisayarda durur. Marketin satış sistemini değiştirmez.

## Kurulum

1. Size verilen **Esmer Market Analytics Setup** dosyasını çift tıklayın.
2. Windows "Bilinmeyen yayıncı" uyarısı gösterebilir. Uygulama bu ilk sürümde dijital olarak imzalı değildir. Dosyayı size Altan verdiyse **Ek bilgi**, ardından **Yine de çalıştır** deyin. Emin değilseniz durun ve sorun.
3. Kurulum bitince uygulamayı açın. Üç sekme görürsünüz: **Bu ay**, **Ürünler**, **Giderler**. **Excel’e aktar** üst çubuktadır. Ayarlar dişli simgesinden açılır.

## İlk veri paketini yükleme

Veri paketi, size hazırlanan aylık bir dosyadır (`.json`). Altan her ay hazırlar.

1. Dişli simgesinden **Ayarlar** menüsünü açın.
2. **Veri paketi içe aktar** deyin ve dosyayı seçin.
3. "Gerçek kaynak kayıtları içe aktarıldı." yazısını bekleyin. **Bu ay** sayfasında rakamlar görünür.

## Her ay yenileme

- **Paketle:** Altan yeni ayın dosyasını verir. Aynı yoldan içe aktarın. Yeni paket eskisinin yerini alır. Giderleriniz, ayarlarınız ve kayıtlı raporlarınız silinmez.
- **Canlı bağlantı ile:** Ayarlar menüsündeki **Canlı bağlantı** öğesinde **Şimdi yenile** uygulamanın kaynağı yalnızca okuyarak o ayın tahminini yeniden hazırlamasını sağlar. Bağlantıyı kapatmak veya değiştirmek için **Bağlantı ayarı** bölümünü açın. Bu seçenek kapalı gelir ve kurulumu için Altan'ın yardımı gerekir. Canlı bağlantı yalnızca denemede kullanılır; onayınızdan önce gerçek kaynakta kullanılmaz. Canlı okuma maliyet sütununu da okur.
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
