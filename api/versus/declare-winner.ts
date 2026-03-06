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

  const { roomCode, role } = req.body as { roomCode?: unknown; role?: unknown }
  if (typeof roomCode !== 'string' || (role !== 'host' && role !== 'guest')) {
    res.status(400).json({ error: 'roomCode and role (host|guest) required' }); return
  }

  let supabase: ReturnType<typeof createClient>
  try { supabase = makeSupabase() } catch {
    res.status(500).json({ error: 'Server not configured' }); return
  }

  // Atomic update: only succeeds if winner is not yet set — prevents race condition
  const { error } = await supabase
    .from('game_rooms')
    .update({ winner: role, status: 'finished' })
    .eq('room_code', roomCode.toUpperCase())
    .is('winner', null) // WHERE winner IS NULL

  if (error) { res.status(500).json({ error: error.message }); return }

  res.json({ ok: true })
}
