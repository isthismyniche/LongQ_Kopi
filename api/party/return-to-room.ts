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
  const name = typeof playerName === 'string' ? playerName.trim().slice(0, 20) : ''

  let supabase: ReturnType<typeof createClient>
  try { supabase = makeSupabase() } catch {
    res.status(500).json({ error: 'Server not configured' }); return
  }

  const code = roomCode.toUpperCase()
  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()

  // Atomic host election: first caller wins the host role
  const { data: updated, error: updateError } = await supabase
    .from('game_rooms')
    .update({
      status: 'waiting',
      winner: null,
      host_device_id: deviceId,
      expires_at: expiresAt,
    })
    .eq('room_code', code)
    .eq('status', 'finished')
    .select('room_code')

  if (updateError) {
    res.status(500).json({ error: updateError.message }); return
  }

  const isNewHost = updated && updated.length > 0

  if (isNewHost) {
    // Reset all players: drinks + stats to 0, is_host to false
    await supabase
      .from('room_players')
      .update({ drinks: 0, lives_lost: 0, avg_time_ms: 0, is_host: false, sabos_used: 0, sabos_received: 0, blocked_ingredients: [] })
      .eq('room_code', code)

    // Set own row as host
    await supabase
      .from('room_players')
      .update({ is_host: true, disconnected_at: null, player_name: name || undefined })
      .eq('room_code', code)
      .eq('device_id', deviceId)
  } else {
    // Subsequent callers: reset their own row's stats and reconnect
    await supabase
      .from('room_players')
      .update({ drinks: 0, lives_lost: 0, avg_time_ms: 0, is_host: false, disconnected_at: null, player_name: name || undefined, sabos_used: 0, sabos_received: 0, blocked_ingredients: [] })
      .eq('room_code', code)
      .eq('device_id', deviceId)
  }

  res.json({ ok: true, isNewHost })
}
