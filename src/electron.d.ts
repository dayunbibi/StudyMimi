export {}

declare global {
  interface Window {
    petWindow: {
      startDrag: (screenX: number, screenY: number) => void
      moveDrag: (screenX: number, screenY: number) => void
      endDrag: () => void
      setExpanded: (expanded: boolean) => void
    }
  }
}
