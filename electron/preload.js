const { contextBridge, ipcRenderer } = require('electron');

// Exposes a minimal, safe bridge to the web app running inside the
// BrowserWindow. See src/App.tsx in the main repo for the renderer side.
contextBridge.exposeInMainWorld('voicetypeDesktop', {
  onToggle: (callback) => ipcRenderer.on('toggle-dictation', () => callback()),
  notifyDone: () => ipcRenderer.send('dictation-done'),
});
