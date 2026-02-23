import { useState, useEffect, useCallback } from 'react'
import PageWrapper from '../components/ui/PageWrapper'
import BackButton from '../components/ui/BackButton'
import Toggle from '../components/ui/Toggle'
import {
  DEFAULT_SHORTCUTS,
  loadShortcuts,
  saveShortcuts,
  formatKeyDisplay,
  type ShortcutEntry,
  type GameAction,
} from '../data/keyboardShortcuts'

const SETTINGS_KEY = 'longq_kopi_settings'

interface GameSettings {
  soundEnabled: boolean
  keyboardShortcutsEnabled: boolean
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  keyboardShortcutsEnabled: true,
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: GameSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export default function Settings() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [shortcuts, setShortcuts] = useState<ShortcutEntry[]>(DEFAULT_SHORTCUTS)
  const [listeningAction, setListeningAction] = useState<GameAction | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  useEffect(() => {
    setSettings(loadSettings())
    setShortcuts(loadShortcuts())
  }, [])

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveSettings(updated)
  }

  const startListening = useCallback((action: GameAction) => {
    setListeningAction(action)
    setDuplicateWarning(null)
  }, [])

  useEffect(() => {
    if (!listeningAction) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      const key = e.key

      // Check for duplicates
      const existing = shortcuts.find(s => s.key === key && s.action !== listeningAction)
      if (existing) {
        setDuplicateWarning(`"${formatKeyDisplay(key)}" is already assigned to ${existing.label}`)
        return
      }

      const updated = shortcuts.map(s =>
        s.action === listeningAction ? { ...s, key } : s
      )
      setShortcuts(updated)
      saveShortcuts(updated)
      setListeningAction(null)
      setDuplicateWarning(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [listeningAction, shortcuts])

  const resetToDefaults = useCallback(() => {
    const defaults = DEFAULT_SHORTCUTS.map(s => ({ ...s }))
    setShortcuts(defaults)
    saveShortcuts(defaults)
    setListeningAction(null)
    setDuplicateWarning(null)
  }, [])

  return (
    <PageWrapper className="flex flex-col h-full bg-cream">
      <div className="p-4 flex-shrink-0">
        <BackButton />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <h1 className="font-display text-3xl font-bold text-kopi-brown mb-8 text-center">
          Settings
        </h1>

        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <Toggle
              label="Sound Effects"
              checked={settings.soundEnabled}
              onChange={(v) => updateSetting('soundEnabled', v)}
            />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <Toggle
              label="Keyboard Shortcuts"
              checked={settings.keyboardShortcutsEnabled}
              onChange={(v) => updateSetting('keyboardShortcutsEnabled', v)}
            />
          </div>

          {/* Keyboard shortcut remapping */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-kopi-brown">Keyboard Shortcuts</h3>
              <button
                onClick={resetToDefaults}
                className="text-xs px-3 py-1 rounded-lg bg-kopi-brown/10 hover:bg-kopi-brown/20
                  text-kopi-brown font-semibold cursor-pointer transition-colors"
              >
                Reset to defaults
              </button>
            </div>

            {duplicateWarning && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-hawker-red/10 text-hawker-red text-sm font-semibold">
                {duplicateWarning}
              </div>
            )}

            <div className="space-y-1">
              {shortcuts.map((shortcut) => (
                <button
                  key={shortcut.action}
                  onClick={() => startListening(shortcut.action)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg
                    transition-colors cursor-pointer text-left
                    ${listeningAction === shortcut.action
                      ? 'bg-warm-yellow/30 ring-2 ring-warm-yellow'
                      : 'hover:bg-cream'
                    }`}
                >
                  <span className="text-sm font-semibold text-kopi-brown">{shortcut.label}</span>
                  <span className={`px-2.5 py-0.5 rounded font-mono text-xs min-w-[48px] text-center
                    ${listeningAction === shortcut.action
                      ? 'bg-warm-yellow text-kopi-brown animate-pulse'
                      : 'bg-cream text-kopi-brown/70'
                    }`}
                  >
                    {listeningAction === shortcut.action
                      ? 'Press key…'
                      : formatKeyDisplay(shortcut.key)
                    }
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
