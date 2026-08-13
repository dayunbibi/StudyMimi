import { useEffect, useState } from 'react'
import { getCharacterById } from './characters'
import { useSpriteAnimation } from './useSpriteAnimation'
import type { FriendMimi } from './friends'
import './FriendPet.css'

const APPEAR_DELAY_MS = 1400

const STATUS_LABEL: Record<FriendMimi['status'], string> = {
  idle: 'Resting',
  studying: 'Studying',
  tired: 'Tired',
}

function FriendPet({ friend }: { friend: FriendMimi }) {
  const [visible, setVisible] = useState(false)
  const [roamPhase, setRoamPhase] = useState<'paused' | 'walking'>('paused')
  const character = getCharacterById(friend.characterId)
  const animationKey = friend.status === 'idle' && roamPhase === 'walking' ? 'celebrating' : friend.status
  const petStyle = useSpriteAnimation(character, animationKey)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), APPEAR_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => window.petWindow.onRoamPhase(setRoamPhase), [])

  return (
    <main
      className={visible ? 'friend-pet friend-pet--visible' : 'friend-pet'}
      aria-label={`${friend.name}, ${STATUS_LABEL[friend.status]}`}
    >
      <div className="friend-pet__character" style={petStyle} />
      <span className="friend-pet__name">{friend.name}</span>
    </main>
  )
}

export default FriendPet
