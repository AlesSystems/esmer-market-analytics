import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi } from "../domain/contracts";
const api: DesktopApi = {
  queryPurchasing: request => ipcRenderer.invoke("esmer:request", "queryPurchasing", request),
  openSales: request => ipcRenderer.invoke("esmer:request", "openSales", request),
  querySales: request => ipcRenderer.invoke("esmer:request", "querySales", request),
  inspectSales: request => ipcRenderer.invoke("esmer:request", "inspectSales", request),
  importPackage: () => ipcRenderer.invoke("esmer:request", "importPackage", null),
  getAvailability: () =>
    ipcRenderer.invoke("esmer:request", "getAvailability", null),
};
contextBridge.exposeInMainWorld("esmer", api);
