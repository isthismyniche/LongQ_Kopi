import { useState, useRef, useCallback, useEffect } from 'react'

interface UseTimerOptions {
  duration: number
  onTimeout: () => void
}

export function useTimer({ duration, onTimeout }: UseTimerOptions) {
  const [secondsRemaining, setSecondsRemaining] = useState(duration)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef(0)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
    clearTimer()
  }, [clearTimer])

  const start = useCallback((overrideDuration?: number) => {
    stop()
    const d = overrideDuration ?? duration
    const endTime = Date.now() + d * 1000
    endTimeRef.current = endTime
    setSecondsRemaining(d)
    setIsRunning(true)
  }, [duration, stop])

  const pause = useCallback(() => {
    if (!isRunning) return
    clearTimer()
    setIsRunning(false)
    // secondsRemaining is already up to date from the interval
  }, [isRunning, clearTimer])

  const resume = useCallback(() => {
    if (isRunning) return
    if (secondsRemaining <= 0) return
    const endTime = Date.now() + secondsRemaining * 1000
    endTimeRef.current = endTime
    setIsRunning(true)
  }, [isRunning, secondsRemaining])

  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, (endTimeRef.current - Date.now()) / 1000)
      setSecondsRemaining(remaining)

      if (remaining <= 0) {
        stop()
        onTimeoutRef.current()
      }
    }, 50)

    return () => clearTimer()
  }, [isRunning, stop, clearTimer])

  return { secondsRemaining, isRunning, start, stop, pause, resume }
}
