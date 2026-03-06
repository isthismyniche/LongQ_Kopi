/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'

function makeSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { res.status(405).end(); return }

  const { roomCode, deviceId, action } = req.body as {
    roomCode?: unknown; deviceId?: unknown; action?: unknown
  }
  if (
    typeof roomCode !== 'string' ||
    typeof deviceId !== 'string' ||
    !deviceId ||
    (action !== 'disconnect' && action !== 'reconnect')
  ) {
    res.status(400).json({ error: 'roomCode, deviceId, and action (disconnect|reconnect) required' })
    return
  }

  let supabase: ReturnType<typeof createClient>
  try { supabase = makeSupabase() } catch {
    res.status(500).json({ error: 'Server not configured' }); return
  }

  const code = roomCode.toUpperCase()

  if (action === 'reconnect') {
    // Only allow reconnect if room is still in waiting state
    const { data: room } = await supabase
      .from('game_rooms')
      .select('status')
      .eq('room_code', code)
      .single()

    if (room?.status === 'waiting') {
      await supabase
        .from('room_players')
        .update({ disconnected_at: null })
        .eq('room_code', code)
        .eq('device_id', deviceId)
    }
    res.json({ ok: true }); return
  }

  // Disconnect: mark player as disconnected
  const { error: disconnectError } = await supabase
    .from('room_players')
    .update({ disconnected_at: new Date().toISOString() })
    .eq('room_code', code)
    .eq('device_id', deviceId)

  if (disconnectError) {
    res.status(500).json({ error: disconnectError.message }); return
  }

  // Check if only one active player remains while game is playing
  const { data: room } = await supabase
    .from('game_rooms')
    .select('status, winner')
    .eq('room_code', code)
    .single()

  if (room?.status === 'playing' && room?.winner === null) {
    const { data: activePlayers } = await supabase
      .from('room_players')
      .select('device_id')
      .eq('room_code', code)
      .is('disconnected_at', null)

    if (activePlayers && activePlayers.length === 1) {
      const lastPlayerId = activePlayers[0].device_id
      // Atomic last-player-wins
      await supabase
        .from('game_rooms')
        .update({ winner: lastPlayerId, status: 'finished' })
        .eq('room_code', code)
        .eq('status', 'playing')
        .is('winner', null)
    }
  }

  res.json({ ok: true })
}
