const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('petWindow', {
  startDrag: (screenX, screenY) => ipcRenderer.send('pet-drag-start', screenX, screenY),
  moveDrag: (screenX, screenY) => ipcRenderer.send('pet-drag-move', screenX, screenY),
  endDrag: () => ipcRenderer.send('pet-drag-end'),
})
