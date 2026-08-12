import { useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import './App.css'
import { CHARACTERS, DEFAULT_CHARACTER_ID, getCharacterById } from './characters'

const DRAG_THRESHOLD = 5
const TODAY_STUDY_STORAGE_KEY = 'studymimi:todayStudySeconds'
const CHARACTER_STORAGE_KEY = 'studymimi:selectedCharacter'
const PET_SIZE_STORAGE_KEY = 'studymimi:petSize'
const CELEBRATE_DURATION_MS = 1500
const TIRED_THRESHOLD_SECONDS = 60 * 60
const FRAME_SIZE = 128

type PointerStart = {
  pointerId: number
  screenX: number
  screenY: number
  dragged: boolean
}

type PetAnimation = 'idle' | 'studying' | 'celebrating'

const PET_SIZES = [
  { id: 'small', multiplier: 0.8 },
  { id: 'medium', multiplier: 1 },
  { id: 'large', multiplier: 1.25 },
] as const

const DEFAULT_PET_SIZE_ID = 'medium'

function getPetSizeMultiplier(id: string): number {
  return PET_SIZES.find((size) => size.id === id)?.multiplier ?? 1
}

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const paddedMinutes = String(minutes).padStart(2, '0')
  const paddedSeconds = String(seconds).padStart(2, '0')

  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${paddedMinutes}:${paddedSeconds}`
    : `${paddedMinutes}:${paddedSeconds}`
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadTodayStudySeconds(): number {
  try {
    const raw = window.localStorage.getItem(TODAY_STUDY_STORAGE_KEY)
    if (!raw) return 0

    const parsed = JSON.parse(raw) as { date: string; seconds: number }
    return parsed.date === getTodayKey() ? parsed.seconds : 0
  } catch {
    return 0
  }
}

function saveTodayStudySeconds(seconds: number) {
  window.localStorage.setItem(
    TODAY_STUDY_STORAGE_KEY,
    JSON.stringify({ date: getTodayKey(), seconds }),
  )
}

function loadSelectedCharacterId(): string {
  try {
    const raw = window.localStorage.getItem(CHARACTER_STORAGE_KEY)
    return raw && CHARACTERS.some((character) => character.id === raw)
      ? raw
      : DEFAULT_CHARACTER_ID
  } catch {
    return DEFAULT_CHARACTER_ID
  }
}

function loadPetSizeId(): string {
  try {
    const raw = window.localStorage.getItem(PET_SIZE_STORAGE_KEY)
    return raw && PET_SIZES.some((size) => size.id === raw) ? raw : DEFAULT_PET_SIZE_ID
  } catch {
    return DEFAULT_PET_SIZE_ID
  }
}

function App() {
  const [isStudying, setIsStudying] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [todayStudySeconds, setTodayStudySeconds] = useState(loadTodayStudySeconds)
  const [petAnimation, setPetAnimation] = useState<PetAnimation>('idle')
  const [selectedCharacterId, setSelectedCharacterId] = useState(loadSelectedCharacterId)
  const [petSizeId, setPetSizeId] = useState(loadPetSizeId)
  const [frameIndex, setFrameIndex] = useState(0)
  const pointerStart = useRef<PointerStart | null>(null)
  const celebrateTimeout = useRef<number | null>(null)

  const character = getCharacterById(selectedCharacterId)
  const animationKey =
    petAnimation === 'studying' && elapsedSeconds >= TIRED_THRESHOLD_SECONDS
      ? 'tired'
      : petAnimation
  const animation = character.animations[animationKey]
  const frame = animation.frames[frameIndex % animation.frames.length]
  const petStyle: CSSProperties = {
    backgroundImage: `url('${character.file}')`,
    backgroundSize: `${character.sheetWidth}px ${character.sheetHeight}px`,
    backgroundPosition: `-${frame.col * FRAME_SIZE}px -${frame.row * FRAME_SIZE}px`,
    transform: `scale(${character.sizeScale * getPetSizeMultiplier(petSizeId)})`,
  }
  const todayTotalSeconds = todayStudySeconds + (isStudying ? elapsedSeconds : 0)

  useEffect(() => {
    if (!isStudying) return

    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 250)

    return () => window.clearInterval(timer)
  }, [isStudying])

  useEffect(() => {
    return () => {
      if (celebrateTimeout.current !== null) window.clearTimeout(celebrateTimeout.current)
    }
  }, [])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || animation.frames.length <= 1) return

    const timer = window.setInterval(() => {
      setFrameIndex((index) => (index + 1) % animation.frames.length)
    }, animation.frameIntervalMs)

    return () => window.clearInterval(timer)
  }, [character.id, animationKey, animation])

  useEffect(() => {
    window.localStorage.setItem(PET_SIZE_STORAGE_KEY, petSizeId)
    window.petWindow.setWindowScale(getPetSizeMultiplier(petSizeId))
  }, [petSizeId])

  useEffect(() => {
    window.petWindow.syncState({
      isStudying,
      todayTotalSeconds,
      selectedCharacterId,
      petSizeId,
    })
  }, [isStudying, todayTotalSeconds, selectedCharacterId, petSizeId])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return

    event.currentTarget.setPointerCapture(event.pointerId)
    pointerStart.current = {
      pointerId: event.pointerId,
      screenX: event.screenX,
      screenY: event.screenY,
      dragged: false,
    }
    window.petWindow.startDrag(event.screenX, event.screenY)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    if (!start || start.pointerId !== event.pointerId) return

    if (
      Math.hypot(event.screenX - start.screenX, event.screenY - start.screenY) >=
      DRAG_THRESHOLD
    ) {
      start.dragged = true
      setIsMenuOpen(false)
    }

    if (start.dragged) window.petWindow.moveDrag(event.screenX, event.screenY)
  }

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    if (!start || start.pointerId !== event.pointerId) return

    window.petWindow.endDrag()
    pointerStart.current = null
    if (!start.dragged) setIsMenuOpen((isOpen) => !isOpen)
  }

  const cancelPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStart.current?.pointerId !== event.pointerId) return

    window.petWindow.endDrag()
    pointerStart.current = null
  }

  const handleCharacterKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    setIsMenuOpen((isOpen) => !isOpen)
  }

  const startStudying = () => {
    if (celebrateTimeout.current !== null) {
      window.clearTimeout(celebrateTimeout.current)
      celebrateTimeout.current = null
    }
    setElapsedSeconds(0)
    setIsStudying(true)
    setIsMenuOpen(false)
    setPetAnimation('studying')
  }

  const stopStudying = () => {
    setIsStudying(false)
    setElapsedSeconds(0)
    setIsMenuOpen(false)
    setTodayStudySeconds((seconds) => {
      const next = seconds + elapsedSeconds
      saveTodayStudySeconds(next)
      return next
    })
    setPetAnimation('celebrating')
    celebrateTimeout.current = window.setTimeout(() => {
      setPetAnimation('idle')
      celebrateTimeout.current = null
    }, CELEBRATE_DURATION_MS)
  }

  const selectCharacter = (id: string) => {
    setSelectedCharacterId(id)
    window.localStorage.setItem(CHARACTER_STORAGE_KEY, id)
  }

  const latestHandlers = useRef({ isStudying, startStudying, stopStudying, selectCharacter, setPetSizeId })

  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs every render to keep the ref current
  useEffect(() => {
    latestHandlers.current = { isStudying, startStudying, stopStudying, selectCharacter, setPetSizeId }
  })

  useEffect(() => {
    return window.petWindow.onTrayCommand((command) => {
      const handlers = latestHandlers.current
      if (command.type === 'toggle-studying') {
        if (handlers.isStudying) handlers.stopStudying()
        else handlers.startStudying()
      } else if (command.type === 'select-character') {
        handlers.selectCharacter(command.id)
      } else if (command.type === 'set-pet-size') {
        handlers.setPetSizeId(command.id)
      }
    })
  }, [])

  return (
    <main className="pet" aria-label={`StudyMimi, ${isStudying ? 'Studying' : 'Resting'}`}>
      {isMenuOpen && (
        <div className="pet__menu">
          <button type="button" onClick={isStudying ? stopStudying : startStudying}>
            {isStudying ? 'Stop Studying' : 'Start Studying'}
          </button>
        </div>
      )}

      <div
        className="pet__character"
        style={petStyle}
        aria-label="Open StudyMimi menu"
        role="button"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={cancelPointer}
        onKeyDown={handleCharacterKeyDown}
      />

      <div className="pet__status" aria-live="polite">
        <span>{isStudying ? 'Studying' : 'Resting'}</span>
        {isStudying && <time>{formatTime(elapsedSeconds)}</time>}
      </div>
    </main>
  )
}

export default App
