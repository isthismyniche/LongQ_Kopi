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

  const { roomCode, role, action } = req.body as {
    roomCode?: unknown; role?: unknown; action?: unknown
  }
  if (
    typeof roomCode !== 'string' ||
    (role !== 'host' && role !== 'guest') ||
    (action !== 'disconnect' && action !== 'reconnect')
  ) {
    res.status(400).json({ error: 'roomCode, role (host|guest), and action (disconnect|reconnect) required' })
    return
  }

  let supabase: ReturnType<typeof createClient>
  try { supabase = makeSupabase() } catch {
    res.status(500).json({ error: 'Server not configured' }); return
  }

  const col = role === 'host' ? 'host_disconnected_at' : 'guest_disconnected_at'
  const value = action === 'disconnect' ? new Date().toISOString() : null

  const { error } = await supabase
    .from('game_rooms')
    .update({ [col]: value })
    .eq('room_code', roomCode.toUpperCase())

  if (error) { res.status(500).json({ error: error.message }); return }

  res.json({ ok: true })
}
