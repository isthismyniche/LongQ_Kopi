import { supabase, isSupabaseConfigured } from './supabase'

export interface LeaderboardEntry {
  name: string
  score: number
  datetime: string
  drinksServed?: number
  avgTime?: number
}

const STORAGE_KEY = 'longq_kopi_leaderboard'

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
    const { data, error } = await supabase
      .from('leaderboard')
      .select('name, score, drinks_served, avg_time, created_at')
      .order('score', { ascending: false })
      .limit(10)

    if (error) throw error

    return (data ?? []).map((row) => ({
      name: row.name,
      score: row.score,
      datetime: row.created_at,
      drinksServed: row.drinks_served ?? undefined,
      avgTime: row.avg_time ?? undefined,
    }))
  } catch (err) {
    console.error('Supabase fetch failed, falling back to localStorage:', err)
    return getLocalLeaderboard()
  }
}

export async function saveScore(entry: LeaderboardEntry): Promise<void> {
  // Always save locally as a backup
  saveLocalScore(entry)

  if (!isSupabaseConfigured()) return

  try {
    const { error } = await supabase.from('leaderboard').insert({
      name: entry.name,
      score: entry.score,
      drinks_served: entry.drinksServed,
      avg_time: entry.avgTime,
    })

    if (error) throw error
  } catch (err) {
    console.error('Supabase insert failed:', err)
  }
}
