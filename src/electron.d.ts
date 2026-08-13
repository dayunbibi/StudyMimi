export {}

type TrayCommand =
  | { type: 'toggle-studying' }
  | { type: 'select-character'; id: string }
  | { type: 'set-pet-size'; id: string }

type RoamPhase = 'paused' | 'walking'
type RoamDirection = 'left' | 'right'

declare global {
  interface Window {
    petWindow: {
      startDrag: (screenX: number, screenY: number) => void
      moveDrag: (screenX: number, screenY: number) => void
      endDrag: () => void
      setWindowScale: (multiplier: number) => void
      syncState: (state: {
        isStudying: boolean
        todayTotalSeconds: number
        selectedCharacterId: string
        petSizeId: string
      }) => void
      onTrayCommand: (callback: (command: TrayCommand) => void) => () => void
      onRoamPhase: (callback: (phase: RoamPhase) => void) => () => void
      onRoamDirection: (callback: (direction: RoamDirection) => void) => () => void
    }
  }
}
