import type { ImportOutcome } from "../domain/contracts";
import type { ImportResult } from "../store/store";
export function importOutcome(result: ImportResult): ImportOutcome {
  if (result.status !== "failed") return result;
  return { ...result, message: result.code === "STORAGE_FULL" ? "Disk alanı yetersiz. Son geçerli veriler korundu. Yer açıp yeniden deneyin." : result.code === "INVALID_PACKAGE" ? "Veri paketi geçersiz. Son geçerli veriler korundu." : "İçe aktarma tamamlanamadı. Son geçerli veriler korundu." };
}
