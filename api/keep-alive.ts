/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'

function makeSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') { res.status(405).end(); return }

  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers['authorization']
    if (auth !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: 'Unauthorized' }); return
    }
  }

  try {
    const supabase = makeSupabase()
    const { error } = await supabase.from('leaderboard').select('id').limit(1)
    if (error) throw error
    res.status(200).json({ ok: true, ts: new Date().toISOString() })
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message })
  }
}
