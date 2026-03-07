/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'

const ALL_INGREDIENTS =
  ['kopi', 'teh', 'sugar', 'condensed', 'evaporated', 'ice', 'hotwater'] as const
type SaboIngredient = typeof ALL_INGREDIENTS[number]

function getSaboCharges(winTarget: number): number {
  if (winTarget <= 5) return 0
  if (winTarget <= 20) return 1
  return 2
}

function makeSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') { res.status(405).end(); return }

  const { roomCode, fromDeviceId, fromName, toDeviceId, toName } = req.body as {
    roomCode?: unknown
    fromDeviceId?: unknown
    fromName?: unknown
    toDeviceId?: unknown
    toName?: unknown
  }

  if (
    typeof roomCode !== 'string' || !roomCode ||
    typeof fromDeviceId !== 'string' || !fromDeviceId ||
    typeof fromName !== 'string' ||
    typeof toDeviceId !== 'string' || !toDeviceId ||
    typeof toName !== 'string'
  ) {
    res.status(400).json({ error: 'Missing required fields' }); return
  }

  if (fromDeviceId === toDeviceId) {
    res.status(400).json({ error: 'Cannot sabo yourself' }); return
  }

  let supabase: ReturnType<typeof createClient>
  try { supabase = makeSupabase() } catch {
    res.status(500).json({ error: 'Server not configured' }); return
  }

  const code = roomCode.toUpperCase()

  // Validate room is playing and get win_target
  const { data: roomData, error: roomError } = await supabase
    .from('game_rooms')
    .select('status,win_target')
    .eq('room_code', code)
    .single()

  if (roomError || !roomData) {
    res.status(404).json({ error: 'Room not found' }); return
  }
  if (roomData.status !== 'playing') {
    res.status(409).json({ error: 'Game not in progress' }); return
  }

  const maxCharges = getSaboCharges(roomData.win_target)

  // Check from_player charges
  const { data: fromPlayer, error: fromError } = await supabase
    .from('room_players')
    .select('sabos_used')
    .eq('room_code', code)
    .eq('device_id', fromDeviceId)
    .single()

  if (fromError || !fromPlayer) {
    res.status(404).json({ error: 'Sender not found' }); return
  }
  if (fromPlayer.sabos_used >= maxCharges) {
    res.status(403).json({ error: 'No sabo charges remaining' }); return
  }

  // Get to_player's current blocked ingredients
  const { data: toPlayer, error: toError } = await supabase
    .from('room_players')
    .select('blocked_ingredients')
    .eq('room_code', code)
    .eq('device_id', toDeviceId)
    .single()

  if (toError || !toPlayer) {
    res.status(404).json({ error: 'Target not found' }); return
  }

  const blocked: string[] = toPlayer.blocked_ingredients ?? []
  const available = ALL_INGREDIENTS.filter((i: SaboIngredient) => !blocked.includes(i))

  if (available.length === 0) {
    res.json({ ok: true, wasted: true }); return
  }

  const ingredient = available[Math.floor(Math.random() * available.length)]

  // Update from_player: sabos_used += 1
  await supabase
    .from('room_players')
    .update({ sabos_used: fromPlayer.sabos_used + 1 })
    .eq('room_code', code)
    .eq('device_id', fromDeviceId)

  // Update to_player: sabos_received += 1, blocked_ingredients append
  const { data: toPlayerFull } = await supabase
    .from('room_players')
    .select('sabos_received')
    .eq('room_code', code)
    .eq('device_id', toDeviceId)
    .single()

  await supabase
    .from('room_players')
    .update({
      sabos_received: (toPlayerFull?.sabos_received ?? 0) + 1,
      blocked_ingredients: [...blocked, ingredient],
    })
    .eq('room_code', code)
    .eq('device_id', toDeviceId)

  // Insert sabo_event
  await supabase.from('sabo_events').insert({
    room_code: code,
    from_device_id: fromDeviceId,
    from_name: fromName,
    to_device_id: toDeviceId,
    to_name: toName,
    ingredient,
  })

  res.json({ ok: true, ingredient })
}
