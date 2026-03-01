import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import confetti from 'canvas-confetti'
import { saveScore, getRank } from '../../utils/leaderboard'
import { shareScore } from '../../utils/shareScore'

interface GameOverModalProps {
  score: number
  drinksServed: number
  avgTime: number
  level: number
  levelName: string
  onPlayAgain: () => void
  onMainMenu: () => void
}

const LEVEL_THEMES: Record<number, {
  accent: string
  border: string
  badgeBg: string
  emoji: string
}> = {
  1: { accent: '#C41E3A', border: 'rgba(196,30,58,0.22)',   badgeBg: 'rgba(196,30,58,0.12)',  emoji: '☀️' },
  2: { accent: '#D4751E', border: 'rgba(212,117,30,0.22)',  badgeBg: 'rgba(212,117,30,0.12)', emoji: '🌅' },
  3: { accent: '#B8860B', border: 'rgba(184,134,11,0.22)',  badgeBg: 'rgba(184,134,11,0.12)', emoji: '🌞' },
  4: { accent: '#7B3FA0', border: 'rgba(123,63,160,0.22)',  badgeBg: 'rgba(123,63,160,0.12)', emoji: '🍵' },
  5: { accent: '#1E3A6E', border: 'rgba(30,58,110,0.22)',   badgeBg: 'rgba(30,58,110,0.12)',  emoji: '🌙' },
}

const PERSONAL_BEST_KEY = 'longq_kopi_personal_best'

