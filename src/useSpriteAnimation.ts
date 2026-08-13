import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { CharacterConfig } from './characters'

const FRAME_SIZE = 128

export function useSpriteAnimation(
  character: CharacterConfig,
  animationKey: keyof CharacterConfig['animations'],
  extraScale = 1,
  facing: 'left' | 'right' = 'right',
): CSSProperties {
  const [frameIndex, setFrameIndex] = useState(0)
  const animation = character.animations[animationKey]

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || animation.frames.length <= 1) return

    const timer = window.setInterval(() => {
      setFrameIndex((index) => (index + 1) % animation.frames.length)
    }, animation.frameIntervalMs)

    return () => window.clearInterval(timer)
  }, [character.id, animationKey, animation])

  const frame = animation.frames[frameIndex % animation.frames.length]

  return {
    backgroundImage: `url('${character.file}')`,
    backgroundSize: `${character.sheetWidth}px ${character.sheetHeight}px`,
    backgroundPosition: `-${frame.col * FRAME_SIZE}px -${frame.row * FRAME_SIZE}px`,
    transform: `scale(${character.sizeScale * extraScale}) scaleX(${facing === 'left' ? -1 : 1})`,
  }
}
