import { useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabase'

export interface GameRoom {
  room_code: string
  host_device_id: string
  guest_device_id: string | null
  host_drinks: number
  guest_drinks: number
  win_target: number
  start_level: number
  winner: 'host' | 'guest' | null
  status: 'waiting' | 'playing' | 'finished'
  host_disconnected_at: string | null
  guest_disconnected_at: string | null
}

export interface UseVersusRoomResult {
  room: GameRoom | null
  myDrinks: number
  opponentDrinks: number
  isWinner: boolean
  isLoser: boolean
  opponentDisconnectedAt: string | null
  loading: boolean
}

export function useVersusRoom(roomCode: string, role: 'host' | 'guest'): UseVersusRoomResult {
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const roleRef = useRef(role)

  useEffect(() => {
    // Initial fetch
    supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single()
      .then(({ data }) => {
        if (data) setRoom(data as GameRoom)
        setLoading(false)
      })

    // Realtime subscription for live updates
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          setRoom(payload.new as GameRoom)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomCode])

  const isHost = roleRef.current === 'host'
  const myDrinks = room ? (isHost ? room.host_drinks : room.guest_drinks) : 0
  const opponentDrinks = room ? (isHost ? room.guest_drinks : room.host_drinks) : 0
  const myRole = isHost ? 'host' : 'guest'
  const isWinner = room?.winner === myRole
  const isLoser = room !== null && room.winner !== null && !isWinner
  const opponentDisconnectedAt = room
    ? (isHost ? room.guest_disconnected_at : room.host_disconnected_at)
    : null

  return { room, myDrinks, opponentDrinks, isWinner, isLoser, opponentDisconnectedAt, loading }
}
