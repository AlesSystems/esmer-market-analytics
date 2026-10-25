# Esmer Market Analytics: kurulum ve kullanım

Uygulama internet olmadan çalışır. Verileriniz yalnızca bu bilgisayarda durur. Marketin satış sistemini değiştirmez.

## Kurulum

1. Size verilen **Esmer Market Analytics Setup** dosyasını çift tıklayın.
2. Windows "Bilinmeyen yayıncı" uyarısı gösterebilir. Uygulama bu ilk sürümde dijital olarak imzalı değildir. Dosyayı size Altan verdiyse **Ek bilgi**, ardından **Yine de çalıştır** deyin. Emin değilseniz durun ve sorun.
3. Kurulum bitince uygulamayı açın. Dört bölüm görürsünüz: **Bu ay**, **Ürünler**, **Giderler**, **Rapor ve Excel**. Ayarlar ayrı bir yerdedir.

## İlk veri paketini yükleme

Veri paketi, size hazırlanan aylık bir dosyadır (`.json`). Altan her ay hazırlar.

1. **Ayarlar** bölümünü açın, **Veri paketi** kutusuna girin.
2. **Veri paketi içe aktar** deyin ve dosyayı seçin.
3. "Veri paketi içe aktarıldı." yazısını bekleyin. **Bu ay** sayfasında rakamlar görünür.

## Her ay yenileme

- **Paketle:** Altan yeni ayın dosyasını verir. Aynı yoldan içe aktarın. Yeni paket eskisinin yerini alır. Giderleriniz, ayarlarınız ve kayıtlı raporlarınız silinmez.
- **Canlı bağlantı ile:** Ayarlar içindeki **Canlı bağlantı** kutusunda **Şimdi yenile** uygulamanın kaynağı yalnızca okuyarak o ayın tahminini yeniden hazırlamasını sağlar. Bağlantıyı kapatmak veya değiştirmek için aynı kutudaki **Bağlantı ayarı** bölümünü açın. Bu seçenek kapalı gelir ve kurulumu için Altan'ın yardımı gerekir. Canlı okuma maliyet sütununu da okur; üretimde kullanımı için Eralp'in onayı beklenir.
- Eski türde (analiz) paketler artık kabul edilmez: "Bu paket türü artık desteklenmiyor." Son geçerli verileriniz korunur. Altan'dan yeni aylık paket isteyin.

Rakamlar kayıtlı satıştan yapılan bir **tahmindir**; kesinleşmiş kâr değildir.

## Giderleri girme ve "tamam"

1. **Giderler** sayfasını açın.
2. **Şablonu indir** ile Excel dosyasını kaydedin, ayın giderlerini doldurun. Personel için yalnızca aylık toplamı yazın.
3. **Excel'den içe aktar** ile dosyayı yükleyin. Tek bir gideri **Elle ekle** ile de girebilirsiniz.
4. Bütün giderler tamamsa **Bu ayın giderleri tamam** deyin.

Net kâr, giderleri "tamam" yapana kadar **Bu ay** sayfasında görünmez. Bunu yapmadan net kâra bakmayın. Gider eklerseniz "tamam" işaretini yeniden verin.

## Excel'e aktarma

**Rapor ve Excel** sayfasında **Excel'e aktar** deyin, dosyanın nereye kaydedileceğini seçin. Dosyayı Excel'de açabilirsiniz.

## Yedekleme ve geri yükleme

Ayarlar içindeki **Yedekleme ve kurtarma** kutusundan yedekleme kurun. Yedekler başka bir diske ya da USB belleğe gitmelidir. Kurtarma anahtarı dosyasını yedekten **ayrı** bir yerde saklayın. İkisini de kaybederseniz verilerinizi geri getiremezsiniz. Adım adım anlatım: [Yedekleme ve geri yükleme](recovery-tr.md).

## Kaldırma ve güncelleme

Güncellemeden veya kaldırmadan önce bir yedek alın. Uygulamayı kaldırmak veri klasörünü silmeyebilir; yine de yedeksiz kaldırmayın. Veri klasörünü elle silmeyin.

## Bilinen sınırlar

Uygulamanın neleri yapmadığı **Ayarlar > Hakkında** içinde de listelenir. Tam liste: [Bilinen sınırlar](known-limitations-tr.md). Kısaca: sayılar tahmindir, eksik maliyetli ürünler kâra katılmaz ve uygulama vergi, bordro veya satış programı değildir.
