const DOMAIN = 'https://longqkopi.vercel.app'

export interface ScoreParams {
  name: string
  score: number
  drinksServed: number
  avgSeconds: number
  level: number
  datetime: string
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function generateScoreURL(params: ScoreParams): Promise<string> {
  const secret = import.meta.env.VITE_SCORE_SECRET as string | undefined
  if (!secret) {
    console.warn('VITE_SCORE_SECRET is not defined — generating unsigned score URL')
  }

  const sp = new URLSearchParams({
    n: params.name,
    s: String(params.score),
    d: String(params.drinksServed),
    a: String(params.avgSeconds),
    l: String(params.level),
    t: params.datetime,
  })

  if (secret) {
    const sig = await hmacSign(secret, sp.toString())
    sp.set('sig', sig)
  }

  return `${DOMAIN}/score?${sp.toString()}`
}

export async function verifyScoreURL(searchParams: URLSearchParams): Promise<boolean> {
  const secret = import.meta.env.VITE_SCORE_SECRET as string | undefined
  if (!secret) return false

  const sig = searchParams.get('sig')
  if (!sig) return false

  const n = searchParams.get('n')
  const s = searchParams.get('s')
  const d = searchParams.get('d')
  const a = searchParams.get('a')
  const l = searchParams.get('l')
  const t = searchParams.get('t')

  if (!n || s === null || d === null || a === null || l === null || !t) return false

  // Reconstruct params in the same order as generateScoreURL
  const sp = new URLSearchParams({ n, s, d, a, l, t })
  const expectedSig = await hmacSign(secret, sp.toString())
  return expectedSig === sig
}
