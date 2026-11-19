"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("flow", {
  getConfig: () => ipcRenderer.invoke("flow:config:get"),
  setConfig: (patch) => ipcRenderer.invoke("flow:config:set", patch),
  health: () => ipcRenderer.invoke("flow:health"),
  start: () => ipcRenderer.invoke("flow:start"),
  generate: (payload) => ipcRenderer.invoke("flow:generate", payload),
  chooseDir: () => ipcRenderer.invoke("flow:choose-dir"),
  listOutputs: () => ipcRenderer.invoke("flow:list-outputs"),
  reveal: (target) => ipcRenderer.invoke("flow:reveal", target),
  openExternal: (url) => ipcRenderer.invoke("flow:open-external", url),
  onProgress: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("flow:progress", listener);
    return () => ipcRenderer.removeListener("flow:progress", listener);
  },
});
