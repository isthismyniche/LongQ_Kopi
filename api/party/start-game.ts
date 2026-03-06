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

  const { roomCode, deviceId } = req.body as {
    roomCode?: unknown; deviceId?: unknown
  }
  if (typeof roomCode !== 'string' || typeof deviceId !== 'string' || !deviceId) {
    res.status(400).json({ error: 'roomCode and deviceId required' }); return
  }

  let supabase: ReturnType<typeof createClient>
  try { supabase = makeSupabase() } catch {
    res.status(500).json({ error: 'Server not configured' }); return
  }

  const code = roomCode.toUpperCase()

  // Verify host and status
  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select('host_device_id, status')
    .eq('room_code', code)
    .single()

  if (roomError || !room) {
    res.status(404).json({ error: 'Room not found' }); return
  }
  if (room.host_device_id !== deviceId) {
    res.status(403).json({ error: 'Only the host can start the game' }); return
  }
  if (room.status !== 'waiting') {
    res.status(409).json({ error: 'Game already started' }); return
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
  if ((count ?? 0) < 2) {
    res.status(400).json({ error: 'Need at least 2 players to start' }); return
  }

  // Idempotent start
  const { error: updateError } = await supabase
    .from('game_rooms')
    .update({ status: 'playing' })
    .eq('room_code', code)
    .eq('status', 'waiting')

  if (updateError) {
    res.status(500).json({ error: updateError.message }); return
  }

  res.json({ ok: true })
}
