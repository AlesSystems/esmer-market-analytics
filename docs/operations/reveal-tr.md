# Yerel gösterimi hazırlayın

Bu yönerge 0.2.0 önizlemesi içindir. [Kabul kaydı](../evidence/release-acceptance.md) ilk sürümün hazır olmadığını gösterdiği sürece gerçek market açılışı olarak sunmayın. Sentetik gösterimi ayrı bir profilde açın ve ekrandaki sentetik veri uyarısını görünür tutun.

1. **Aylık Market Özeti** bölümünü açın. Dönemi, veri kesim tarihini, kapsamı ve yöntemi gösterin. Sentetik örnekte iki satışın toplamı 200 ₺ olur. Maliyet kanıtı olan 100 ₺ satışın tahmini maliyeti 60 ₺, kapsanan tahmini brüt kârı 40 ₺ olur. Kalan satışın maliyeti bilinmez.
2. Gider dosyası yüklemeden devam edin. **Faaliyet kârı hesaplanamıyor — gider verileri eksik.** açıklamasını gösterin. Gösterim için gider veya sahibin onayını uydurmayın.
3. **Satış Özeti**, ürün, işlem ve **Kaynak detayını göster** sırasını izleyin. Aynı tutarın belge, satır, veri sürümü ve yöntemle bağlantısını açın. Müşteri iadesinin satışa etkisini, tedarikçi iadesinden ayrı anlatın.
4. **Maliyet ve Alışlar** bölümünde tarihsel maliyet ile yerine koyma maliyetini karşılaştırın. Testlerdeki satın alma ve tedarikçi iadesi örneğinde fiziksel iade, istenen tutar ve kanıtlanmış kredi arasındaki farkı gösterin. Örnek pakette iade yoksa örnek varmış gibi sunmayın; [satın alma testi](../../tests/desktop/purchasing.test.ts) ayrı sentetik örneği tanımlar.
5. **Giderler** bölümünde Excel şablonunu ve aktarım önizlemesini gösterin. Önizlemenin onaylanmadan kaydedilmediğini kontrol edin. İthal edilen örneğin sentetik olduğunu söyleyin. Tamamlık onayını Eralp adına vermeyin.
6. **Rapor sürümleri** bölümünde seçili raporun dönemini ve uyarılarını inceleyin. İncelenen sürümü kaydedip Excel'e aktarın. Excel tutarlarını, veri sonunu, tahmin etiketini ve rapor kimliğini ekrandaki sürümle karşılaştırın.
7. **Yedekleme ve kurtarma** bölümünü açın. Anahtarı ekranda veya sunum dosyasında göstermeyin. [Kurtarma yönergesindeki](recovery-tr.md) ayrı yedek ve anahtar saklama adımlarını anlatın. Geri yüklemeyi yalnızca atıl sentetik profilde gösterin.

Gösterim öncesinde [kurulum yönergesini](install-tr.md) ve [bilinen sınırları](known-limitations-tr.md) okuyun. Gerçek veri paketi sağlanırsa paket kimliğini, gerçek kesim tarihini ve izin verilen kapsamı kabul kaydına ekleyin. Tarihsel denetimin 12 Ekim 2025 kesim tarihini yeni veri gibi sunmayın. Eralp'e gösterim veya onun bilgisayarına kurulum ancak kullanıcının sonraki yönlendirmesiyle yapılır.

## Kayıtlı kaynak tahminini gösterin

Yetkilendirilmiş hazır tahmin paketi için **Ayarlar** bölümünden **Veri paketi içe aktar** seçeneğini kullanın. Kaynak dönemini, veri sonunu, doğrulanmamış tahmin açıklamasını, kapsanan ve dışlanan satırları gösterin. Ürün kimliğiyle arama, günlük döküm ve kaynak belgesi ayrıntılarını açın. İade katkısının ve desteklenmeyen maliyetlerin dışlandığını açıklayın. Katkı tahminini doğrulanmış brüt kâr veya tüm market kârı olarak sunmayın.

Excel çıktısını aynı kaynak ve dönemle karşılaştırın. Tahminler kabul edilmiş mali rapor sürümü oluşturmaz. Özel paketi, tutarları ve kimlikleri sunum ekran görüntülerine veya Git'e eklemeyin. Bu akışın [kanıtı ve Windows devamı](../../workstreams/estimated-v1/windows-handoff.md) ayrı tutulur.

**Giderler** bölümünde **Elle gider ekle** ile tek kayıt da oluşturulabilir. Kaydetmek dönemin tamlığını onaylamaz. [Elle giriş kanıtı](../evidence/2026-10-04-manual-expense-entry.md) güncel Windows kontrollerinin açık olduğunu kaydeder.
