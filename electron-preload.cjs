const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('petWindow', {
  startDrag: (screenX, screenY) => ipcRenderer.send('pet-drag-start', screenX, screenY),
  moveDrag: (screenX, screenY) => ipcRenderer.send('pet-drag-move', screenX, screenY),
  endDrag: () => ipcRenderer.send('pet-drag-end'),
  setWindowScale: (multiplier) => ipcRenderer.send('pet-set-window-scale', multiplier),
  syncState: (state) => ipcRenderer.send('pet-state-sync', state),
  onTrayCommand: (callback) => {
    const listener = (_event, command) => callback(command)
    ipcRenderer.on('tray-command', listener)
    return () => ipcRenderer.removeListener('tray-command', listener)
  },
})
