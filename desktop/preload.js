const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  quit: () => ipcRenderer.send('pet-quit'),
  hide: () => ipcRenderer.send('pet-hide'),
  openMainApp: () => ipcRenderer.send('pet-open-main')
});
