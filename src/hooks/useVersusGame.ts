import { useEffect, useRef } from 'react'
import { useGameState } from './useGameState'
import { supabase } from '../utils/supabase'
import { getCupThresholdForLevel } from '../data/gameConfig'

interface UseVersusGameOpts {
  roomCode: string
  role: 'host' | 'guest'
  winTarget: number
  startLevel: number
}

export function useVersusGame({ roomCode, role, winTarget, startLevel }: UseVersusGameOpts) {
  const game = useGameState({ versusMode: true })

  // cupNumber starts at the level threshold (e.g. level 3 starts at cup 10).
  // We track drinks *relative* to that threshold so the win condition is always
  // "N drinks served this game", not an absolute cup count.
  const startCupThreshold = startLevel > 1 ? getCupThresholdForLevel(startLevel) : 0
  const prevCupNumber = useRef(startCupThreshold)
  const winDeclared = useRef(false)

  // Sync drinks count to Supabase on each correct serve
  useEffect(() => {
    if (game.cupNumber <= prevCupNumber.current) return
    prevCupNumber.current = game.cupNumber

    const drinksThisGame = game.cupNumber - startCupThreshold
    const col = role === 'host' ? 'host_drinks' : 'guest_drinks'
    supabase
      .from('game_rooms')
      .update({ [col]: drinksThisGame })
      .eq('room_code', roomCode)
      .then(({ error }) => {
        if (error) console.error('[Versus] Failed to sync drinks:', error)
      })

    // Declare win when we hit the target
    if (drinksThisGame >= winTarget && !winDeclared.current) {
      winDeclared.current = true
      fetch('/api/versus/declare-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, role }),
      }).catch(err => console.error('[Versus] declare-winner failed:', err))
    }
  }, [game.cupNumber, roomCode, role, winTarget, startCupThreshold])

  // Auto-acknowledge errors after 2s — no error modal in versus mode
  useEffect(() => {
    if (game.phase !== 'errorAck') return
    const t = setTimeout(() => game.acknowledgeError(), 2000)
    return () => clearTimeout(t)
  }, [game.phase, game.acknowledgeError])

  // Disconnect beacon — fires on tab hide, clears on tab show
  useEffect(() => {
    const handleVisibilityChange = () => {
      const action = document.visibilityState === 'hidden' ? 'disconnect' : 'reconnect'
      const body = JSON.stringify({ roomCode, role, action })
      if (document.visibilityState === 'hidden') {
        navigator.sendBeacon(
          '/api/versus/disconnect',
          new Blob([body], { type: 'application/json' })
        )
      } else {
        fetch('/api/versus/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }).catch(() => { /* reconnect failures are non-critical */ })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [roomCode, role])

  // Reset tracking refs when game restarts (rematch)
  useEffect(() => {
    if (game.phase === 'playing' && game.cupNumber <= startCupThreshold) {
      winDeclared.current = false
      prevCupNumber.current = startCupThreshold
    }
  }, [game.phase, game.cupNumber, startCupThreshold])

  return game
}
