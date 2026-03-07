import { useEffect, useRef, useState, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/ui/PageWrapper'
import HUD from '../components/game/HUD'
import CustomerQueue from '../components/game/CustomerQueue'
import Counter from '../components/game/Counter'
import PartyProgressBars from '../components/game/PartyProgressBars'
import { usePartyGame } from '../hooks/usePartyGame'
import { usePartyRoom } from '../hooks/usePartyRoom'
import { useSounds } from '../hooks/useSounds'
import { useMusicManager } from '../hooks/useMusicManager'
import { loadSettings } from './Settings'
import { loadShortcuts, type ShortcutEntry } from '../data/keyboardShortcuts'
import { trackEvent } from '../utils/analytics'
import { STARTING_LIVES } from '../data/gameConfig'
import { getSaboCharges, INGREDIENT_LABELS, ALL_INGREDIENTS, type SaboIngredient } from '../utils/saboConfig'
import type { PartyPlayer } from '../hooks/usePartyRoom'

function ordinalSuffix(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th'
  switch (n % 10) {
    case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'
  }
}

interface LocationState {
  deviceId: string
  playerName: string
  winTarget?: number
  startLevel?: number
}

export default function PartyGame() {
  const navigate = useNavigate()
  const location = useLocation()
  const { roomCode = '' } = useParams<{ roomCode: string }>()
  const state = location.state as LocationState | null

  const deviceId = state?.deviceId ?? ''
  const playerName = state?.playerName ?? ''

  const { room, players, activePlayers, myPlayer, topOpponents, isWinner, isFinished } =
    usePartyRoom(roomCode, deviceId)

  // Prefer values from location.state (available immediately on mount) so the
  // countdown and win-check start without waiting for usePartyRoom's fetch.
  const winTarget = state?.winTarget ?? room?.win_target ?? 20
  const startLevel = state?.startLevel ?? room?.start_level ?? 1

  const game = usePartyGame({ roomCode, deviceId, winTarget, startLevel })

  const sounds = useSounds()
  const [soundEnabled] = useState(() => loadSettings().soundEnabled)
  const { setMusicState, play, stop, duck, unduck } = useMusicManager(soundEnabled)
  const [shortcuts, setShortcuts] = useState<ShortcutEntry[]>([])
  const prevResultRef = useRef(game.orderResult)
  const prevPhaseRef = useRef(game.phase)
  const prevLevelRef = useRef(game.level.level)
  const gameStarted = useRef(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [saboModalOpen, setSaboModalOpen] = useState(false)
  const [saboNotification, setSaboNotification] = useState<string | null>(null)
  const saboNotifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Start at 3 immediately so the first render shows "3", not "Loading..."
  const [countdown, setCountdown] = useState<number | null>(3)
  const [showWinnerSplash, setShowWinnerSplash] = useState(false)
  const winnerSplashDoneRef = useRef(false)
  const wasFinishedRef = useRef(false)

  // Guard: no state → redirect to lobby (must be in useEffect — calling navigate during
  // render causes React to warn about updating a component while rendering a different one)
  useEffect(() => {
    if (!state || !deviceId) navigate('/party', { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!state || !deviceId) return null

  // Load shortcuts on mount
  useEffect(() => {
    setShortcuts(loadShortcuts())
    trackEvent('party_game_start')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start 3-2-1 countdown immediately on mount — no need to wait for usePartyRoom
  // because startLevel is already in location.state.
  useEffect(() => {
    if (gameStarted.current) return
    gameStarted.current = true
    const lvl = startLevel
    const t1 = setTimeout(() => setCountdown(2), 1000)
    const t2 = setTimeout(() => setCountdown(1), 2000)
    const t3 = setTimeout(() => {
      setCountdown(null)
      game.startGame(lvl > 1 ? lvl : undefined)
    }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Pause timer when finished
  useEffect(() => {
    if (isFinished && game.timer.isRunning) {
      game.pauseTimer()
    }
  }, [isFinished, game.timer.isRunning, game.pauseTimer])

  // When the host resets the room (status: finished → waiting), redirect all players
  // who are still on this page back to the lobby. Without this, the game-over overlay
  // disappears (isFinished → false) but game.phase remains 'playing', leaving the
  // counter fully enabled and unguarded.
  useEffect(() => {
    if (isFinished) {
      wasFinishedRef.current = true
    } else if (wasFinishedRef.current && room?.status === 'waiting') {
      navigate('/party', { state: { rejoinCode: roomCode } })
    }
  }, [isFinished, room?.status, navigate, roomCode])

  // Music: phase transitions
  useEffect(() => {
    const prev = prevPhaseRef.current
    if (game.phase === 'playing' && prev === 'idle') play()
    if (game.phase === 'errorAck') duck()
    if (prev === 'errorAck' && (game.phase === 'transition' || game.phase === 'playing')) unduck()
    if (isFinished && prev !== 'idle') stop()
    prevPhaseRef.current = game.phase
  }, [game.phase, isFinished, play, stop, duck, unduck])

  // Music: update track on level change
  useEffect(() => {
    if (game.level.level !== prevLevelRef.current) {
      prevLevelRef.current = game.level.level
      if (game.phase === 'playing' || game.phase === 'transition') {
        setMusicState(game.level.level as 1|2|3|4|5, game.lives <= 1)
      }
    }
  }, [game.level.level, game.phase, game.lives, setMusicState])

  // Sound effects on order result changes
  useEffect(() => {
    if (game.orderResult !== prevResultRef.current) {
      if (game.orderResult === 'correct') sounds.playServeSuccess()
      else if (game.orderResult === 'wrong' || game.orderResult === 'timeout') sounds.playServeFail()
    }
    prevResultRef.current = game.orderResult
  }, [game.orderResult, sounds])

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

  // Fire confetti burst for winner
  const fireConfetti = useCallback(() => {
    const burst = (angle: number, origin: { x: number; y: number }) =>
      confetti({ particleCount: 80, spread: 70, angle, origin, colors: ['#C41E3A', '#F39C12', '#27AE60', '#9B59B6', '#3498DB'] })
    burst(60, { x: 0, y: 0.6 })
    burst(120, { x: 1, y: 0.6 })
    setTimeout(() => { burst(80, { x: 0.2, y: 0.5 }); burst(100, { x: 0.8, y: 0.5 }) }, 300)
  }, [])

  // Trigger confetti when finished and we're the winner
  useEffect(() => {
    if (isFinished && isWinner) {
      const t = setTimeout(fireConfetti, 400)
      return () => clearTimeout(t)
    }
  }, [isFinished, isWinner, fireConfetti])

  // Winner splash: show for 1.8 s then reveal full standings
  useEffect(() => {
    if (!isFinished || winnerSplashDoneRef.current) return
    winnerSplashDoneRef.current = true
    setShowWinnerSplash(true)
    const t = setTimeout(() => setShowWinnerSplash(false), 1800)
    return () => clearTimeout(t)
  }, [isFinished])

  // Sabo notification watcher
  useEffect(() => {
    if (!game.latestSabo) return
    const ev = game.latestSabo
    const label = INGREDIENT_LABELS[ev.ingredient as SaboIngredient] ?? ev.ingredient
    setSaboNotification(`${ev.from_name} sabo-ed ${ev.to_name} — no ${label} for 5 turns!`)
    if (saboNotifTimerRef.current) clearTimeout(saboNotifTimerRef.current)
    saboNotifTimerRef.current = setTimeout(() => setSaboNotification(null), 3500)
  }, [game.latestSabo])

  const handleQuitOpen = useCallback(() => {
    if (isFinished) return
    game.pauseTimer()
    setShowQuitModal(true)
  }, [game, isFinished])

  const handleQuitCancel = useCallback(() => {
    setShowQuitModal(false)
    game.resumeTimer()
  }, [game])

  const handleQuitConfirm = useCallback(async () => {
    setShowQuitModal(false)
    stop(500)
    try {
      await fetch('/api/party/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, deviceId, action: 'disconnect' }),
      })
    } catch { /* non-critical */ }
    navigate('/')
  }, [stop, roomCode, deviceId, navigate])

  const handleSabo = async (opp: PartyPlayer) => {
    setSaboModalOpen(false)
    await fetch('/api/party/sabo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode,
        fromDeviceId: deviceId,
        fromName: playerName,
        toDeviceId: opp.device_id,
        toName: opp.player_name,
      }),
    }).catch(() => {})
  }

  const handleReturnToRoom = async () => {
    stop(500)
    try {
      await fetch('/api/party/return-to-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, deviceId, playerName }),
      })
    } catch { /* non-critical */ }
    navigate('/party', { state: { rejoinCode: roomCode } })
  }

  const startLivesCount = startLevel > 1 ? STARTING_LIVES + 1 : STARTING_LIVES
  const livesLost = Math.max(0, startLivesCount - game.lives)
  const myDrinks = myPlayer?.drinks ?? 0

  const maxSaboCharges = getSaboCharges(winTarget)
  const usedSaboCharges = myPlayer?.sabos_used ?? 0
  const remainingSaboCharges = Math.max(0, maxSaboCharges - usedSaboCharges)

  const sortedByDrinks = [...activePlayers].sort((a, b) => b.drinks - a.drinks)
  const myCurrentRank = sortedByDrinks.findIndex(p => p.device_id === deviceId) + 1
  const winnerName = players.find(p => p.device_id === room?.winner)?.player_name ?? 'Someone'

  if (game.phase === 'idle') {
    return (
      <PageWrapper className="flex items-center justify-center h-full bg-cream">
        {/* Relative container so absolute children overlap — entry + exit run
            simultaneously giving each number exactly 1 000 ms on screen. */}
        <div className="relative flex items-center justify-center w-48 h-48">
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                key={countdown}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="absolute flex flex-col items-center gap-3"
              >
                <span className="font-display text-9xl font-bold text-purple-600 leading-none">
                  {countdown}
                </span>
                <span className="font-body text-lg text-kopi-brown/50">Get ready!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageWrapper>
    )
  }

  // Sorted final standings for game over overlay
  const standings = [...players].sort((a, b) => b.drinks - a.drinks)

  // Highlight helpers: best (lowest) avg time among players who served ≥1 drink
  const servingPlayers = standings.filter(p => p.drinks > 0)
  const minAvgTimeMs = servingPlayers.length > 0
    ? Math.min(...servingPlayers.map(p => p.avg_time_ms))
    : null
  const minLivesLost = standings.length > 0
    ? Math.min(...standings.map(p => p.lives_lost))
    : null

  // Pre-compute game-over header values outside JSX so AnimatePresence receives a stable
  // element tree (IIFE inside AnimatePresence creates a new element object every render,
  // causing AnimatePresence to treat it as a new entering child — resulting in two
  // overlapping overlays being mounted simultaneously).
  const myRank = standings.findIndex(p => p.device_id === deviceId) + 1
  const totalPlayers = standings.length
  const isPodium = myRank >= 2 && myRank <= 3 && totalPlayers > 5
  let gameOverEmoji = '☕'
  let gameOverTitle = 'Game Over'
  let gameOverTitleColor = 'text-kopi-brown'
  let gameOverSubtitle = ''
  if (myRank === 1) {
    gameOverEmoji = '🏆'; gameOverTitle = 'You Win!'; gameOverTitleColor = 'text-hawker-green'
  } else if (isPodium) {
    gameOverEmoji = myRank === 2 ? '🥈' : '🥉'
    gameOverTitle = "You're on the Podium!"
    gameOverTitleColor = 'text-amber-600'
    gameOverSubtitle = myRank === 2 ? 'Silver — so close!' : 'Bronze — well played!'
  } else if (myRank <= 3) {
    gameOverEmoji = myRank === 2 ? '😤' : '😩'
    gameOverTitle = myRank === 2 ? 'So Close!' : 'Not Quite'
    gameOverTitleColor = 'text-kopi-brown'
  } else if (myRank > 0) {
    const sadEmojis = ['😔', '😤', '😭', '🫠', '😮‍💨']
    gameOverEmoji = sadEmojis[Math.min(myRank - 4, sadEmojis.length - 1)]
    gameOverTitle = myRank >= totalPlayers ? 'Last Place...' : 'Keep Grinding!'
    gameOverTitleColor = 'text-kopi-brown/70'
  }

  return (
    <PageWrapper className="flex flex-col h-full bg-gradient-to-b from-warm-yellow/30 to-cream overflow-hidden">
      {/* HUD */}
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
          livesLost={livesLost}
          onQuit={handleQuitOpen}
        />
      </div>

      {/* Party progress bars + live rank + sabo button */}
      <div className="flex-shrink-0">
        <PartyProgressBars
          myDrinks={myDrinks}
          myName={playerName}
          topOpponents={topOpponents}
          winTarget={winTarget}
          myBlockedCount={game.blockedIngredients.length}
        />
        <div className="flex items-center justify-between px-3 pb-0.5 min-h-[24px]">
          {activePlayers.length > 1 && myCurrentRank > 0
            ? <p className="text-[11px] text-kopi-brown/40 font-body">
                You're{' '}
                <span className="font-bold text-kopi-brown/60">
                  {myCurrentRank}{ordinalSuffix(myCurrentRank)}
                </span>
                {' '}of {activePlayers.length}
              </p>
            : <span />}

          {maxSaboCharges > 0 && (
            <button
              onClick={() => setSaboModalOpen(true)}
              disabled={remainingSaboCharges === 0 || game.phase !== 'playing' || isFinished}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg
                bg-hawker-red/10 hover:bg-hawker-red/20 text-hawker-red
                font-display font-bold text-xs cursor-pointer transition-colors
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              SABO 🧯 {remainingSaboCharges}
            </button>
          )}
        </div>
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

      {/* Counter — shakes on error */}
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
            blockedIngredients={game.blockedIngredients}
          />
        </motion.div>
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            key="game-over-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <AnimatePresence mode="wait">
              {/* Winner splash — shown for 1.8 s before the full results card */}
              {showWinnerSplash ? (
                <motion.div
                  key="winner-splash"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  <motion.div
                    className="text-7xl"
                    animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                    transition={{ delay: 0.3, duration: 0.7 }}
                  >
                    🏆
                  </motion.div>
                  <div>
                    <motion.p
                      className="font-display text-4xl font-bold text-white drop-shadow-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      {winnerName}
                    </motion.p>
                    <motion.p
                      className="font-body text-lg text-white/80 mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                    >
                      wins the round!
                    </motion.p>
                  </div>
                </motion.div>
              ) : (
                /* Full results card */
                <motion.div
                  key="full-results"
                  initial={{ scale: 0.85, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="bg-cream rounded-3xl p-5 w-full max-w-sm shadow-2xl"
                >
                  {/* Header with animated emoji */}
                  <div className="text-center mb-4">
                    <motion.div
                      className="text-4xl mb-1 inline-block"
                      initial={{ scale: 0, rotate: -20 }}
                      animate={
                        myRank === 1
                          ? { scale: [0, 1.4, 1], rotate: [-20, 10, 0] }
                          : isPodium
                          ? { scale: [0, 1.3, 1], rotate: [0, -8, 0] }
                          : { scale: [0, 1.1, 1], rotate: [0, 5, -5, 0] }
                      }
                      transition={{ delay: 0.15, duration: 0.6, type: 'spring' }}
                    >
                      {gameOverEmoji}
                    </motion.div>
                    <motion.h2
                      className={`font-display text-2xl font-bold ${gameOverTitleColor}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {gameOverTitle}
                    </motion.h2>
                    {gameOverSubtitle && (
                      <motion.p
                        className="text-sm text-kopi-brown/60 font-body mt-0.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 }}
                      >
                        {gameOverSubtitle}
                      </motion.p>
                    )}
                  </div>

                  {/* Standings table — scrollable for large groups */}
                  <div className="bg-white/60 rounded-2xl overflow-hidden mb-4 text-xs">
                    <div className="grid grid-cols-[1.5rem_1fr_3.5rem_3rem_3rem_3rem] font-display font-bold text-kopi-brown/50 uppercase tracking-wide px-2 py-1.5 border-b border-kopi-brown/10">
                      <span>#</span>
                      <span>Name</span>
                      <span className="text-right">Drinks</span>
                      <span className="text-right">Drops</span>
                      <span className="text-right">Avg</span>
                      <span className="text-right">Sabo'd</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {standings.map((p, i) => {
                        const isMe = p.device_id === deviceId
                        const hasFastestAvg = p.avg_time_ms > 0 && p.avg_time_ms === minAvgTimeMs && servingPlayers.length > 1
                        const hasFewestDrops = p.lives_lost === minLivesLost && standings.length > 1 && minLivesLost !== null
                        const avgSec = p.avg_time_ms > 0 ? (p.avg_time_ms / 1000).toFixed(1) + 's' : '—'
                        const maxSabosReceived = Math.max(0, ...standings.map(s => s.sabos_received))
                        const hasMostSabos = p.sabos_received > 0 && p.sabos_received === maxSabosReceived && standings.length > 1

                        return (
                          <motion.div
                            key={p.device_id}
                            className={`grid grid-cols-[1.5rem_1fr_3.5rem_3rem_3rem_3rem] items-center px-2 py-1.5 font-body ${
                              isMe ? 'bg-warm-yellow/30 font-bold' : ''
                            } ${i < standings.length - 1 ? 'border-b border-kopi-brown/5' : ''}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.06 }}
                          >
                            <span className="text-kopi-brown/50 font-display font-bold">{i + 1}</span>
                            <span className="text-kopi-brown truncate">
                              {p.player_name}
                              {p.disconnected_at && <span className="text-kopi-brown/40 ml-1">(left)</span>}
                            </span>
                            <span className="text-kopi-brown font-display font-bold text-right">{p.drinks}</span>
                            <span className={`text-right font-display font-bold ${hasFewestDrops ? 'text-hawker-green' : 'text-kopi-brown/60'}`}>
                              {p.lives_lost > 0 ? `−${p.lives_lost}` : '0'}
                            </span>
                            <span className={`text-right font-display font-bold ${hasFastestAvg ? 'text-purple-600' : 'text-kopi-brown/60'}`}>
                              {avgSec}
                            </span>
                            <span className={`text-right font-display font-bold ${hasMostSabos ? 'text-hawker-red' : 'text-kopi-brown/60'}`}>
                              {p.sabos_received > 0 ? p.sabos_received : '—'}
                            </span>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleReturnToRoom}
                      className="w-full px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-600/90
                        text-white font-display font-bold text-lg cursor-pointer transition-colors shadow-md"
                    >
                      Return to Room
                    </button>
                    <button
                      onClick={() => { stop(500); navigate('/') }}
                      className="w-full px-4 py-2.5 rounded-xl bg-kopi-brown/15 hover:bg-kopi-brown/25
                        text-kopi-brown font-display font-bold text-sm cursor-pointer transition-colors"
                    >
                      Back to Menu
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sabo notification banner — fixed above all content */}
      <AnimatePresence>
        {saboNotification && (
          <motion.div
            key={saboNotification}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 inset-x-0 z-[60] flex justify-center pt-2 px-4 pointer-events-none"
          >
            <div className="bg-hawker-red text-white text-xs font-body px-4 py-2 rounded-xl shadow-lg max-w-xs text-center">
              {saboNotification}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sabo — opponent selection modal */}
      <AnimatePresence>
        {saboModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-cream rounded-3xl p-5 mx-4 max-w-xs w-full shadow-2xl flex flex-col max-h-[80vh]"
            >
              <h3 className="font-display text-lg font-bold text-kopi-brown mb-0.5 text-center flex-shrink-0">Sabo who?</h3>
              <p className="text-xs text-kopi-brown/50 font-body mb-4 text-center flex-shrink-0">
                {remainingSaboCharges} sabo{remainingSaboCharges !== 1 ? 's' : ''} remaining
              </p>
              <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0">
                {activePlayers.filter(p => p.device_id !== deviceId).map(opp => {
                  const fullyBlocked = opp.blocked_ingredients.length >= ALL_INGREDIENTS.length
                  return (
                    <button
                      key={opp.device_id}
                      onClick={() => handleSabo(opp)}
                      disabled={fullyBlocked}
                      className="w-full px-4 py-3 rounded-xl bg-hawker-red hover:bg-hawker-red/90
                        text-white font-display font-bold cursor-pointer transition-colors
                        disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {opp.player_name}
                      {fullyBlocked && <span className="font-normal text-xs ml-1">(fully blocked)</span>}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setSaboModalOpen(false)}
                className="w-full mt-3 text-sm text-kopi-brown/50 hover:text-kopi-brown/70 cursor-pointer font-body flex-shrink-0"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quit confirmation modal */}
      <AnimatePresence>
        {showQuitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-cream rounded-3xl p-6 mx-4 max-w-xs w-full shadow-2xl text-center"
            >
              <h3 className="font-display text-xl font-bold text-kopi-brown mb-2">Leave the party?</h3>
              <p className="text-sm text-kopi-brown/60 mb-5 font-body">
                You'll be disconnected and your friends will play on without you.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleQuitConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-hawker-red hover:bg-hawker-red/90
                    text-white font-display font-bold cursor-pointer transition-colors"
                >
                  Leave
                </button>
                <button
                  onClick={handleQuitCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-kopi-brown/20 hover:bg-kopi-brown/30
                    text-kopi-brown font-display font-bold cursor-pointer transition-colors"
                >
                  Stay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
