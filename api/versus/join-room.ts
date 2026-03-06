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

  const { roomCode, deviceId } = req.body as { roomCode?: unknown; deviceId?: unknown }
  if (typeof roomCode !== 'string' || typeof deviceId !== 'string') {
    res.status(400).json({ error: 'roomCode and deviceId required' }); return
  }

  let supabase: ReturnType<typeof createClient>
  try { supabase = makeSupabase() } catch {
    res.status(500).json({ error: 'Server not configured' }); return
  }

  const code = roomCode.toUpperCase().trim()

  const { data: room, error: fetchError } = await supabase
    .from('game_rooms')
    .select('*')
    .eq('room_code', code)
    .single()

  if (fetchError || !room) { res.status(404).json({ error: 'Room not found' }); return }
  if (new Date(room.expires_at) < new Date()) { res.status(410).json({ error: 'Room has expired' }); return }
  if (room.status !== 'waiting') { res.status(409).json({ error: 'Game already in progress' }); return }
  if (room.guest_device_id) { res.status(409).json({ error: 'Room is full' }); return }
  if (room.host_device_id === deviceId) { res.status(409).json({ error: 'Cannot join your own room' }); return }

  const { error: updateError } = await supabase
    .from('game_rooms')
    .update({ guest_device_id: deviceId, status: 'playing' })
    .eq('room_code', code)
    .eq('status', 'waiting') // extra guard against race

  if (updateError) { res.status(500).json({ error: updateError.message }); return }

  res.json({ roomCode: code, role: 'guest', winTarget: room.win_target, startLevel: room.start_level ?? 1 })
}
