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

  const { roomCode, deviceId, winTarget, startLevel } = req.body as {
    roomCode?: unknown; deviceId?: unknown; winTarget?: unknown; startLevel?: unknown
  }
  if (typeof roomCode !== 'string' || typeof deviceId !== 'string' || !deviceId) {
    res.status(400).json({ error: 'roomCode and deviceId required' }); return
  }
  if (typeof winTarget !== 'number' || winTarget < 5 || winTarget > 50) {
    res.status(400).json({ error: 'winTarget must be 5–50' }); return
  }
  if (typeof startLevel !== 'number' || startLevel < 1 || startLevel > 5) {
    res.status(400).json({ error: 'startLevel must be 1–5' }); return
  }

  let supabase: ReturnType<typeof createClient>
  try { supabase = makeSupabase() } catch {
    res.status(500).json({ error: 'Server not configured' }); return
  }

  // Verify host and status
  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select('host_device_id, status')
    .eq('room_code', roomCode.toUpperCase())
    .single()

  if (roomError || !room) {
    res.status(404).json({ error: 'Room not found' }); return
  }
  if (room.host_device_id !== deviceId) {
    res.status(403).json({ error: 'Only the host can change settings' }); return
  }
  if (room.status !== 'waiting') {
    res.status(409).json({ error: 'Cannot change settings after game has started' }); return
  }

  const { error: updateError } = await supabase
    .from('game_rooms')
    .update({ win_target: winTarget, start_level: startLevel })
    .eq('room_code', roomCode.toUpperCase())

  if (updateError) {
    res.status(500).json({ error: updateError.message }); return
  }

  res.json({ ok: true })
}
