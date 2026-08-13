const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron')
const path = require('node:path')

const BASE_WINDOW_WIDTH = 180
const BASE_WINDOW_HEIGHT = 180
const SCREEN_MARGIN = 20
const TRAY_ICON_SIZE = 22
const FRIEND_WINDOW_WIDTH = 130
const FRIEND_WINDOW_HEIGHT = 155
const FRIEND_WINDOW_GAP = 14
const ROAM_TICK_MS = 50
const ROAM_SPEED_PX_PER_TICK = 1.5
const ROAM_PAUSE_MIN_MS = 1500
const ROAM_PAUSE_MAX_MS = 4000
const ROAM_MIN_SPACING_PX = 110
const ROAM_RESUME_AFTER_DRAG_MS = 1500
// Alex is a static demo friend fixed at "studying" (stationary); flip to true only for manual testing.
const DEMO_FRIEND_ROAMS = false

const dragStates = new Map()
const roamableWindows = new Set()
const roamStates = new Map()
let petWindow = null
let friendWindow = null
let tray = null
let windowScaleMultiplier = 1
let alwaysOnTopEnabled = true
let mimiVisible = true
let demoFriendEnabled = true

// Keep in sync with CHARACTERS in src/characters.ts.
const MENU_CHARACTERS = [
  { id: 'pet1', name: 'Biscuit' },
  { id: 'pet3', name: 'Waffle' },
  { id: 'pet3_1', name: 'Praline' },
  { id: 'pet4', name: 'Marble' },
  { id: 'pet4_1', name: 'Clover' },
  { id: 'pet5', name: 'Sugar' },
  { id: 'pet6', name: 'Peanut' },
  { id: 'pet7', name: 'Choco' },
]

const PET_SIZES = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
]

const petState = {
  isStudying: false,
  todayTotalSeconds: 0,
  selectedCharacterId: 'pet1',
  petSizeId: 'medium',
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value) => String(value).padStart(2, '0')

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

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

function sendRoamPhase(window, phase) {
  if (!window || window.isDestroyed()) return
  window.webContents.send('roam-phase', phase)
}

function pickRoamTarget(window) {
  const bounds = window.getBounds()
  const area = screen.getDisplayMatching(bounds).workArea
  const minX = area.x
  const minY = area.y
  const maxX = Math.max(minX, area.x + area.width - bounds.width)
  const maxY = Math.max(minY, area.y + area.height - bounds.height)

  let candidate = { x: bounds.x, y: bounds.y }
  for (let attempt = 0; attempt < 8; attempt++) {
    const x = Math.round(minX + Math.random() * (maxX - minX))
    const y = Math.round(minY + Math.random() * (maxY - minY))
    candidate = { x, y }

    const tooClose = [...roamableWindows].some((other) => {
      if (other === window || other.isDestroyed()) return false
      const otherBounds = other.getBounds()
      const dx = x + bounds.width / 2 - (otherBounds.x + otherBounds.width / 2)
      const dy = y + bounds.height / 2 - (otherBounds.y + otherBounds.height / 2)
      return Math.hypot(dx, dy) < ROAM_MIN_SPACING_PX
    })
    if (!tooClose) return candidate
  }
  return candidate
}

function stopRoaming(window) {
  const state = roamStates.get(window)
  if (!state) return
  clearTimeout(state.timer)
  roamStates.delete(window)
}

function startRoamCycle(window) {
  if (!window || window.isDestroyed() || roamStates.has(window)) return
  const state = { timer: null }
  roamStates.set(window, state)

  const pauseThenWalk = () => {
    if (window.isDestroyed() || roamStates.get(window) !== state) return
    sendRoamPhase(window, 'paused')
    const pauseMs = ROAM_PAUSE_MIN_MS + Math.random() * (ROAM_PAUSE_MAX_MS - ROAM_PAUSE_MIN_MS)
    state.timer = setTimeout(walkToNewTarget, pauseMs)
  }

  const walkToNewTarget = () => {
    if (window.isDestroyed() || roamStates.get(window) !== state) return
    const [fromX, fromY] = window.getPosition()
    const target = pickRoamTarget(window)
    const dx = target.x - fromX
    const dy = target.y - fromY
    const distance = Math.hypot(dx, dy)

    if (distance < ROAM_SPEED_PX_PER_TICK * 2) {
      pauseThenWalk()
      return
    }

    sendRoamPhase(window, 'walking')
    const steps = Math.max(1, Math.round(distance / ROAM_SPEED_PX_PER_TICK))
    let stepIndex = 0

    const step = () => {
      if (window.isDestroyed() || roamStates.get(window) !== state) return
      stepIndex += 1
      const t = Math.min(1, stepIndex / steps)
      window.setPosition(Math.round(fromX + dx * t), Math.round(fromY + dy * t))
      state.timer = t >= 1 ? setTimeout(pauseThenWalk, ROAM_TICK_MS) : setTimeout(step, ROAM_TICK_MS)
    }
    state.timer = setTimeout(step, ROAM_TICK_MS)
  }

  pauseThenWalk()
}

ipcMain.on('pet-drag-start', (event, mouseX, mouseY) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window || !Number.isFinite(mouseX) || !Number.isFinite(mouseY)) return

  stopRoaming(window)
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

  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) return
  setTimeout(() => {
    if (petState.isStudying) return
    const isDraggingAgain = [...dragStates.values()].some((drag) => drag.window === window)
    if (isDraggingAgain) return
    startRoamCycle(window)
  }, ROAM_RESUME_AFTER_DRAG_MS)
})

