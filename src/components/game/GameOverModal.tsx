import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { saveScore } from '../../utils/leaderboard'
import { shareScore } from '../../utils/shareScore'

interface GameOverModalProps {
  score: number
  drinksServed: number
  avgTime: number
  onPlayAgain: () => void
  onMainMenu: () => void
}

export default function GameOverModal({
  score,
  drinksServed,
  avgTime,
  onPlayAgain,
  onMainMenu,
}: GameOverModalProps) {
  const [showShareForm, setShowShareForm] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [saved, setSaved] = useState(false)
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
      setSaved(true)
    } catch (err) {
      console.error('Failed to save score:', err)
      setSaved(true) // still show card even if save failed
    } finally {
      setGenerating(false)
    }
  }, [playerName, score, drinksServed, avgSeconds, datetime, generating])

  // Capture the visible card preview after it renders
  useEffect(() => {
    if (!saved || cardBlob || cardError) return

    let cancelled = false

    const capture = async () => {
      // Double RAF to ensure the card is painted before capturing
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      )
      if (cancelled || !cardRef.current) return

      try {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#FFF8E7',
          scale: 2,
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
  }, [saved, cardBlob, cardError])

  const handleShare = useCallback(async () => {
    if (!cardBlob) return
    await shareScore(
      {
        name: playerName.trim(),
        score,
        drinksServed,
        avgSeconds,
        cardImageBlob: cardBlob,
      },
      () => {
        setShowTooltip(true)
        setTimeout(() => setShowTooltip(false), 4000)
      },
    )
  }, [cardBlob, playerName, score, drinksServed, avgSeconds])

  const cardReady = cardBlob !== null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
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
                {/* Visible card — this is also what gets captured by html2canvas */}
                <div
                  ref={cardRef}
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
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#5C3D2E', margin: 0 }}>LongQ Kopi ☕</p>
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

                {/* Share button */}
                <button
                  onClick={handleShare}
                  disabled={!cardReady}
                  aria-label="Share score"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                    bg-kopi-brown hover:bg-kopi-brown/90 text-white font-display font-bold
                    cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Share
                </button>

                {/* Clipboard fallback tooltip */}
                <AnimatePresence>
                  {showTooltip && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-center px-3 py-2 rounded-lg bg-kopi-brown/10 text-kopi-brown/70 font-body"
                    >
                      Copied to clipboard! Paste into WhatsApp, Telegram, or any chat.
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
