import { useEffect, useRef, useState } from 'react'
import { useGameState } from './useGameState'
import { supabase } from '../utils/supabase'
import { getCupThresholdForLevel, STARTING_LIVES } from '../data/gameConfig'
import type { SaboIngredient } from '../utils/saboConfig'

interface UsePartyGameOpts {
  roomCode: string
  deviceId: string
  winTarget: number
  startLevel: number
}

interface ActiveSabo { ingredient: SaboIngredient; turnsLeft: number }

export interface SaboEvent {
  id: number
  room_code: string
  from_device_id: string
  from_name: string
  to_device_id: string
  to_name: string
  ingredient: string
  created_at: string
}

export function usePartyGame({ roomCode, deviceId, winTarget, startLevel }: UsePartyGameOpts) {
  const game = useGameState({ versusMode: true })

  const startCupThreshold = startLevel > 1 ? getCupThresholdForLevel(startLevel) : 0
  const prevCupNumber = useRef(startCupThreshold)
  const winDeclared = useRef(false)

  const [activeSabos, setActiveSabos] = useState<ActiveSabo[]>([])
  const [latestSabo, setLatestSabo] = useState<SaboEvent | null>(null)

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

  // Sync lives_lost on every life change — covers players who drop lives without
  // ever serving a correct drink (the cupNumber effect above never fires for them).
  useEffect(() => {
    if (game.phase === 'idle') return
    const startLivesCount = startLevel > 1 ? STARTING_LIVES + 1 : STARTING_LIVES
    const livesLost = Math.max(0, startLivesCount - game.lives)
    supabase
      .from('room_players')
      .update({ lives_lost: livesLost })
      .eq('room_code', roomCode)
      .eq('device_id', deviceId)
      .then(({ error }) => {
        if (error) console.error('[Party] Failed to sync lives_lost:', error)
      })
  }, [game.lives, game.phase, roomCode, deviceId, startLevel])

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

  // sabo_events subscription
  useEffect(() => {
    const saboChannel = supabase
      .channel(`party-sabos:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sabo_events',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          const ev = payload.new as SaboEvent
          setLatestSabo(ev)
          if (ev.to_device_id === deviceId) {
            setActiveSabos(prev => [
              ...prev,
              { ingredient: ev.ingredient as SaboIngredient, turnsLeft: 5 },
            ])
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(saboChannel) }
  }, [roomCode, deviceId])

  // Sabo turn countdown — decrement when a new order begins (transition→playing)
  const prevPhaseRef = useRef(game.phase)
  useEffect(() => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = game.phase
    if (game.phase !== 'playing' || prev === 'idle' || prev === 'playing') return

    setActiveSabos(current => {
      const next = current
        .map(s => ({ ...s, turnsLeft: s.turnsLeft - 1 }))
        .filter(s => s.turnsLeft > 0)
      const stillBlocked = next.map(s => s.ingredient)
      supabase
        .from('room_players')
        .update({ blocked_ingredients: stillBlocked })
        .eq('room_code', roomCode)
        .eq('device_id', deviceId)
        .then()
      return next
    })
  }, [game.phase, roomCode, deviceId])

  const blockedIngredients = activeSabos.map(s => s.ingredient) as SaboIngredient[]

  return { ...game, blockedIngredients, latestSabo }
}
