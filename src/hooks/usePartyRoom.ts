import { useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabase'

export interface PartyPlayer {
  device_id: string
  player_name: string
  drinks: number
  lives_lost: number
  avg_time_ms: number
  is_host: boolean
  disconnected_at: string | null
  joined_at: string
  sabos_used: number
  sabos_received: number
  blocked_ingredients: string[]
}

export interface PartyRoom {
  room_code: string
  host_device_id: string
  win_target: number
  start_level: number
  status: 'waiting' | 'playing' | 'finished'
  winner: string | null
  is_party: boolean
}

export interface UsePartyRoomResult {
  room: PartyRoom | null
  players: PartyPlayer[]
  activePlayers: PartyPlayer[]
  myPlayer: PartyPlayer | null
  topOpponents: PartyPlayer[]
  isWinner: boolean
  isFinished: boolean
  loading: boolean
}

export function usePartyRoom(roomCode: string, deviceId: string): UsePartyRoomResult {
  const [room, setRoom] = useState<PartyRoom | null>(null)
  const [players, setPlayers] = useState<PartyPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const deviceIdRef = useRef(deviceId)

  useEffect(() => {
    if (!roomCode) return

    // Initial fetch
    Promise.all([
      supabase
        .from('game_rooms')
        .select('room_code,host_device_id,win_target,start_level,status,winner,is_party')
        .eq('room_code', roomCode)
        .single(),
      supabase
        .from('room_players')
        .select('device_id,player_name,drinks,lives_lost,avg_time_ms,is_host,disconnected_at,joined_at,sabos_used,sabos_received,blocked_ingredients')
        .eq('room_code', roomCode)
        .order('joined_at', { ascending: true }),
    ]).then(([roomRes, playersRes]) => {
      if (roomRes.data) setRoom(roomRes.data as PartyRoom)
      if (playersRes.data) setPlayers(playersRes.data as PartyPlayer[])
      setLoading(false)
    })

    // Channel 1: game_rooms updates
    const roomChannel = supabase
      .channel(`party-room:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          setRoom(payload.new as PartyRoom)
        }
      )
      .subscribe()

    // Channel 2: room_players inserts + updates
    const playersChannel = supabase
      .channel(`party-players:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_players',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          const newPlayer = payload.new as PartyPlayer
          setPlayers(prev => {
            const exists = prev.some(p => p.device_id === newPlayer.device_id)
            if (exists) return prev
            return [...prev, newPlayer].sort(
              (a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
            )
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_players',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          const updated = payload.new as PartyPlayer
          setPlayers(prev =>
            prev.map(p => p.device_id === updated.device_id ? updated : p)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(playersChannel)
    }
  }, [roomCode])

  const myPlayer = players.find(p => p.device_id === deviceIdRef.current) ?? null
  const activePlayers = players.filter(p => p.disconnected_at === null)
  const topOpponents = activePlayers
    .filter(p => p.device_id !== deviceIdRef.current)
    .sort((a, b) => b.drinks - a.drinks)
    .slice(0, 2)

  const isWinner = room?.winner === deviceIdRef.current
  const isFinished = room?.status === 'finished'

  return { room, players, activePlayers, myPlayer, topOpponents, isWinner, isFinished, loading }
}
