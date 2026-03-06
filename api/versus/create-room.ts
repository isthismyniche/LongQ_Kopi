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

  const { deviceId, winTarget, startLevel } = req.body as {
    deviceId?: unknown; winTarget?: unknown; startLevel?: unknown
  }
  if (typeof deviceId !== 'string' || !deviceId) {
    res.status(400).json({ error: 'deviceId required' }); return
  }
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
    const { error } = await supabase.from('game_rooms').insert({
      room_code: roomCode,
      host_device_id: deviceId,
      win_target: resolvedWinTarget,
      start_level: resolvedStartLevel,
    })
    if (!error) {
      res.json({ roomCode, role: 'host', winTarget: resolvedWinTarget, startLevel: resolvedStartLevel }); return
    }
    // Retry only on unique constraint violation (code collision)
    const isUnique = error.message?.includes('unique') || error.code === '23505'
    if (!isUnique) {
      res.status(500).json({ error: error.message }); return
    }
  }

  res.status(500).json({ error: 'Could not generate a unique room code — please try again' })
}
