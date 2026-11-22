"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("flow", {
  getConfig: () => ipcRenderer.invoke("flow:config:get"),
  setConfig: (patch) => ipcRenderer.invoke("flow:config:set", patch),
  health: () => ipcRenderer.invoke("flow:health"),
  models: () => ipcRenderer.invoke("flow:models"),
  ingestTraining: (payload) => ipcRenderer.invoke("flow:training:ingest", payload),
  previewWorkflow: (payload) => ipcRenderer.invoke("flow:workflow:preview", payload),
  listReferences: () => ipcRenderer.invoke("flow:references:list"),
  addReference: (payload) => ipcRenderer.invoke("flow:references:add", payload),
  readReferenceData: (payload) => ipcRenderer.invoke("flow:references:data", payload),
  removeReference: (payload) => ipcRenderer.invoke("flow:references:remove", payload),
  setReferenceCategory: (payload) => ipcRenderer.invoke("flow:references:set-category", payload),
  openReferences: () => ipcRenderer.invoke("flow:references:open"),
  start: () => ipcRenderer.invoke("flow:start"),
  llmStatus: () => ipcRenderer.invoke("flow:llm:status"),
  startLlm: () => ipcRenderer.invoke("flow:llm:start"),
  setupLocalAi: () => ipcRenderer.invoke("flow:llm:setup"),
  checkRuntime: () => ipcRenderer.invoke("flow:runtime:check"),
  installRuntime: (payload) => ipcRenderer.invoke("flow:runtime:install", payload),
  stopLlm: () => ipcRenderer.invoke("flow:llm:stop"),
  llmChat: (payload) => ipcRenderer.invoke("flow:llm:chat", payload),
  generate: (payload) => ipcRenderer.invoke("flow:generate", payload),
  chooseDir: () => ipcRenderer.invoke("flow:choose-dir"),
  listOutputs: () => ipcRenderer.invoke("flow:list-outputs"),
  deleteOutput: (payload) => ipcRenderer.invoke("flow:delete-output", payload),
  repairFeet: (payload) => ipcRenderer.invoke("flow:repair-feet", payload),
  reveal: (target) => ipcRenderer.invoke("flow:reveal", target),
  openExternal: (url) => ipcRenderer.invoke("flow:open-external", url),
  onLlmToken: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("flow:llm:token", listener);
    return () => ipcRenderer.removeListener("flow:llm:token", listener);
  },
  onProgress: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("flow:progress", listener);
    return () => ipcRenderer.removeListener("flow:progress", listener);
  },
});
