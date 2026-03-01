import { supabase, isSupabaseConfigured } from './supabase'

export interface LeaderboardEntry {
  name: string
  score: number
  datetime: string
  drinksServed?: number
  avgTime?: number
}

const STORAGE_KEY = 'longq_kopi_leaderboard'
const DEVICE_ID_KEY = 'longq_kopi_device_id'

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = generateUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

function getLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const entries: LeaderboardEntry[] = JSON.parse(raw)
    return entries.sort((a, b) => b.score - a.score).slice(0, 10)
  } catch {
    return []
  }
}

function saveLocalScore(entry: LeaderboardEntry): void {
  const entries = getLocalLeaderboard()
  entries.push(entry)
  entries.sort((a, b) => b.score - a.score)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 10)))
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) return getLocalLeaderboard()

  try {
    // Uses the get_top_leaderboard() Postgres function which applies
    // DISTINCT ON (device_id) to show each player's best score once.
    const { data, error } = await supabase.rpc('get_top_leaderboard')
    if (error) throw error

    return ((data as unknown[]) ?? []).map((row: unknown) => {
      const r = row as Record<string, unknown>
      return {
        name: r.name as string,
        score: r.score as number,
        datetime: r.created_at as string,
        drinksServed: r.drinks_served != null ? Number(r.drinks_served) : undefined,
        avgTime: r.avg_time != null ? Number(r.avg_time) : undefined,
      }
    })
  } catch (err) {
    console.error('Supabase fetch failed, falling back to localStorage:', err)
    return getLocalLeaderboard()
  }
}

export async function saveScore(entry: LeaderboardEntry): Promise<void> {
  saveLocalScore(entry)
  if (!isSupabaseConfigured()) return

  try {
    const { error } = await supabase.from('leaderboard').insert({
      name: entry.name,
      score: entry.score,
      drinks_served: entry.drinksServed,
      avg_time: entry.avgTime,
      device_id: getOrCreateDeviceId(),
    })
    if (error) throw error
  } catch (err) {
    console.error('Supabase insert failed:', err)
  }
}

/**
 * Returns this score's all-time rank among unique players (best score per device).
 * Rank 1 = highest score. Returns 999 on error so the top-100 banner is safely hidden.
 */
export async function getRank(score: number): Promise<number> {
  if (!isSupabaseConfigured()) {
    const local = getLocalLeaderboard()
    return local.filter(e => e.score > score).length + 1
  }

  try {
    const { data, error } = await supabase.rpc('get_player_rank', { p_score: score })
    if (error) throw error
    return typeof data === 'number' ? data : 999
  } catch (err) {
    console.error('Supabase rank fetch failed:', err)
    return 999
  }
}
