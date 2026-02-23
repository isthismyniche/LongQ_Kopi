import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { verifyScoreURL } from '../utils/scoreSignature'

const DOMAIN = 'https://longqkopi.vercel.app'

export default function ScorePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [verified, setVerified] = useState<boolean | null>(null)

  const name = searchParams.get('n') ?? ''
  const score = parseInt(searchParams.get('s') ?? '0', 10)
  const drinksServed = parseInt(searchParams.get('d') ?? '0', 10)
  const avgSeconds = parseFloat(searchParams.get('a') ?? '0')
  const level = parseInt(searchParams.get('l') ?? '0', 10)
  const datetime = searchParams.get('t') ?? ''

  const formattedDate = datetime
    ? new Date(datetime).toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  const signedURL = `${DOMAIN}/score?${searchParams.toString()}`

  useEffect(() => {
    verifyScoreURL(searchParams).then(setVerified)
  }, [searchParams])

  if (verified === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <p className="font-display text-xl text-kopi-brown/50">Verifying score…</p>
      </div>
    )
  }

  return (
    <>
      {verified && (
        <Helmet>
          <meta property="og:title" content={`${name} scored ${score} points in LongQ Kopi!`} />
          <meta
            property="og:description"
            content={`They served ${drinksServed} drinks taking ${avgSeconds.toFixed(1)}s per drink on average. Can you beat them?`}
          />
          <meta property="og:image" content={`${DOMAIN}/og-preview.svg`} />
          <meta property="og:url" content={signedURL} />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
      )}

      <div className="min-h-screen bg-gradient-to-b from-warm-yellow/30 to-cream flex flex-col items-center justify-center p-6">
        {verified ? (
          <div className="bg-cream rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center border-2 border-kopi-brown/10">
            {/* Header */}
            <p className="font-display text-sm text-kopi-brown/40 mb-1 tracking-wide uppercase">LongQ Kopi</p>
            <h1 className="font-display text-2xl font-bold text-kopi-brown mb-4">{name}</h1>

            {/* Score */}
            <p className="font-display text-7xl font-bold text-hawker-red leading-none">{score}</p>
            <p className="text-kopi-brown/50 text-sm mt-1 mb-4">points</p>

            {/* Stats */}
            <div className="flex justify-center gap-4 mb-3">
              <div>
                <p className="font-display text-xl font-bold text-kopi-brown">{drinksServed}</p>
                <p className="text-[11px] text-kopi-brown/50">drinks served</p>
              </div>
              <div className="w-px bg-kopi-brown/15" />
              <div>
                <p className="font-display text-xl font-bold text-kopi-brown">{avgSeconds.toFixed(1)}s</p>
                <p className="text-[11px] text-kopi-brown/50">avg per drink</p>
              </div>
              <div className="w-px bg-kopi-brown/15" />
              <div>
                <p className="font-display text-xl font-bold text-kopi-brown">Lv. {level}</p>
                <p className="text-[11px] text-kopi-brown/50">reached</p>
              </div>
            </div>

            <p className="text-xs text-kopi-brown/35 mb-6">{formattedDate}</p>

            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 rounded-2xl bg-hawker-red hover:bg-hawker-red/90 text-white
                font-display font-bold text-lg shadow-lg cursor-pointer transition-colors"
            >
              Play Now
            </button>
          </div>
        ) : (
          <div className="bg-cream rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border-2 border-kopi-brown/10">
            <p className="text-4xl mb-4">☕</p>
            <h1 className="font-display text-2xl font-bold text-kopi-brown mb-3">Score Not Verified</h1>
            <p className="text-sm text-kopi-brown/60 mb-6">
              This score could not be verified, but you can still play!
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 rounded-2xl bg-hawker-red hover:bg-hawker-red/90 text-white
                font-display font-bold text-lg shadow-lg cursor-pointer transition-colors"
            >
              Play Now
            </button>
          </div>
        )}
      </div>
    </>
  )
}
