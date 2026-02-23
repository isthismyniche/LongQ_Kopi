import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import html2canvas from 'html2canvas'
import { saveScore } from '../../utils/leaderboard'

interface GameOverModalProps {
  score: number
  drinksServed: number
  avgTime: number
  onPlayAgain: () => void
  onMainMenu: () => void
}

export default function GameOverModal({ score, drinksServed, avgTime, onPlayAgain, onMainMenu }: GameOverModalProps) {
  const [showShareForm, setShowShareForm] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [saved, setSaved] = useState(false)
  const [cardGenerated, setCardGenerated] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const datetime = useRef(new Date().toISOString()).current

  const formattedDate = new Date(datetime).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleSaveAndGenerate = useCallback(async () => {
    if (!playerName.trim()) return

    // Save to leaderboard
    await saveScore({
      name: playerName.trim(),
      score,
      datetime,
      drinksServed,
      avgTime: Math.round(avgTime * 10) / 10,
    })
    setSaved(true)
    setCardGenerated(true)
  }, [playerName, score, datetime, drinksServed, avgTime])

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#FFF8E7',
        scale: 2,
      })

      // Use Web Share API on mobile for saving to photo album
      if (navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          if (!blob) return
          const file = new File([blob], `longq-kopi-${score}pts.png`, { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'LongQ Kopi Score',
              text: `I scored ${score} points in LongQ Kopi! Can you beat me?`,
            })
            return
          }
        }, 'image/png')
      } else {
        // Fallback: file download on desktop
        const link = document.createElement('a')
        link.download = `longq-kopi-${score}pts.png`
        link.href = canvas.toDataURL()
        link.click()
      }
    } catch (err) {
      console.error('Failed to generate image:', err)
    }
  }, [score])


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
                <p className="font-display text-xl font-bold text-kopi-brown">{avgTime.toFixed(1)}s</p>
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
                  onChange={(e) => setPlayerName(e.target.value)}
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
                    disabled={!playerName.trim()}
                    className="flex-1 px-4 py-2 rounded-xl bg-hawker-red text-white
                      font-display font-bold cursor-pointer transition-colors hover:bg-hawker-red/90
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Save & Share
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Shareable card — inline styles for html2canvas compatibility */}
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
                    <p style={{ fontSize: 20, fontWeight: 700, color: '#5C3D2E', margin: 0 }}>LongQ Kopi</p>
                    <div style={{ margin: '12px 0' }}>
                      <p style={{ fontSize: 14, color: 'rgba(92, 61, 46, 0.6)', margin: 0 }}>{playerName}</p>
                      <p style={{ fontSize: 48, fontWeight: 700, color: '#C41E3A', margin: '4px 0' }}>{score}</p>
                      <p style={{ fontSize: 14, color: 'rgba(92, 61, 46, 0.6)', margin: 0 }}>points</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '8px 0', color: 'rgba(92, 61, 46, 0.6)' }}>
                      <span style={{ fontSize: 12 }}>{drinksServed} drinks</span>
                      <span style={{ fontSize: 12 }}>|</span>
                      <span style={{ fontSize: 12 }}>{avgTime.toFixed(1)}s avg</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(92, 61, 46, 0.4)', margin: '4px 0 0' }}>{formattedDate}</p>
                    <p style={{ fontSize: 11, color: 'rgba(92, 61, 46, 0.4)', margin: '4px 0 0' }}>Can you beat my score?</p>
                    <p style={{ fontSize: 11, color: '#C41E3A', margin: '8px 0 0', fontWeight: 600 }}>longqkopi.vercel.app</p>
                  </div>
                </div>

                {cardGenerated && (
                  <div className="pt-2">
                    <button
                      onClick={handleDownload}
                      className="w-full px-4 py-2 rounded-xl bg-kopi-brown text-white
                        font-display font-bold cursor-pointer transition-colors hover:bg-kopi-brown/90"
                    >
                      Download
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
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
