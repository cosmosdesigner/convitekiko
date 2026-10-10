export type Progress = {
  chapter: number
  forest: boolean
  bridge: boolean
  battle: boolean
  invitation: boolean
  pikachuJoined: boolean
  symbols: number[]
  generators: boolean[]
  mistakes: number
  magikarp: boolean
  ballFound: boolean
  ballReturned: boolean
  eeveeCaught: boolean
  song: boolean
  potions: number
}

const key = 'francisco-missao-v1'
export const initial = (): Progress => ({ chapter: 0, forest: false, bridge: false, battle: false, invitation: false, pikachuJoined: false, symbols: [], generators: [true, false, false], mistakes: 0, magikarp: false, ballFound: false, ballReturned: false, eeveeCaught: false, song: false, potions: 1 })
export function load(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}')
    const base = initial()
    return { ...base, ...value, symbols: Array.isArray(value.symbols) ? value.symbols : [], generators: Array.isArray(value.generators) && value.generators.length === 3 ? value.generators : base.generators }
  } catch { return initial() }
}
export function save(progress: Progress) { localStorage.setItem(key, JSON.stringify(progress)) }
export function reset() { localStorage.removeItem(key) }
