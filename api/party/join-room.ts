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

  const { roomCode, deviceId, playerName } = req.body as {
    roomCode?: unknown; deviceId?: unknown; playerName?: unknown
  }
  if (typeof roomCode !== 'string' || typeof deviceId !== 'string' || !deviceId) {
    res.status(400).json({ error: 'roomCode and deviceId required' }); return
  }
  if (typeof playerName !== 'string' || !playerName.trim()) {
    res.status(400).json({ error: 'playerName required' }); return
  }
  const name = playerName.trim().slice(0, 20)
  const code = roomCode.toUpperCase()

  let supabase: ReturnType<typeof createClient>
  try { supabase = makeSupabase() } catch {
    res.status(500).json({ error: 'Server not configured' }); return
  }

  // Fetch room
  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select('room_code, win_target, start_level, status, is_party, expires_at')
    .eq('room_code', code)
    .single()

  if (roomError || !room) {
    res.status(404).json({ error: 'Room not found' }); return
  }
  if (!room.is_party) {
    res.status(400).json({ error: 'Not a party room' }); return
  }
  if (room.expires_at && new Date(room.expires_at) < new Date()) {
    res.status(410).json({ error: 'Room has expired' }); return
  }
  if (room.status !== 'waiting') {
    res.status(409).json({ error: 'Game already in progress' }); return
  }

  // Count active players
  const { count, error: countError } = await supabase
    .from('room_players')
    .select('id', { count: 'exact', head: true })
    .eq('room_code', code)
    .is('disconnected_at', null)

  if (countError) {
    res.status(500).json({ error: countError.message }); return
  }
  if ((count ?? 0) >= 12) {
    res.status(409).json({ error: 'Room is full (max 12 players)' }); return
  }

  // Upsert player
  const { error: upsertError } = await supabase
    .from('room_players')
    .upsert(
      { room_code: code, device_id: deviceId, player_name: name, disconnected_at: null },
      { onConflict: 'room_code,device_id' }
    )

  if (upsertError) {
    res.status(500).json({ error: upsertError.message }); return
  }

  res.json({ roomCode: code, winTarget: room.win_target, startLevel: room.start_level })
}
