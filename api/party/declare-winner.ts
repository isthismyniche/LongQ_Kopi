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

  // Atomic: only succeeds if winner not yet set and game is playing
  const { data, error } = await supabase
    .from('game_rooms')
    .update({ winner: deviceId, status: 'finished' })
    .eq('room_code', roomCode.toUpperCase())
    .eq('status', 'playing')
    .is('winner', null)
    .select('room_code')

  if (error) { res.status(500).json({ error: error.message }); return }

  const alreadyDeclared = !data || data.length === 0
  res.json({ ok: true, alreadyDeclared })
}
