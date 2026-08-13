import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import FriendPet from './FriendPet.tsx'
import { DEMO_FRIENDS } from './friends.ts'

const isFriendWindow = window.location.hash === '#friend'
const friend = DEMO_FRIENDS[0]

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isFriendWindow && friend ? <FriendPet friend={friend} /> : <App />}</StrictMode>,
)
