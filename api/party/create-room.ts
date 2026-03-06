/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'

function makeSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

// No ambiguous characters (0/O, 1/I) for easier code sharing
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  return Array.from({ length: 6 }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join('')
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { res.status(405).end(); return }

  const { deviceId, playerName, winTarget, startLevel } = req.body as {
    deviceId?: unknown; playerName?: unknown; winTarget?: unknown; startLevel?: unknown
  }
  if (typeof deviceId !== 'string' || !deviceId) {
    res.status(400).json({ error: 'deviceId required' }); return
  }
  if (typeof playerName !== 'string' || !playerName.trim()) {
    res.status(400).json({ error: 'playerName required' }); return
  }
  const name = playerName.trim().slice(0, 20)
  const resolvedWinTarget = (typeof winTarget === 'number' && winTarget >= 5 && winTarget <= 50)
    ? winTarget : 20
  const resolvedStartLevel = (typeof startLevel === 'number' && startLevel >= 1 && startLevel <= 5)
    ? startLevel : 1

  let supabase: ReturnType<typeof createClient>
  try { supabase = makeSupabase() } catch {
    res.status(500).json({ error: 'Server not configured' }); return
  }

  // Retry up to 5 times on unique constraint collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const roomCode = generateCode()
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()

    const { error: roomError } = await supabase.from('game_rooms').insert({
      room_code: roomCode,
      host_device_id: deviceId,
      win_target: resolvedWinTarget,
      start_level: resolvedStartLevel,
      is_party: true,
      status: 'waiting',
      expires_at: expiresAt,
    })

    if (roomError) {
      const isUnique = roomError.message?.includes('unique') || roomError.code === '23505'
      if (!isUnique) {
        res.status(500).json({ error: roomError.message }); return
      }
      continue
    }

    // Insert host into room_players
    const { error: playerError } = await supabase.from('room_players').insert({
      room_code: roomCode,
      device_id: deviceId,
      player_name: name,
      is_host: true,
    })

    if (playerError) {
      res.status(500).json({ error: playerError.message }); return
    }

    res.json({ roomCode, winTarget: resolvedWinTarget, startLevel: resolvedStartLevel }); return
  }

  res.status(500).json({ error: 'Could not generate a unique room code — please try again' })
}
