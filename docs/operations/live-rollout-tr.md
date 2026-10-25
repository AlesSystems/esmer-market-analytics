# İzole SQL bağlantısını deneme ve kapatma

Bu sürüm yalnızca izole test bağlantısını dener. Başarılı SQL okuması kaynak kayıtlarını yerel önizlemeye yazar. Mali rapor oluşturmaz. Satış ekranı bu kayıtlar için doğrulanmış satış verisinin hazır olmadığını söyler. Daha önce yüklenmiş mali raporlar durur. #14, #26 ve L01 tamamlanmış değildir.

## Hazırlık

1. Yetkili yedeğin ayrı, atılabilir bir kopyasını kullanın. Üretime bağlanmayın. Orijinal yedeği veya durdurulmuş kaynak konteynerini değiştirmeyin.
2. Test yöneticisi yalnızca kopyada, [okuma sözleşmesindeki](../contracts/live-sync.md) sütunlara erişebilen ayrı bir kullanıcı hazırlamalıdır. Yönetici hesabını uygulamaya vermeyin. Yazma/DDL ret testleri yalnızca bu kopyada çalıştırılır.
   - Canlı tahmin, okuma sözleşmesindeki sütunlara ek olarak `FIS_DETAY.BELGE_TARIHINDEKI_SON_ALIS_FIYATI` (belge tarihindeki son alış fiyatı) sütununu okur. Bu nedenle canlı okuyucu girişinin bu sütunda SELECT iznine sahip olması gerekir; başka ek izin verilmez.
   - İşletmeci 2026-10-25 tarihinde (tek arayüz planı, karar D2) üretim verisinin canlı salt okunur SQL ile geleceğine karar verdi. Bu sütunun üretimde okunması için Eralp'in açık onayı gerekir ve #110 kaydında tutulur. Bu onay henüz verilmemiştir; onay verilene kadar üretim kaynağına bağlanmayın.
3. Kaynağın `database_guid` değerini ve incelenecek tarih aralığını kaydedin. JSON bağlantı dosyasını Git ve paylaşım klasörleri dışında, yalnızca kendi hesabınızın okuyabildiği bir yerde hazırlayın:

```json
{
  "server": "localhost",
  "port": 14333,
  "database": "IsolatedTest",
  "user": "isolated_reader",
  "password": "REPLACE_WITH_PRIVATE_PASSWORD",
  "scope": "isolated-copy",
  "lineage": "isolated-test-batch",
  "expectedDatabaseId": "00000000-0000-0000-0000-000000000000",
  "from": "2025-01-01",
  "to": "2025-01-31",
  "trustServerCertificate": false
}
```

Tarih aralığı tam geçmiş anlamına gelmez. `trustServerCertificate: true` yalnızca incelenmiş yerel test sertifikası için kullanılabilir; üretim ayarı değildir. Uygulama erişimi alan adı veya ağ izolasyonuyla kendiliğinden doğrulamaz: `isolated-copy` beyanı operatörün doğru test hedefini seçme sorumluluğunun yerini tutmaz.

## Deneme

1. Paketlenmiş uygulamada **Test bağlantısını ayarla** düğmesine basıp özel JSON dosyasını seçin. Ayar başlangıçta kapalıdır. Kaydedilen ayar işletim sisteminin korumalı deposuyla şifrelenir. Kaynak JSON dosyası otomatik silinmez; güvenli biçimde saklayın veya artık gerekmiyorsa kaldırın.
2. **Test bağlantısını aç**, ardından **Kaynağı yeniden kontrol et** düğmesine basın. Beklenen sonuç yukarıdaki eşleme uyarısıdır. Bu uyarı finansal aktarım başarısı değildir.
3. Kaynak kapalıysa, izin kaybolursa veya okuma zaman aşımına uğrarsa güncellik uyarısını kontrol edin. Yerel raporları açın; son geçerli veriler korunmalıdır. Müşteri kayıtlarını veya bağlantı dosyasını ekran görüntüsüne almayın.
4. **Bağlantıyı kapat** düğmesine basın ve **Test bağlantısını aç** düğmesinin yeniden görünmesini bekleyin. Sonra uygulamayı kapatıp açın. Bağlantı kapalı kalmalı ve raporlar çevrimdışı açılmalıdır.

Ayar açık bırakılırsa uygulama yeniden açılışta kaynağı güncel kabul etmez; zamanlanmış kontroller devam eder. Test bitince bağlantıyı kapatın. Kurtarma işlemi de bağlantıyı kapatıp devam eden okumayı sonlandırır; geri yükleme SQL parolalarını taşımaz.

## Yerel çalışmaya dönüş ve sonraki kabul

Bağlantıyı kapatmak son geçerli veri kümesini, giderleri, düzeltmeleri veya kabul edilmiş raporları silmez. Sorunlu bir denemeden sonra yerel raporlarla çalışmaya devam edin. Kopya test kaynaklarını test sahibinin prosedürüne göre kaldırın; orijinal yedeği koruyun.

Üretim kurulumu bu belgenin kapsamı dışındadır. Önce #26 mali eşleme ve gerçek veri kabulü, sonra L01'in her maddesi; Eralp'in ürün kabulü, belirli kaynak için açık izni ve ayrı dağıtım talimatı gereklidir. Mac testi Windows kurulumu veya üretim yükü için kabul kanıtı değildir.
