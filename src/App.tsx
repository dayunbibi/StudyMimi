import { useEffect, useRef, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import './App.css'

const DRAG_THRESHOLD = 5

type PointerStart = {
  pointerId: number
  screenX: number
  screenY: number
  dragged: boolean
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

function App() {
  const [isStudying, setIsStudying] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const pointerStart = useRef<PointerStart | null>(null)

  useEffect(() => {
    if (!isStudying) return

    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 250)

    return () => window.clearInterval(timer)
  }, [isStudying])

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
    setElapsedSeconds(0)
    setIsStudying(true)
    setIsMenuOpen(false)
  }

  const stopStudying = () => {
    setIsStudying(false)
    setElapsedSeconds(0)
    setIsMenuOpen(false)
  }

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
