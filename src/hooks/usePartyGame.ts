import { useEffect, useRef } from 'react'
import { useGameState } from './useGameState'
import { supabase } from '../utils/supabase'
import { getCupThresholdForLevel, STARTING_LIVES } from '../data/gameConfig'

interface UsePartyGameOpts {
  roomCode: string
  deviceId: string
  winTarget: number
  startLevel: number
}

export function usePartyGame({ roomCode, deviceId, winTarget, startLevel }: UsePartyGameOpts) {
  const game = useGameState({ versusMode: true })

  const startCupThreshold = startLevel > 1 ? getCupThresholdForLevel(startLevel) : 0
  const prevCupNumber = useRef(startCupThreshold)
  const winDeclared = useRef(false)

  // Sync drinks count to room_players on each correct serve
  useEffect(() => {
    if (game.cupNumber <= prevCupNumber.current) return
    prevCupNumber.current = game.cupNumber

    const drinksThisGame = game.cupNumber - startCupThreshold
    const startLivesCount = startLevel > 1 ? STARTING_LIVES + 1 : STARTING_LIVES
    const livesLost = Math.max(0, startLivesCount - game.lives)
    // game.avgTime = totalTimeUsed / cupNumber (absolute). Recover totalTimeUsed then
    // divide by drinksThisGame so starting at L3 doesn't skew the denominator.
    const totalTimeMs = game.avgTime * game.cupNumber * 1000
    const avgTimeMs = drinksThisGame > 0 ? Math.round(totalTimeMs / drinksThisGame) : 0

    supabase
      .from('room_players')
      .update({ drinks: drinksThisGame, lives_lost: livesLost, avg_time_ms: avgTimeMs })
      .eq('room_code', roomCode)
      .eq('device_id', deviceId)
      .then(({ error }) => {
        if (error) console.error('[Party] Failed to sync drinks:', error)
      })

    // Declare win when we hit the target
    if (drinksThisGame >= winTarget && !winDeclared.current) {
      winDeclared.current = true
      fetch('/api/party/declare-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, deviceId }),
      }).catch(err => console.error('[Party] declare-winner failed:', err))
    }
  }, [game.cupNumber, roomCode, deviceId, winTarget, startCupThreshold])

  // Auto-acknowledge errors after 2s — no error modal in party mode
  useEffect(() => {
    if (game.phase !== 'errorAck') return
    const t = setTimeout(() => game.acknowledgeError(), 2000)
    return () => clearTimeout(t)
  }, [game.phase, game.acknowledgeError])

  // Disconnect beacon — fires on tab hide (no reconnect mid-game)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return
      const body = JSON.stringify({ roomCode, deviceId, action: 'disconnect' })
      navigator.sendBeacon(
        '/api/party/disconnect',
        new Blob([body], { type: 'application/json' })
      )
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [roomCode, deviceId])

  return game
}
