import { useCallback, useRef, useEffect } from 'react'
import { loadSettings } from '../pages/Settings'

// Generate short audio data URLs using Web Audio API for synthetic sounds
function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  } catch {
    return null
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.value = volume
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

export function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    // Create on first user interaction
    const initAudio = () => {
      if (!ctxRef.current) {
        ctxRef.current = createAudioContext()
      }
      window.removeEventListener('click', initAudio)
      window.removeEventListener('keydown', initAudio)
    }
    window.addEventListener('click', initAudio)
    window.addEventListener('keydown', initAudio)
    return () => {
      window.removeEventListener('click', initAudio)
      window.removeEventListener('keydown', initAudio)
    }
  }, [])

  const isEnabled = useCallback(() => {
    return loadSettings().soundEnabled
  }, [])

  const playClick = useCallback(() => {
    if (!isEnabled() || !ctxRef.current) return
    playTone(ctxRef.current, 800, 0.08, 'square', 0.15)
  }, [isEnabled])

  const playServeSuccess = useCallback(() => {
    if (!isEnabled() || !ctxRef.current) return
    const ctx = ctxRef.current
    // Happy ding - two ascending tones
    playTone(ctx, 523, 0.15, 'sine', 0.3)
    setTimeout(() => playTone(ctx, 659, 0.2, 'sine', 0.3), 100)
    setTimeout(() => playTone(ctx, 784, 0.3, 'sine', 0.25), 200)
  }, [isEnabled])

  const playServeFail = useCallback(() => {
    if (!isEnabled() || !ctxRef.current) return
    const ctx = ctxRef.current
    // Buzzer - low harsh tone
    playTone(ctx, 150, 0.3, 'sawtooth', 0.25)
    playTone(ctx, 155, 0.3, 'sawtooth', 0.2)
  }, [isEnabled])

  const playGameOver = useCallback(() => {
    if (!isEnabled() || !ctxRef.current) return
    const ctx = ctxRef.current
    // Descending sad tones
    playTone(ctx, 440, 0.25, 'sine', 0.3)
    setTimeout(() => playTone(ctx, 370, 0.25, 'sine', 0.3), 200)
    setTimeout(() => playTone(ctx, 311, 0.25, 'sine', 0.3), 400)
    setTimeout(() => playTone(ctx, 262, 0.5, 'sine', 0.25), 600)
  }, [isEnabled])

  return {
    playClick,
    playServeSuccess,
    playServeFail,
    playGameOver,
  }
}
