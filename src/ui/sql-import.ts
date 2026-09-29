import type { LiveResult, RequestError } from "../domain/contracts";

export type SqlImportApi = {
  configureLiveSource(): Promise<LiveResult | RequestError>;
  setLiveEnabled(enabled: boolean): Promise<LiveResult | RequestError>;
  refreshLiveSource(): Promise<LiveResult | RequestError>;
};

export async function importSqlSource(api: SqlImportApi): Promise<LiveResult | RequestError> {
  const configured = await api.configureLiveSource();
  if (configured.status !== "live" || !configured.configured || configured.configurationError)
    return configured;
  const enabled = await api.setLiveEnabled(true);
  if (enabled.status !== "live") return enabled;
  return api.refreshLiveSource();
}
