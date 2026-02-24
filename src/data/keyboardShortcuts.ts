export type GameAction =
  | 'kopi'
  | 'teh'
  | 'lessBase'
  | 'condensedMilk'
  | 'lessCondensed'
  | 'evaporatedMilk'
  | 'sugar'
  | 'lessSugar'
  | 'ice'
  | 'hotWater'
  | 'discard'
  | 'serve'

export interface ShortcutEntry {
  action: GameAction
  label: string
  key: string
}

export const DEFAULT_SHORTCUTS: ShortcutEntry[] = [
  { action: 'kopi', label: 'Kopi', key: 'a' },
  { action: 'teh', label: 'Teh', key: 's' },
  { action: 'lessBase', label: 'Less (Kopi/Teh)', key: 'd' },
  { action: 'condensedMilk', label: 'Condensed Milk', key: 'j' },
  { action: 'lessCondensed', label: 'Less (Condensed)', key: 'h' },
  { action: 'evaporatedMilk', label: 'Evaporated Milk', key: 'k' },
  { action: 'sugar', label: 'Sugar', key: 'l' },
  { action: 'lessSugar', label: 'Less (Sugar)', key: ';' },
  { action: 'ice', label: 'Ice', key: 'i' },
  { action: 'hotWater', label: 'Hot Water', key: ' ' },
  { action: 'discard', label: 'Discard', key: 'g' },
  { action: 'serve', label: 'Serve', key: 'Enter' },
]

const SHORTCUTS_KEY = 'longq_kopi_shortcuts'

export function loadShortcuts(): ShortcutEntry[] {
  try {
    const raw = localStorage.getItem(SHORTCUTS_KEY)
    if (!raw) return DEFAULT_SHORTCUTS.map(s => ({ ...s }))
    const saved: ShortcutEntry[] = JSON.parse(raw)
    // Merge with defaults to pick up any new actions
    return DEFAULT_SHORTCUTS.map(def => {
      const saved_entry = saved.find(s => s.action === def.action)
      return saved_entry ? { ...def, key: saved_entry.key } : { ...def }
    })
  } catch {
    return DEFAULT_SHORTCUTS.map(s => ({ ...s }))
  }
}

export function saveShortcuts(shortcuts: ShortcutEntry[]): void {
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts))
}

export function getShortcutKey(shortcuts: ShortcutEntry[], action: GameAction): string {
  return shortcuts.find(s => s.action === action)?.key ?? ''
}

export function formatKeyDisplay(key: string): string {
  if (key === ' ') return 'Space'
  if (key === 'Enter') return 'Enter'
  if (key.length === 1) return key.toUpperCase()
  return key
}
