import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi } from "../domain/contracts";
const api: DesktopApi = {
  getAvailability: () =>
    ipcRenderer.invoke("esmer:request", "getAvailability", null),
};
contextBridge.exposeInMainWorld("esmer", api);
