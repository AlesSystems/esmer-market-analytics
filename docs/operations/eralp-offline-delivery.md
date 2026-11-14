# Eralp çevrimdışı inceleme teslimi — 14 Kasım 2026

Altan kurulumu Eralp ile birlikte yapar. Windows sürümü henüz bilinmiyor; [kurulum ön kontrolü](install-tr.md) oturumdan önce tamamlanmalı. Canlı bağlantı kapalı kalır. [İnceleme ve karar listesi](reveal-tr.md) gerçek oturumda doldurulur.

## Uygulama kimliği

- Sürüm **1.0.1**, kaynak commit `3520ce0821f6b90a1f0ed903beb2e08fa837584f`.
- [Geçen Windows CI](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/43055324223), [dağıtım dosyaları](https://github.com/AlesSystems/esmer-market-analytics/actions/runs/43055324223/artifacts/13871258148). GitHub indirmesi 25 Kasım 2026 saat 16:13 UTC'de sona erer; yerel teslim kopyası bu süreye bağlı değildir.
- [Windows 11 kullanım kanıtı](../evidence/2026-11-11-windows-v1-smoke.md). CI dağıtımlarının 3.078 uygulama arşivi dosyası yerelde kullanılan son teslimle eşleşir; dış EXE hash değerleri derlemeye özgüdür.
- Eski `v1.0.1` etiketi ve Mac gösterimi bu teslim değildir.

| Dosya | SHA-256 |
| --- | --- |
| Esmer Market Analytics Setup 1.0.1.exe | `2d51ba6abc162a698f66415f2e1a17eede9bb87cbe1e384b0970eae1385c1270` |
| Esmer Market Analytics 1.0.1.exe | `4a16b93a44998f7b9cc76ebf6f87477a09bfa67df579243de54ee935ad619593` |

Teslim klasöründe PowerShell ile kontrol edin; sonuçlar yukarıdaki değerlerle aynı olmalı:

```powershell
Get-FileHash -Algorithm SHA256 '.\Esmer Market Analytics Setup 1.0.1.exe', '.\Esmer Market Analytics 1.0.1.exe'
```

## Teslim klasörü

- İki EXE, `release-inventory.json`, `distribution-inspection.json`: değiştirilmemiş CI çıktıları.
- **SENTETIK-INCELEME.json**: Ağustos–Ekim 2025 gösterim örneği. Gerçek market paketi veya bağlantı bilgisi içermez.
- Bu liste, kurulum, inceleme/karar ve kurtarma yönergeleri, bilinen sınırlar.
- **SHA256SUMS.txt**: yerel bütünlük listesi. EXE için ayrıca yukarıdaki sabit değerleri kullanın.

Belgeleri ve uygulamayı birlikte taşıyın. Eralp'in kullanımında kaynak kodu veya Node kurulumu gerekmez. Uygulama dosyaları değiştirilirse yeni kimlik ve test kanıtı gerekir.

## Kalan sınırlar

[#139](https://github.com/AlesSystems/esmer-market-analytics/issues/139) değerlendirmesi [hazırlık kaydındadır](../evidence/2026-11-14-eralp-offline-readiness.md). [#138](https://github.com/AlesSystems/esmer-market-analytics/issues/138) bağımsız kurtarma ve elektrik kesintisi doğrulaması ertelenmiştir. Uygulama içindeki bilinen sınırlar 11 Kasım tarihli teslim anını anlatır; güncel oturum durumu doldurulacak inceleme kaydındadır. Eralp'in kabulü ve gerçek kaynak erişim izni henüz verilmiş sayılmaz.