ipcMain.on('pet-set-window-scale', (event, multiplier) => {
  if (!Number.isFinite(multiplier) || multiplier <= 0) return
  windowScaleMultiplier = multiplier

  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) return

  const [x, y] = window.getPosition()
  const width = Math.round(BASE_WINDOW_WIDTH * multiplier)
  const height = Math.round(BASE_WINDOW_HEIGHT * multiplier)
  window.setSize(width, height)

  const position = clampPosition(window, x, y)
  window.setPosition(position.x, position.y)
})

ipcMain.on('pet-state-sync', (event, state) => {
  if (!state || typeof state !== 'object') return

  const wasStudying = petState.isStudying
  Object.assign(petState, state)

  if (petState.isStudying !== wasStudying && petWindow) {
    if (petState.isStudying) stopRoaming(petWindow)
    else startRoamCycle(petWindow)
  }
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

function createFriendWindow() {
  if (friendWindow || !petWindow) return

  const mainBounds = petWindow.getBounds()
  const initialX = mainBounds.x - FRIEND_WINDOW_WIDTH - FRIEND_WINDOW_GAP
  const initialY = mainBounds.y + mainBounds.height - FRIEND_WINDOW_HEIGHT

  const window = new BrowserWindow({
    width: FRIEND_WINDOW_WIDTH,
    height: FRIEND_WINDOW_HEIGHT,
    x: initialX,
    y: initialY,
    transparent: true,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'electron-preload.cjs'),
    },
  })

  const position = clampPosition(window, initialX, initialY)
  window.setPosition(position.x, position.y)
  window.setAlwaysOnTop(true, 'floating')
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  window.loadFile(path.join(__dirname, 'dist', 'index.html'), { hash: 'friend' })
  window.once('ready-to-show', () => window.show())
  window.on('closed', () => {
    roamableWindows.delete(window)
    stopRoaming(window)
    if (friendWindow === window) friendWindow = null
  })
  friendWindow = window
  roamableWindows.add(window)
  if (DEMO_FRIEND_ROAMS) startRoamCycle(window)
}

function destroyFriendWindow() {
  if (!friendWindow) return
  friendWindow.close()
  friendWindow = null
}

function sendTrayCommand(command) {
  if (!petWindow) return
  petWindow.webContents.send('tray-command', command)
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: 'StudyMimi', enabled: false },
    { type: 'separator' },
    {
      label: petState.isStudying ? 'Stop Studying' : 'Start Studying',
      click: () => sendTrayCommand({ type: 'toggle-studying' }),
    },
    {
      label: 'Change Mimi',
      submenu: MENU_CHARACTERS.map((character) => ({
        label: character.name,
        type: 'radio',
        checked: character.id === petState.selectedCharacterId,
        click: () => sendTrayCommand({ type: 'select-character', id: character.id }),
      })),
    },
    {
      label: 'Pet Size',
      submenu: PET_SIZES.map((size) => ({
        label: size.label,
        type: 'radio',
        checked: size.id === petState.petSizeId,
        click: () => sendTrayCommand({ type: 'set-pet-size', id: size.id }),
      })),
    },
    { type: 'separator' },
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: alwaysOnTopEnabled,
      click: () => {
        alwaysOnTopEnabled = !alwaysOnTopEnabled
        if (petWindow) petWindow.setAlwaysOnTop(alwaysOnTopEnabled, 'floating')
      },
    },
    {
      label: 'Show Mimi',
      type: 'checkbox',
      checked: mimiVisible,
      click: () => {
        mimiVisible = !mimiVisible
        if (!petWindow) return
        if (mimiVisible) showPetWindow()
        else petWindow.hide()
      },
    },
    { type: 'separator' },
    { label: `Today: ${formatDuration(petState.todayTotalSeconds)}`, enabled: false },
    { type: 'separator' },
    {
      label: 'Demo Friend',
      type: 'checkbox',
      checked: demoFriendEnabled,
      click: () => {
        demoFriendEnabled = !demoFriendEnabled
        if (demoFriendEnabled) createFriendWindow()
        else destroyFriendWindow()
      },
    },
    { type: 'separator' },
    { label: 'Quit StudyMimi', click: () => app.quit() },
  ])
}

function createTray() {
  const icon = nativeImage
    .createFromPath(path.join(__dirname, 'dist', 'characters', 'pet1.png'))
    .crop({ x: 0, y: 0, width: 128, height: 128 })
    .resize({ width: TRAY_ICON_SIZE, height: TRAY_ICON_SIZE, quality: 'best' })

  tray = new Tray(icon)
  tray.setToolTip('StudyMimi')
  tray.on('click', () => tray.popUpContextMenu(buildTrayMenu()))
  tray.on('right-click', () => tray.popUpContextMenu(buildTrayMenu()))
}

function createPetWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea
  const window = new BrowserWindow({
    width: BASE_WINDOW_WIDTH,
    height: BASE_WINDOW_HEIGHT,
    x: x + width - BASE_WINDOW_WIDTH - SCREEN_MARGIN,
    y: y + height - BASE_WINDOW_HEIGHT - SCREEN_MARGIN,
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
    roamableWindows.delete(window)
    stopRoaming(window)
    if (petWindow === window) petWindow = null
  })
  petWindow = window
  roamableWindows.add(window)
  if (!petState.isStudying) startRoamCycle(window)
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.setActivationPolicy('accessory')
  createPetWindow()
  createTray()
  if (demoFriendEnabled) createFriendWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createPetWindow()
  })
})

app.on('window-all-closed', () => app.quit())
