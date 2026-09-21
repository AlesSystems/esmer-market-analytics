import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi } from "../domain/contracts";
const api: DesktopApi = {
  saveExpenseTemplate: () => ipcRenderer.invoke("esmer:request", "saveExpenseTemplate", null),
  previewExpenses: () => ipcRenderer.invoke("esmer:request", "previewExpenses", null),
  confirmExpenses: request => ipcRenderer.invoke("esmer:request", "confirmExpenses", request),
  queryExpenses: request => ipcRenderer.invoke("esmer:request", "queryExpenses", request),
  correctExpense: request => ipcRenderer.invoke("esmer:request", "correctExpense", request),
  restoreExpense: request => ipcRenderer.invoke("esmer:request", "restoreExpense", request),
  confirmExpenseCompleteness: request => ipcRenderer.invoke("esmer:request", "confirmExpenseCompleteness", request),
  queryOperating: request => ipcRenderer.invoke("esmer:request", "queryOperating", request),
  queryPurchasing: request => ipcRenderer.invoke("esmer:request", "queryPurchasing", request),
  openSales: request => ipcRenderer.invoke("esmer:request", "openSales", request),
  querySales: request => ipcRenderer.invoke("esmer:request", "querySales", request),
  inspectSales: request => ipcRenderer.invoke("esmer:request", "inspectSales", request),
  importPackage: () => ipcRenderer.invoke("esmer:request", "importPackage", null),
  getAvailability: () =>
    ipcRenderer.invoke("esmer:request", "getAvailability", null),
};
contextBridge.exposeInMainWorld("esmer", api);
