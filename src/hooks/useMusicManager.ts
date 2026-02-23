import { useRef, useEffect, useCallback } from 'react'
import { Howl } from 'howler'

const TRACKS = {
  level1_normal: '/audio/music/level1_normal.mp3',
  level1_danger: '/audio/music/level1_danger.mp3',
  level2_normal: '/audio/music/level2_normal.mp3',
  level2_danger: '/audio/music/level2_danger.mp3',
  level3_normal: '/audio/music/level3_normal.mp3',
  level3_danger: '/audio/music/level3_danger.mp3',
  level4_normal: '/audio/music/level4_normal.mp3',
  level4_danger: '/audio/music/level4_danger.mp3',
} as const
type TrackKey = keyof typeof TRACKS

const NORMAL_VOL    = 0.5
const DANGER_VOL    = 0.6
const DUCK_VOL      = 0.2
const CROSSFADE_MS  = 1500
const STOP_FADE_MS  = 2000
const TOGGLE_FADE_MS = 500

function resolveKey(level: 1|2|3|4|5, isLastLife: boolean): TrackKey {
  const l = Math.min(level, 4) as 1|2|3|4
  return `level${l}_${isLastLife ? 'danger' : 'normal'}` as TrackKey
}

export function useMusicManager(soundEnabled: boolean) {
  const howlsRef   = useRef<Partial<Record<TrackKey, Howl>>>({})
  const currentKey = useRef<TrackKey | null>(null)
  const targetVol  = useRef(NORMAL_VOL)
  const isDucked   = useRef(false)
  const isActive   = useRef(false)  // true once play() called

  // Init all 8 tracks once on mount, never re-init
  useEffect(() => {
    const howls: Partial<Record<TrackKey, Howl>> = {}
    for (const [key, src] of Object.entries(TRACKS) as [TrackKey, string][]) {
      howls[key] = new Howl({
        src: [src], loop: true, volume: 0, preload: true,
        onloaderror: (_id: number, err: unknown) =>
          console.warn(`[Music] Failed to load ${src}:`, err),
      })
    }
    howlsRef.current = howls
    return () => { Object.values(howlsRef.current).forEach(h => h?.unload()) }
  }, [])

  // React immediately to soundEnabled toggle
  useEffect(() => {
    if (!isActive.current) return
    const key = currentKey.current
    const howl = key ? howlsRef.current[key] : undefined
    if (!howl) return
    if (soundEnabled) {
      howl.fade(howl.volume(), isDucked.current ? DUCK_VOL : targetVol.current, TOGGLE_FADE_MS)
    } else {
      howl.fade(howl.volume(), 0, TOGGLE_FADE_MS)
    }
  }, [soundEnabled])

  const crossfadeTo = useCallback((newKey: TrackKey, vol: number) => {
    const prev = currentKey.current
    // Fade out old track
    if (prev && prev !== newKey && howlsRef.current[prev]) {
      const h = howlsRef.current[prev]!
      h.fade(h.volume(), 0, CROSSFADE_MS)
      setTimeout(() => h.stop(), CROSSFADE_MS + 100)
    }
    // Fade in new track
    const next = howlsRef.current[newKey]
    if (next) {
      const resolvedVol = soundEnabled ? (isDucked.current ? DUCK_VOL : vol) : 0
      if (!next.playing()) { next.volume(0); next.play() }
      next.fade(next.volume(), resolvedVol, CROSSFADE_MS)
    }
    currentKey.current = newKey
    targetVol.current = vol
  }, [soundEnabled])

  const setMusicState = useCallback((level: 1|2|3|4|5, isLastLife: boolean) => {
    crossfadeTo(resolveKey(level, isLastLife), isLastLife ? DANGER_VOL : NORMAL_VOL)
    isActive.current = true
  }, [crossfadeTo])

  const play = useCallback(() => setMusicState(1, false), [setMusicState])

  const stop = useCallback((fadeDuration = STOP_FADE_MS) => {
    const key = currentKey.current
    const howl = key ? howlsRef.current[key] : undefined
    if (!howl) return
    howl.fade(howl.volume(), 0, fadeDuration)
    setTimeout(() => { howl.stop(); isActive.current = false }, fadeDuration + 100)
    currentKey.current = null
  }, [])

  const duck = useCallback(() => {
    const howl = currentKey.current ? howlsRef.current[currentKey.current] : undefined
    if (!howl || !soundEnabled) return
    howl.fade(howl.volume(), DUCK_VOL, 500)
    isDucked.current = true
  }, [soundEnabled])

  const unduck = useCallback(() => {
    const howl = currentKey.current ? howlsRef.current[currentKey.current] : undefined
    if (!howl) return
    howl.fade(howl.volume(), soundEnabled ? targetVol.current : 0, 500)
    isDucked.current = false
  }, [soundEnabled])

  return { setMusicState, play, stop, duck, unduck }
}
