import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/ui/PageWrapper'
import HUD from '../components/game/HUD'
import CustomerQueue from '../components/game/CustomerQueue'
import Counter from '../components/game/Counter'
import OpponentTracker from '../components/game/OpponentTracker'
import { useVersusGame } from '../hooks/useVersusGame'
import { useVersusRoom } from '../hooks/useVersusRoom'
import { useSounds } from '../hooks/useSounds'
import { loadSettings } from './Settings'
import { loadShortcuts, type ShortcutEntry } from '../data/keyboardShortcuts'
import { trackEvent } from '../utils/analytics'

interface LocationState {
  role: 'host' | 'guest'
  winTarget: number
  startLevel: number
}

export default function VersusGame() {
  const navigate = useNavigate()
  const location = useLocation()
  const { roomCode = '' } = useParams<{ roomCode: string }>()
  const state = location.state as LocationState | null

  const role = state?.role ?? 'host'
  const winTarget = state?.winTarget ?? 20
  const startLevel = state?.startLevel ?? 1

  const game = useVersusGame({ roomCode, role, winTarget, startLevel })
  const { room, myDrinks, opponentDrinks, isWinner, isLoser, opponentDisconnectedAt } =
    useVersusRoom(roomCode, role)

  const sounds = useSounds()
  const [shortcuts, setShortcuts] = useState<ShortcutEntry[]>([])
  const prevResultRef = useRef(game.orderResult)
  const prevRoomWinner = useRef<string | null>(null)

  // Load shortcuts and start game on mount
  useEffect(() => {
    setShortcuts(loadShortcuts())
    game.startGame(startLevel > 1 ? startLevel : undefined)
    trackEvent('versus_game_start')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sound effects on order result changes
  useEffect(() => {
    if (game.orderResult !== prevResultRef.current) {
      if (game.orderResult === 'correct') sounds.playServeSuccess()
      else if (game.orderResult === 'wrong' || game.orderResult === 'timeout') sounds.playServeFail()
    }
    prevResultRef.current = game.orderResult
  }, [game.orderResult, sounds])

  // Pause timer when winner is declared; restart game on rematch
  useEffect(() => {
    if (!room) return
    const winner = room.winner

    if (winner !== null && game.timer.isRunning) {
      game.pauseTimer()
    }

    if (prevRoomWinner.current !== null && winner === null && room.status === 'playing') {
      game.startGame(startLevel > 1 ? startLevel : undefined)
    }
    prevRoomWinner.current = winner
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.winner, room?.status])

  // Keyboard shortcuts
  useEffect(() => {
    const settings = loadSettings()
    if (!settings.keyboardShortcutsEnabled) return
    if (shortcuts.length === 0) return

    const keyMap = new Map(shortcuts.map(s => [s.key.toLowerCase(), s.action]))

    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.phase !== 'playing') return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const key = e.key === ' ' ? ' ' : e.key.toLowerCase()
      const action = keyMap.get(key)
      if (!action) return

      e.preventDefault()
      switch (action) {
        case 'kopi': game.addBase('Kopi'); sounds.playClick(); break
        case 'teh': game.addBase('Teh'); sounds.playClick(); break
        case 'lessBase': game.toggleLess(); sounds.playClick(); break
        case 'condensedMilk': game.setMilk('Condensed'); sounds.playClick(); break
        case 'lessCondensed': game.toggleCondensedLess(); sounds.playClick(); break
        case 'evaporatedMilk': game.setMilk('Evaporated'); sounds.playClick(); break
        case 'sugar': game.addSugar(); sounds.playClick(); break
        case 'lessSugar': game.toggleSugarLess(); sounds.playClick(); break
        case 'ice': game.addIce(); sounds.playClick(); break
        case 'hotWater': game.addHotWater(); sounds.playClick(); break
        case 'discard': game.discardCup(); sounds.playClick(); break
        case 'serve': game.serve(); break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [game, sounds, shortcuts])

  const withClick = <T extends unknown[]>(fn: (...args: T) => void) =>
    (...args: T) => { sounds.playClick(); fn(...args) }

  const handleOpponentForfeited = useCallback(() => {
    fetch('/api/versus/declare-winner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, role }),
    }).catch(() => {})
  }, [roomCode, role])

  const handleChallengeAgain = useCallback(async () => {
    try {
      await fetch('/api/versus/rematch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode }),
      })
      // game.startGame() is triggered by the Realtime room update
    } catch {
      // Ignore — the room Realtime subscription will handle the restart
    }
  }, [roomCode])

  // Guard: no state means they navigated here directly — redirect to lobby
  if (!state) {
    navigate('/versus', { replace: true })
    return null
  }

  if (game.phase === 'idle') {
    return (
      <PageWrapper className="flex items-center justify-center h-full bg-cream">
        <p className="font-display text-2xl text-kopi-brown/50">Loading...</p>
      </PageWrapper>
    )
  }

  const gameOver = room?.winner !== null && room?.status === 'finished'

  return (
    <PageWrapper className="flex flex-col h-full bg-gradient-to-b from-warm-yellow/30 to-cream overflow-hidden">
      {/* HUD — no score in versus mode */}
      <div className="flex-shrink-0 px-3 pt-2 md:px-6 md:pt-3">
        <HUD
          score={game.score}
          lives={game.lives}
          secondsRemaining={game.timer.secondsRemaining}
          isTimerRunning={game.timer.isRunning}
          lastPoints={game.lastPoints}
          level={game.level}
          cupNumber={game.cupNumber}
          hideScore
        />
      </div>

      {/* Opponent progress */}
      <div className="flex-shrink-0">
        <OpponentTracker
          opponentDrinks={opponentDrinks}
          winTarget={winTarget}
          opponentDisconnectedAt={opponentDisconnectedAt}
          onOpponentForfeited={handleOpponentForfeited}
          guestJoined={room?.guest_device_id != null}
        />
      </div>

      {/* Customer area */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-warm-yellow/10 via-transparent to-amber-100/30" />

        {game.currentOrder && (
          <CustomerQueue
            currentCustomer={game.customer}
            queueCustomers={game.queueCustomers}
            orderText={game.orderDisplayText}
            orderResult={game.orderResult}
            expletive={game.expletive}
            correctReaction={game.correctReaction}
            regularName={game.regularName}
            isSecondVisit={game.isSecondVisit}
            timerUrgent={game.timer.secondsRemaining <= 3 && game.timer.isRunning}
          />
        )}

        {/* Urgency vignette */}
        <AnimatePresence>
          {game.timer.secondsRemaining <= 3 && game.timer.isRunning && game.phase === 'playing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.25, 0.55, 0.25] }}
              exit={{ opacity: 0, transition: { duration: 0.3, repeat: 0 } }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 35%, rgba(196,30,58,0.38) 100%)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Counter — shakes on error, no error panel */}
      <div className="flex-shrink-0 relative">
        <motion.div
          animate={
            game.phase === 'errorAck'
              ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
              : { x: 0 }
          }
          transition={
            game.phase === 'errorAck'
              ? { duration: 0.4, ease: 'easeInOut' }
              : {}
          }
        >
          <Counter
            cup={game.cup}
            lessToggle={game.lessToggle}
            sugarLessToggle={game.sugarLessToggle}
            condensedLessToggle={game.condensedLessToggle}
            shortcuts={shortcuts}
            onAddBase={withClick(game.addBase)}
            onToggleLess={withClick(game.toggleLess)}
            onSetMilk={withClick(game.setMilk)}
            onToggleCondensedLess={withClick(game.toggleCondensedLess)}
            onAddSugar={withClick(game.addSugar)}
            onToggleSugarLess={withClick(game.toggleSugarLess)}
            onAddIce={withClick(game.addIce)}
            onAddHotWater={withClick(game.addHotWater)}
            onDiscard={withClick(game.discardCup)}
            onServe={game.serve}
            disabled={game.phase !== 'playing'}
          />
        </motion.div>
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-cream rounded-3xl p-7 mx-4 max-w-xs w-full shadow-2xl text-center"
            >
              {isWinner ? (
                <>
                  <div className="text-5xl mb-3">🏆</div>
                  <h2 className="font-display text-3xl font-bold text-hawker-green mb-1">
                    You Win!
                  </h2>
                  <p className="text-sm text-kopi-brown/60 font-body mb-6">
                    You served {myDrinks} drinks first!
                  </p>
                  <p className="text-xs text-kopi-brown/40 font-body mb-4">
                    Waiting for opponent to challenge again...
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full px-4 py-2.5 rounded-xl bg-kopi-brown/15 hover:bg-kopi-brown/25
                      text-kopi-brown font-display font-bold text-sm cursor-pointer transition-colors"
                  >
                    Back to Menu
                  </button>
                </>
              ) : isLoser ? (
                <>
                  <div className="text-5xl mb-3">😔</div>
                  <h2 className="font-display text-3xl font-bold text-hawker-red mb-1">
                    You Lose
                  </h2>
                  <p className="text-sm text-kopi-brown/60 font-body mb-6">
                    Opponent served {opponentDrinks} drinks. You had {myDrinks}.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleChallengeAgain}
                      className="w-full px-4 py-3 rounded-xl bg-hawker-red hover:bg-hawker-red/90
                        text-white font-display font-bold text-lg cursor-pointer transition-colors shadow-md"
                    >
                      Challenge Again!
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="w-full px-4 py-2 rounded-xl bg-kopi-brown/15 hover:bg-kopi-brown/25
                        text-kopi-brown font-display font-bold text-sm cursor-pointer transition-colors"
                    >
                      Back to Menu
                    </button>
                  </div>
                </>
              ) : (
                // Fallback: game finished but role unclear (shouldn't happen)
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-4 py-2.5 rounded-xl bg-kopi-brown/15 hover:bg-kopi-brown/25
                    text-kopi-brown font-display font-bold text-sm cursor-pointer transition-colors"
                >
                  Back to Menu
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
