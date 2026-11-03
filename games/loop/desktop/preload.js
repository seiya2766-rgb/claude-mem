// The only bridge between the game page and the desktop shell. The page checks for window.loopSteam and works without it.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('loopSteam', {
  info: () => ipcRenderer.invoke('steam:info'),
  unlock: id => ipcRenderer.send('steam:achievement', String(id)),
  toggleFullscreen: () => ipcRenderer.send('win:fullscreen'),
});
