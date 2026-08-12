export type SpriteFrame = { row: number; col: number }

export type CharacterAnimation = {
  frames: SpriteFrame[]
  frameIntervalMs: number
}

export type CharacterConfig = {
  id: string
  name: string
  file: string
  sheetWidth: number
  sheetHeight: number
  animations: {
    idle: CharacterAnimation
    studying: CharacterAnimation
    celebrating: CharacterAnimation
    tired: CharacterAnimation
  }
}

function frameRow(row: number, count: number): SpriteFrame[] {
  return Array.from({ length: count }, (_, col) => ({ row, col }))
}

export const CHARACTERS: CharacterConfig[] = [
  {
    id: 'pet1',
    name: 'Biscuit',
    file: '/characters/pet1.png',
    sheetWidth: 512,
    sheetHeight: 1408,
    animations: {
      idle: { frames: [...frameRow(0, 2), ...frameRow(1, 2)], frameIntervalMs: 375 },
      celebrating: { frames: frameRow(4, 4), frameIntervalMs: 150 },
      studying: { frames: frameRow(7, 4), frameIntervalMs: 500 },
      tired: { frames: frameRow(9, 2), frameIntervalMs: 700 },
    },
  },
  {
    id: 'pet3',
    name: 'Waffle',
    file: '/characters/pet3.png',
    sheetWidth: 512,
    sheetHeight: 1152,
    animations: {
      idle: { frames: frameRow(0, 4), frameIntervalMs: 375 },
      celebrating: { frames: frameRow(3, 4), frameIntervalMs: 150 },
      studying: { frames: frameRow(6, 4), frameIntervalMs: 500 },
      tired: { frames: frameRow(7, 2), frameIntervalMs: 700 },
    },
  },
  {
    id: 'pet3_1',
    name: 'Praline',
    file: '/characters/pet3_1.png',
    sheetWidth: 512,
    sheetHeight: 1152,
    animations: {
      idle: { frames: frameRow(0, 4), frameIntervalMs: 375 },
      celebrating: { frames: frameRow(3, 4), frameIntervalMs: 150 },
      studying: { frames: frameRow(6, 4), frameIntervalMs: 500 },
      tired: { frames: frameRow(7, 2), frameIntervalMs: 700 },
    },
  },
  {
    id: 'pet4',
    name: 'Marble',
    file: '/characters/pet4.png',
    sheetWidth: 512,
    sheetHeight: 1280,
    animations: {
      idle: { frames: frameRow(0, 4), frameIntervalMs: 375 },
      celebrating: { frames: frameRow(4, 4), frameIntervalMs: 150 },
      studying: { frames: frameRow(6, 4), frameIntervalMs: 500 },
      tired: { frames: frameRow(8, 2), frameIntervalMs: 700 },
    },
  },
  {
    id: 'pet4_1',
    name: 'Clover',
    file: '/characters/pet4_1.png',
    sheetWidth: 512,
    sheetHeight: 1280,
    animations: {
      idle: { frames: frameRow(0, 4), frameIntervalMs: 375 },
      celebrating: { frames: frameRow(4, 4), frameIntervalMs: 150 },
      studying: { frames: frameRow(6, 4), frameIntervalMs: 500 },
      tired: { frames: frameRow(8, 2), frameIntervalMs: 700 },
    },
  },
  {
    id: 'pet5',
    name: 'Sugar',
    file: '/characters/pet5.png',
    sheetWidth: 512,
    sheetHeight: 1280,
    animations: {
      idle: { frames: frameRow(0, 4), frameIntervalMs: 375 },
      celebrating: { frames: frameRow(4, 4), frameIntervalMs: 150 },
      studying: { frames: frameRow(6, 4), frameIntervalMs: 500 },
      tired: { frames: frameRow(8, 2), frameIntervalMs: 700 },
    },
  },
  {
    id: 'pet6',
    name: 'Peanut',
    file: '/characters/pet6.png',
    sheetWidth: 512,
    sheetHeight: 1024,
    animations: {
      idle: { frames: frameRow(0, 4), frameIntervalMs: 375 },
      celebrating: { frames: frameRow(3, 4), frameIntervalMs: 150 },
      studying: { frames: frameRow(5, 4), frameIntervalMs: 500 },
      tired: { frames: frameRow(7, 2), frameIntervalMs: 700 },
    },
  },
  {
    id: 'pet7',
    name: 'Choco',
    file: '/characters/pet7.png',
    sheetWidth: 512,
    sheetHeight: 896,
    animations: {
      idle: { frames: frameRow(0, 4), frameIntervalMs: 375 },
      celebrating: { frames: frameRow(3, 4), frameIntervalMs: 150 },
      studying: { frames: frameRow(4, 4), frameIntervalMs: 500 },
      tired: { frames: frameRow(6, 2), frameIntervalMs: 700 },
    },
  },
]

export const DEFAULT_CHARACTER_ID = 'pet1'

export function getCharacterById(id: string): CharacterConfig {
  return CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[0]
}
