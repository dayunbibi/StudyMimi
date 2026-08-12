const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const WINDOW_WIDTH = 180
const WINDOW_HEIGHT = 180
const EXPANDED_WINDOW_WIDTH = 220
const EXPANDED_WINDOW_HEIGHT = 300
const SCREEN_MARGIN = 20
const dragStates = new Map()
let petWindow = null
let tray = null

function clampPosition(window, x, y) {
  const bounds = window.getBounds()
  const display = screen.getDisplayNearestPoint({
    x: x + Math.round(bounds.width / 2),
    y: y + Math.round(bounds.height / 2),
  })
  const area = display.workArea

  return {
    x: Math.min(Math.max(x, area.x), area.x + area.width - bounds.width),
    y: Math.min(Math.max(y, area.y), area.y + area.height - bounds.height),
  }
}

ipcMain.on('pet-drag-start', (event, mouseX, mouseY) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window || !Number.isFinite(mouseX) || !Number.isFinite(mouseY)) return

  const [windowX, windowY] = window.getPosition()
  dragStates.set(event.sender.id, { window, mouseX, mouseY, windowX, windowY })
})

ipcMain.on('pet-drag-move', (event, mouseX, mouseY) => {
  const drag = dragStates.get(event.sender.id)
  if (!drag || !Number.isFinite(mouseX) || !Number.isFinite(mouseY)) return

  const position = clampPosition(
    drag.window,
    Math.round(drag.windowX + mouseX - drag.mouseX),
    Math.round(drag.windowY + mouseY - drag.mouseY),
  )
  drag.window.setPosition(position.x, position.y)
})

ipcMain.on('pet-drag-end', (event) => {
  dragStates.delete(event.sender.id)
})

ipcMain.on('pet-set-expanded', (event, expanded) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) return

  const [x, y] = window.getPosition()
  const width = expanded ? EXPANDED_WINDOW_WIDTH : WINDOW_WIDTH
  const height = expanded ? EXPANDED_WINDOW_HEIGHT : WINDOW_HEIGHT
  window.setSize(width, height)

  const position = clampPosition(window, x, y)
  window.setPosition(position.x, position.y)
})

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

function showPetWindow() {
  if (!petWindow) return

  const position = clampPosition(petWindow, ...petWindow.getPosition())
  petWindow.setPosition(position.x, position.y)
  petWindow.show()
  petWindow.focus()
}

function createTray() {
  const icon = nativeImage.createEmpty()
  icon.addRepresentation({
    scaleFactor: 1,
    buffer: fs.readFileSync(path.join(__dirname, 'public', 'tray-icon.png')),
  })
  icon.addRepresentation({
    scaleFactor: 2,
    buffer: fs.readFileSync(path.join(__dirname, 'public', 'tray-icon@2x.png')),
  })

  tray = new Tray(icon)
  tray.setToolTip('StudyMimi')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Mimi', click: showPetWindow },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ]),
  )
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
      preload: path.join(__dirname, 'electron-preload.cjs'),
    },
  })

  window.setAlwaysOnTop(true, 'floating')
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  keepWindowOnScreen(window)
  window.loadFile(path.join(__dirname, 'dist', 'index.html'))
  window.once('ready-to-show', () => window.show())
  window.on('closed', () => {
    if (petWindow === window) petWindow = null
  })
  petWindow = window
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.setActivationPolicy('accessory')
  createPetWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createPetWindow()
  })
})

app.on('window-all-closed', () => app.quit())
