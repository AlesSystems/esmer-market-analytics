import { contextBridge, ipcRenderer } from "electron";
import type { DesktopApi } from "../domain/contracts";
const api: DesktopApi = {
  getPreferences: () => ipcRenderer.invoke("esmer:request", "getPreferences", null),
  setPreferences: request => ipcRenderer.invoke("esmer:request", "setPreferences", request),
  getLiveStatus: () => ipcRenderer.invoke("esmer:request", "getLiveStatus", null),
  configureLiveSource: () => ipcRenderer.invoke("esmer:request", "configureLiveSource", null),
  setLiveEnabled: request => ipcRenderer.invoke("esmer:request", "setLiveEnabled", request),
  refreshLiveSource: () => ipcRenderer.invoke("esmer:request", "refreshLiveSource", null),
  getRecoveryStatus: () => ipcRenderer.invoke("esmer:request", "getRecoveryStatus", null),
  setupRecovery: () => ipcRenderer.invoke("esmer:request", "setupRecovery", null),
  backupNow: () => ipcRenderer.invoke("esmer:request", "backupNow", null),
  pinBackup: request => ipcRenderer.invoke("esmer:request", "pinBackup", request),
  prepareRestore: () => ipcRenderer.invoke("esmer:request", "prepareRestore", null),
  confirmRestore: request => ipcRenderer.invoke("esmer:request", "confirmRestore", request),
  cancelRestore: request => ipcRenderer.invoke("esmer:request", "cancelRestore", request),
  cancelOperation: request => ipcRenderer.invoke("esmer:request", "cancelOperation", request),
  getOperationStatus: () => ipcRenderer.invoke("esmer:request", "getOperationStatus", null),
  createExpense: request => ipcRenderer.invoke("esmer:request", "createExpense", request),
  saveExpenseTemplate: () => ipcRenderer.invoke("esmer:request", "saveExpenseTemplate", null),
  previewExpenses: () => ipcRenderer.invoke("esmer:request", "previewExpenses", null),
  confirmExpenses: request => ipcRenderer.invoke("esmer:request", "confirmExpenses", request),
  queryExpenses: request => ipcRenderer.invoke("esmer:request", "queryExpenses", request),
  correctExpense: request => ipcRenderer.invoke("esmer:request", "correctExpense", request),
  restoreExpense: request => ipcRenderer.invoke("esmer:request", "restoreExpense", request),
  confirmExpenseCompleteness: request => ipcRenderer.invoke("esmer:request", "confirmExpenseCompleteness", request),
  readMonthProfit: request => ipcRenderer.invoke("esmer:request","readMonthProfit",request),
  exportMonthProfit: request => ipcRenderer.invoke("esmer:request","exportMonthProfit",request),
  querySourceWorkspace: request => ipcRenderer.invoke("esmer:request", "querySourceWorkspace", request),
  importPackage: () => ipcRenderer.invoke("esmer:request", "importPackage", null),
  getAvailability: () =>
    ipcRenderer.invoke("esmer:request", "getAvailability", null),
};
contextBridge.exposeInMainWorld("esmer", api);
