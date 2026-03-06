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

  const { roomCode } = req.body as { roomCode?: unknown }
  if (typeof roomCode !== 'string') {
    res.status(400).json({ error: 'roomCode required' }); return
  }

  let supabase: ReturnType<typeof createClient>
  try { supabase = makeSupabase() } catch {
    res.status(500).json({ error: 'Server not configured' }); return
  }

  // Reset all game state — only from a finished room
  const { error } = await supabase
    .from('game_rooms')
    .update({
      host_drinks: 0,
      guest_drinks: 0,
      winner: null,
      status: 'playing',
      rematch_requested_by: null,
      host_disconnected_at: null,
      guest_disconnected_at: null,
    })
    .eq('room_code', roomCode.toUpperCase())
    .eq('status', 'finished') // only rematch from a finished room

  if (error) { res.status(500).json({ error: error.message }); return }

  res.json({ ok: true })
}
