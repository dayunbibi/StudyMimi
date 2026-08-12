const { app, BrowserWindow, screen } = require('electron')
const path = require('node:path')

const WINDOW_WIDTH = 180
const WINDOW_HEIGHT = 180
const SCREEN_MARGIN = 20

function keepWindowOnScreen(window) {
  let isCorrectingPosition = false

  window.on('move', () => {
    if (isCorrectingPosition) return

    const bounds = window.getBounds()
    const area = screen.getDisplayMatching(bounds).workArea
    const x = Math.min(Math.max(bounds.x, area.x), area.x + area.width - bounds.width)
    const y = Math.min(Math.max(bounds.y, area.y), area.y + area.height - bounds.height)

    if (x !== bounds.x || y !== bounds.y) {
      isCorrectingPosition = true
      window.setPosition(x, y)
      isCorrectingPosition = false
    }
  })
}

function createPetWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea
  const window = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: x + width - WINDOW_WIDTH - SCREEN_MARGIN,
    y: y + height - WINDOW_HEIGHT - SCREEN_MARGIN,
    transparent: true,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  window.setAlwaysOnTop(true, 'floating')
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  keepWindowOnScreen(window)
  window.loadFile(path.join(__dirname, 'dist', 'index.html'))
  window.once('ready-to-show', () => window.show())
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.setActivationPolicy('accessory')
  createPetWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createPetWindow()
  })
})

app.on('window-all-closed', () => app.quit())
