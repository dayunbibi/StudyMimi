export type FriendStatus = 'idle' | 'studying' | 'tired'

export type FriendMimi = {
  id: string
  name: string
  characterId: string
  status: FriendStatus
}

// Local-only stand-in for a future real friend system. No network involved.
export const DEMO_FRIENDS: FriendMimi[] = [{ id: 'alex', name: 'Alex', characterId: 'pet7', status: 'studying' }]