export default function GameOverModal({
  score,
  drinksServed,
  avgTime,
  level,
  levelName,
  onPlayAgain,
  onMainMenu,
}: GameOverModalProps) {
  // Computed once on mount — never changes during modal lifetime
  const isReturningPlayer = useRef(
    Boolean(localStorage.getItem('longq_kopi_player_name')?.trim())
  ).current
  const prevBest = useRef(parseInt(localStorage.getItem(PERSONAL_BEST_KEY) ?? '0', 10)).current
  const isPersonalBest = useRef(prevBest > 0 && score > prevBest).current

  const [showShareForm, setShowShareForm] = useState(() => isReturningPlayer)
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('longq_kopi_player_name') ?? ''
  )
  const [saved, setSaved] = useState(false)
  const [changingName, setChangingName] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const [cardBlob, setCardBlob] = useState<Blob | null>(null)
  const [cardError, setCardError] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [rank, setRank] = useState<number | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const savedNameRef = useRef('')
  const datetime = useRef(new Date().toISOString()).current

  const theme = LEVEL_THEMES[level] ?? LEVEL_THEMES[1]

  const formattedDate = new Date(datetime).toLocaleDateString('en-SG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const avgSeconds = Math.round(avgTime * 10) / 10

  // ── Rank fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    getRank(score).then(setRank)
  }, [score])

  // ── Score count-up (ease-out cubic, 1 s) ────────────────────────────────────
  useEffect(() => {
    if (!saved) return
    const start = performance.now()
    const duration = 1000
    let rafId: number
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(eased * score))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [saved, score])

  // ── Confetti burst for top-100 ───────────────────────────────────────────────
  useEffect(() => {
    if (!saved || rank === null || rank > 100) return
    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.5 },
        colors: ['#C41E3A', '#D4751E', '#B8860B', '#FFF8E7', '#5C3D2E'],
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [saved, rank])

  // ── Save + generate ──────────────────────────────────────────────────────────
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
      localStorage.setItem('longq_kopi_player_name', playerName.trim())
      const currentBest = parseInt(localStorage.getItem(PERSONAL_BEST_KEY) ?? '0', 10)
      if (score > currentBest) localStorage.setItem(PERSONAL_BEST_KEY, score.toString())
    } catch (err) {
      console.error('Failed to save score:', err)
    } finally {
      savedNameRef.current = playerName.trim()
      setGenerating(false)
      setSaved(true)
      setChangingName(false)
    }
  }, [playerName, score, drinksServed, avgSeconds, datetime, generating])

  // Auto-save for returning players on mount
  useEffect(() => {
    if (isReturningPlayer) handleSaveAndGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Card capture (delayed 1.1 s so count-up completes first) ────────────────
  useEffect(() => {
    if (!saved || cardBlob || cardError) return
    let cancelled = false
    const capture = async () => {
      // Wait for count-up animation before enabling the share button
      await new Promise<void>(resolve => setTimeout(resolve, 1100))
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
      if (cancelled || !cardRef.current) return
      try {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#FFF8E7', scale: 2, logging: false,
        })
        if (cancelled) return
        canvas.toBlob(blob => {
          if (!cancelled) {
            if (blob) setCardBlob(blob)
            else setCardError(true)
          }
        }, 'image/png')
      } catch {
        if (!cancelled) setCardError(true)
      }
    }
    capture()
    return () => { cancelled = true }
  }, [saved, cardBlob, cardError])

  // ── Share ────────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!cardBlob) return
    await shareScore(
      { name: playerName.trim(), score, drinksServed, avgSeconds, cardImageBlob: cardBlob },
      () => {
        setShowTooltip(true)
        setTimeout(() => setShowTooltip(false), 4000)
      },
    )
  }, [cardBlob, playerName, score, drinksServed, avgSeconds])

  // ── Name change ──────────────────────────────────────────────────────────────
  const handleChangeName = useCallback(() => {
    setChangingName(true)
    setSaved(false)
    setCardBlob(null)
    setCardError(false)
    setDisplayScore(0)
  }, [])

  const handleCancelChangeName = useCallback(() => {
    setPlayerName(savedNameRef.current)
    setChangingName(false)
    setSaved(true)
    setCardBlob(null)
    setCardError(false)
    setDisplayScore(0)
  }, [])

  const cardReady = cardBlob !== null
  const showNameForm = (!saved && !isReturningPlayer) || changingName

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
          /* ── GAME OVER SCREEN — new players only ──────────────────────────── */
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
            <p className="text-xs text-kopi-brown/40 mb-3">{formattedDate}</p>

            {rank !== null && rank <= 100 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warm-yellow/50 border border-warm-yellow/70 mb-3">
                <span className="text-base">🏆</span>
                <p className="text-xs font-display font-bold text-kopi-brown text-left leading-tight">
                  You're #{rank} all-time! Save your score to register your rank.
                </p>
              </div>
            )}

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
          /* ── SHARE VIEW ───────────────────────────────────────────────────── */
          <div className="text-center">
            {showNameForm ? (
              /* Name entry / name-change form */
              <div className="space-y-4">
                <h3 className="font-display text-2xl font-bold mb-2" style={{ color: theme.accent }}>
                  {changingName ? 'Change Name' : 'Share Your Score'}
                </h3>
                {changingName ? (
                  <p className="text-sm text-kopi-brown/60">
                    Enter a new name — your card will be regenerated.
                  </p>
                ) : rank !== null && rank <= 100 ? (
                  <p className="text-sm font-display font-bold" style={{ color: theme.accent }}>
                    No. {rank} all-time — enter your name to lock it in.
                  </p>
                ) : (
                  <p className="text-sm text-kopi-brown/60">
                    Enter your name to save your score and generate a shareable result card.
                  </p>
                )}
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
                    onClick={changingName ? handleCancelChangeName : () => setShowShareForm(false)}
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-200 text-kopi-brown
                      font-display font-bold cursor-pointer transition-colors hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSaveAndGenerate}
                    disabled={!playerName.trim() || generating}
                    className="flex-1 px-4 py-2 rounded-xl text-white font-display font-bold
                      cursor-pointer transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: theme.accent }}
                  >
                    {generating ? 'Saving…' : 'Save & Share'}
                  </button>
                </div>
              </div>
            ) : !saved ? (
              /* Returning player: auto-save in progress */
              <p className="py-10 text-kopi-brown/50 text-sm">Setting up your card…</p>
            ) : (
              /* ── Card view ──────────────────────────────────────────────── */
              <div className="space-y-3">

                {/* Score reveal header */}
                <div className="pb-3 border-b border-kopi-brown/10">
                  {isReturningPlayer && (
                    <p className="font-display text-xl font-bold text-hawker-red mb-1">Game Over!</p>
                  )}

                  {/* Animated count-up */}
                  <motion.p
                    className="font-display text-6xl font-bold leading-none"
                    style={{ color: theme.accent }}
                    initial={{ scale: 0.75, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                  >
                    {displayScore}
                  </motion.p>
                  <p className="text-xs text-kopi-brown/50 mt-1">points</p>

                  {/* Personal best badge */}
                  {isPersonalBest && (
                    <motion.p
                      className="text-xs font-display font-bold mt-1.5"
                      style={{ color: theme.accent }}
                      initial={{ y: -6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, type: 'spring', damping: 14 }}
                    >
                      🎉 New personal best!
                    </motion.p>
                  )}

                  {/* Rank badge */}
                  {rank !== null && rank <= 100 && (
                    <motion.div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mt-2"
                      style={{ backgroundColor: theme.badgeBg }}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', delay: 0.8, damping: 12, stiffness: 220 }}
                    >
                      <span className="text-sm">🏆</span>
                      <span className="font-display font-bold text-sm" style={{ color: theme.accent }}>
                        #{rank} all-time
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Score card — slide-up entrance, captured by html2canvas */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.15 }}
                >
                  <div
                    ref={cardRef}
                    style={{
                      width: 300,
                      backgroundColor: '#FFF8E7',
                      borderRadius: 16,
                      border: `2px solid ${theme.border}`,
                      margin: '0 auto',
                      fontFamily: '"Fredoka", sans-serif',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ height: 5, backgroundColor: theme.accent }} />
                    <div style={{ padding: 20, textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block',
                        backgroundColor: theme.badgeBg,
                        borderRadius: 20,
                        padding: '3px 10px',
                        marginBottom: 10,
                      }}>
                        <span style={{ fontSize: 11, color: theme.accent, fontWeight: 600 }}>
                          {theme.emoji} {levelName}
                        </span>
                      </div>
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#5C3D2E', margin: '0 0 10px' }}>LongQ Kopi</p>
                      <p style={{ fontSize: 14, color: 'rgba(92, 61, 46, 0.6)', margin: 0 }}>{savedNameRef.current}</p>
                      <p style={{ fontSize: 48, fontWeight: 700, color: theme.accent, margin: '4px 0' }}>{score}</p>
                      <p style={{ fontSize: 14, color: 'rgba(92, 61, 46, 0.6)', margin: 0 }}>points</p>
                      <div style={{
                        display: 'flex', justifyContent: 'center',
                        gap: 12, margin: '10px 0', color: 'rgba(92, 61, 46, 0.6)',
                      }}>
                        <span style={{ fontSize: 12 }}>{drinksServed} drinks</span>
                        <span style={{ fontSize: 12 }}>|</span>
                        <span style={{ fontSize: 12 }}>{avgSeconds}s avg</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(92, 61, 46, 0.4)', margin: '4px 0 0' }}>{formattedDate}</p>
                      {rank !== null && rank <= 100 && (
                        <p style={{ fontSize: 12, color: theme.accent, fontWeight: 700, margin: '6px 0 2px' }}>
                          No. {rank} in all-time leaderboard
                        </p>
                      )}
                      <p style={{ fontSize: 11, color: 'rgba(92, 61, 46, 0.4)', margin: '4px 0 0' }}>
                        Can you beat my score?
                      </p>
                      <p style={{ fontSize: 11, color: theme.accent, margin: '8px 0 0', fontWeight: 600 }}>
                        longqkopi.vercel.app
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Change name */}
                <button
                  onClick={handleChangeName}
                  className="text-xs text-kopi-brown/40 hover:text-kopi-brown/60 transition-colors"
                >
                  Not {savedNameRef.current}? Change name
                </button>

                {/* Status */}
                {cardError && (
                  <p className="text-xs text-hawker-red/80 text-center">Could not generate score card</p>
                )}
                {!cardReady && !cardError && (
                  <p className="text-xs text-kopi-brown/50 text-center">Preparing your card…</p>
                )}

                {/* Share button — pulses when it becomes ready */}
                <motion.button
                  key={cardReady ? 'ready' : 'loading'}
                  initial={cardReady ? { scale: 0.93, opacity: 0.7 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 14 }}
                  onClick={handleShare}
                  disabled={!cardReady}
                  aria-label="Share score"
                  className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                    text-white font-display font-bold cursor-pointer transition-opacity
                    disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: cardReady ? theme.accent : undefined }}
                >
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Share
                </motion.button>

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
                    className="flex-1 px-4 py-2 rounded-xl text-white font-display font-bold
                      cursor-pointer transition-opacity hover:opacity-90"
                    style={{ backgroundColor: theme.accent }}
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
