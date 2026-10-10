export const events = new EventTarget()
export function emit(name: string) { events.dispatchEvent(new Event(name)) }
export type Input = 'up' | 'down' | 'left' | 'right' | 'a' | 'b'
export let held: Input | null = null
export function setHeld(value: Input | null) { held = value }
export function press(value: Input) { events.dispatchEvent(new CustomEvent('input', { detail: value })) }
