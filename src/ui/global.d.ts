import type { DesktopApi } from "../domain/contracts";
declare global {
  interface Window {
    esmer: DesktopApi;
    require?: unknown;
    process?: unknown;
  }
}
