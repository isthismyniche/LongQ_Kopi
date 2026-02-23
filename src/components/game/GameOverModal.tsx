import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
import { saveScore } from '../../utils/leaderboard'
import { generateScoreURL } from '../../utils/scoreSignature'
import { shareScore } from '../../utils/shareScore'
import { ScoreCardCanvas } from '../results/ScoreCardCanvas'

interface GameOverModalProps {
  score: number
  drinksServed: number
  avgTime: number
  level: number
  levelName: string
  onPlayAgain: () => void
  onMainMenu: () => void
}

export default function GameOverModal({
  score,
  drinksServed,
  avgTime,
  level,
  levelName,
  onPlayAgain,
  onMainMenu,
}: GameOverModalProps) {
  const [showShareForm, setShowShareForm] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [saved, setSaved] = useState(false)
  const [signedURL, setSignedURL] = useState('')
  const [qrDataURL, setQrDataURL] = useState('')
  const [cardBlob, setCardBlob] = useState<Blob | null>(null)
  const [cardError, setCardError] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const datetime = useRef(new Date().toISOString()).current

  const formattedDate = new Date(datetime).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const avgSeconds = Math.round(avgTime * 10) / 10

  const handleSaveAndGenerate = useCallback(async () => {
    if (!playerName.trim() || generating) return
    setGenerating(true)
    try {
      await saveScore({
        name: playerName.trim(),
        score,
        datetime,
        drinksServed,
        avgTime: avgSeconds,
      })

      const url = await generateScoreURL({
        name: playerName.trim(),
        score,
        drinksServed,
        avgSeconds,
        level,
        datetime,
      })

      const qr = await QRCode.toDataURL(url, {
        width: 130,
        margin: 1,
        color: { dark: '#5C3D2E', light: '#FFF8E7' },
      })

      setSignedURL(url)
      setQrDataURL(qr)
      setSaved(true)
    } catch (err) {
      console.error('Failed to generate score card:', err)
      setCardError(true)
      setSaved(true)
    } finally {
      setGenerating(false)
    }
  }, [playerName, score, drinksServed, avgSeconds, level, datetime, generating])

  // Capture the off-screen ScoreCardCanvas after it renders
  useEffect(() => {
    if (!saved || !signedURL || !qrDataURL || cardBlob || cardError) return

    let cancelled = false

    const capture = async () => {
      // Double RAF to ensure the DOM is painted before capturing
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      )

      if (cancelled || !cardRef.current) return

      try {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#FFF8E7',
          scale: 2,
          useCORS: true,
          logging: false,
        })
        if (cancelled) return
        canvas.toBlob(
          blob => {
            if (!cancelled) {
              if (blob) setCardBlob(blob)
              else setCardError(true)
            }
          },
          'image/png',
        )
      } catch {
        if (!cancelled) setCardError(true)
      }
    }

    capture()
    return () => {
      cancelled = true
    }
  }, [saved, signedURL, qrDataURL, cardBlob, cardError])

  const handleDownload = useCallback(() => {
    if (!cardBlob) return
    const url = URL.createObjectURL(cardBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `longq-kopi-${score}pts.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }, [cardBlob, score])

  const handleShare = useCallback(
    async (platform: 'whatsapp' | 'telegram') => {
      if (!cardBlob || !signedURL) return
      await shareScore(
        platform,
        {
          name: playerName.trim(),
          score,
          drinksServed,
          avgSeconds,
          signedURL,
          cardImageBlob: cardBlob,
        },
        () => {
          setShowTooltip(true)
          setTimeout(() => setShowTooltip(false), 4000)
        },
      )
    },
    [cardBlob, signedURL, playerName, score, drinksServed, avgSeconds],
  )

  const cardReady = cardBlob !== null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      {/* Off-screen 800×500 card for html2canvas capture */}
      {saved && signedURL && qrDataURL && (
        <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', zIndex: -1 }}>
          <ScoreCardCanvas
            ref={cardRef}
            name={playerName.trim()}
            score={score}
            drinksServed={drinksServed}
            avgSeconds={avgSeconds}
            level={level}
            levelName={levelName}
            formattedDate={formattedDate}
            qrDataURL={qrDataURL}
          />
        </div>
      )}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="bg-cream rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        {!showShareForm ? (
          /* Main game over screen */
          <div className="text-center">
            <h2 className="font-display text-4xl font-bold text-hawker-red mb-2">Game Over!</h2>

            <p className="font-display text-6xl font-bold text-kopi-brown mb-1">{score}</p>
            <p className="text-kopi-brown/60 mb-2">points</p>
            <div className="flex justify-center gap-4 mb-2">
              <div>
                <p className="font-display text-xl font-bold text-kopi-brown">{drinksServed}</p>
                <p className="text-[11px] text-kopi-brown/50">drinks served</p>
              </div>
              <div className="w-px bg-kopi-brown/15" />
              <div>
                <p className="font-display text-xl font-bold text-kopi-brown">{avgSeconds}s</p>
                <p className="text-[11px] text-kopi-brown/50">avg per drink</p>
              </div>
            </div>
            <p className="text-xs text-kopi-brown/40 mb-6">{formattedDate}</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onPlayAgain}
                className="px-6 py-3 rounded-2xl bg-hawker-red hover:bg-hawker-red/90 text-white
                  font-display font-bold text-lg shadow-lg cursor-pointer transition-colors"
              >
                Play Again
              </button>
              <button
                onClick={() => setShowShareForm(true)}
                className="px-6 py-3 rounded-2xl bg-kopi-brown hover:bg-kopi-brown/90 text-white
                  font-display font-bold text-lg shadow-lg cursor-pointer transition-colors"
              >
                Share Score
              </button>
              <button
                onClick={onMainMenu}
                className="px-6 py-3 rounded-2xl bg-kopi-brown/20 hover:bg-kopi-brown/30 text-kopi-brown
                  font-display font-bold cursor-pointer transition-colors"
              >
                Main Menu
              </button>
            </div>
          </div>
        ) : (
          /* Share form */
          <div className="text-center">
            <h3 className="font-display text-2xl font-bold text-kopi-brown mb-2">Share Your Score</h3>

            {!saved ? (
              <div className="space-y-4">
                <p className="text-sm text-kopi-brown/60 mb-2">
                  Enter your name to save your score and generate a shareable result card.
                </p>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveAndGenerate()}
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl border-2 border-kopi-brown/20 bg-white
                    font-body text-kopi-brown text-center text-lg focus:outline-none focus:border-kopi-brown/50"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowShareForm(false)}
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-200 text-kopi-brown
                      font-display font-bold cursor-pointer transition-colors hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveAndGenerate}
                    disabled={!playerName.trim() || generating}
                    className="flex-1 px-4 py-2 rounded-xl bg-hawker-red text-white
                      font-display font-bold cursor-pointer transition-colors hover:bg-hawker-red/90
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {generating ? 'Saving…' : 'Save & Share'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Visible card preview */}
                <div
                  style={{
                    width: 300,
                    backgroundColor: '#FFF8E7',
                    borderRadius: 16,
                    padding: 24,
                    border: '2px solid rgba(92, 61, 46, 0.2)',
                    margin: '0 auto',
                    fontFamily: '"Fredoka", sans-serif',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#5C3D2E', margin: 0 }}>LongQ Kopi</p>
                    <div style={{ margin: '12px 0' }}>
                      <p style={{ fontSize: 14, color: 'rgba(92, 61, 46, 0.6)', margin: 0 }}>{playerName.trim()}</p>
                      <p style={{ fontSize: 48, fontWeight: 700, color: '#C41E3A', margin: '4px 0' }}>{score}</p>
                      <p style={{ fontSize: 14, color: 'rgba(92, 61, 46, 0.6)', margin: 0 }}>points</p>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 12,
                        margin: '8px 0',
                        color: 'rgba(92, 61, 46, 0.6)',
                      }}
                    >
                      <span style={{ fontSize: 12 }}>{drinksServed} drinks</span>
                      <span style={{ fontSize: 12 }}>|</span>
                      <span style={{ fontSize: 12 }}>{avgSeconds}s avg</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(92, 61, 46, 0.4)', margin: '4px 0 0' }}>{formattedDate}</p>
                    <p style={{ fontSize: 11, color: 'rgba(92, 61, 46, 0.4)', margin: '4px 0 0' }}>
                      Can you beat my score?
                    </p>
                    <p style={{ fontSize: 11, color: '#C41E3A', margin: '8px 0 0', fontWeight: 600 }}>
                      longqkopi.vercel.app
                    </p>
                  </div>
                </div>

                {/* Status messages */}
                {cardError && (
                  <p className="text-xs text-hawker-red/80 text-center">Could not generate score card</p>
                )}
                {!cardReady && !cardError && (
                  <p className="text-xs text-kopi-brown/50 text-center">Generating card…</p>
                )}

                {/* Download button */}
                <button
                  onClick={handleDownload}
                  disabled={!cardReady}
                  className="w-full px-4 py-2 rounded-xl bg-kopi-brown text-white
                    font-display font-bold cursor-pointer transition-colors hover:bg-kopi-brown/90
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Download
                </button>

                {/* WhatsApp + Telegram share buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    disabled={!cardReady}
                    aria-label="Share on WhatsApp"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                      bg-[#25D366] hover:bg-[#1db954] text-white font-display font-bold text-sm
                      cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare('telegram')}
                    disabled={!cardReady}
                    aria-label="Share on Telegram"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                      bg-[#0088CC] hover:bg-[#0077bb] text-white font-display font-bold text-sm
                      cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    Telegram
                  </button>
                </div>

                {/* Desktop fallback tooltip */}
                <AnimatePresence>
                  {showTooltip && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-center px-3 py-2 rounded-lg bg-kopi-brown/10 text-kopi-brown/70 font-body"
                    >
                      Image downloaded! Paste it into your chat along with the link.
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Play Again / Menu */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={onPlayAgain}
                    className="flex-1 px-4 py-2 rounded-xl bg-hawker-red text-white
                      font-display font-bold cursor-pointer transition-colors hover:bg-hawker-red/90"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={onMainMenu}
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-200 text-kopi-brown
                      font-display font-bold cursor-pointer transition-colors hover:bg-gray-300"
                  >
                    Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
