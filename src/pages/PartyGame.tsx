import { useEffect, useRef, useState } from 'react'
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

interface LocationState {
  deviceId: string
  playerName: string
}

export default function PartyGame() {
  const navigate = useNavigate()
  const location = useLocation()
  const { roomCode = '' } = useParams<{ roomCode: string }>()
  const state = location.state as LocationState | null

  const deviceId = state?.deviceId ?? ''
  const playerName = state?.playerName ?? ''

  const { room, players, myPlayer, topOpponents, isWinner, isFinished } =
    usePartyRoom(roomCode, deviceId)

  const winTarget = room?.win_target ?? 20
  const startLevel = room?.start_level ?? 1

  const game = usePartyGame({ roomCode, deviceId, winTarget, startLevel })

  const sounds = useSounds()
  const [soundEnabled] = useState(() => loadSettings().soundEnabled)
  const { setMusicState, play, stop, duck, unduck } = useMusicManager(soundEnabled)
  const [shortcuts, setShortcuts] = useState<ShortcutEntry[]>([])
  const prevResultRef = useRef(game.orderResult)
  const prevPhaseRef = useRef(game.phase)
  const prevLevelRef = useRef(game.level.level)
  const gameStarted = useRef(false)

  // Guard: no state → redirect to lobby
  if (!state || !deviceId) {
    navigate('/party', { replace: true })
    return null
  }

  // Load shortcuts on mount
  useEffect(() => {
    setShortcuts(loadShortcuts())
    trackEvent('party_game_start')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start game once room data loads (reads start_level from room — fixes start_level bug)
  useEffect(() => {
    if (!room || gameStarted.current) return
    gameStarted.current = true
    const lvl = room.start_level ?? 1
    game.startGame(lvl > 1 ? lvl : undefined)
  }, [room?.start_level])  // eslint-disable-line react-hooks/exhaustive-deps

  // Pause timer when finished
  useEffect(() => {
    if (isFinished && game.timer.isRunning) {
      game.pauseTimer()
    }
  }, [isFinished, game.timer.isRunning, game.pauseTimer])

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

  const handleQuit = async () => {
    stop(500)
    try {
      await fetch('/api/party/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, deviceId, action: 'disconnect' }),
      })
    } catch { /* non-critical */ }
    navigate('/')
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

  if (game.phase === 'idle') {
    return (
      <PageWrapper className="flex items-center justify-center h-full bg-cream">
        <p className="font-display text-2xl text-kopi-brown/50">Loading...</p>
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
          onQuit={handleQuit}
        />
      </div>

      {/* Party progress bars */}
      <div className="flex-shrink-0">
        <PartyProgressBars
          myDrinks={myDrinks}
          myName={playerName}
          topOpponents={topOpponents}
          winTarget={winTarget}
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
          />
        </motion.div>
      </div>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-cream rounded-3xl p-5 w-full max-w-sm shadow-2xl"
            >
              <div className="text-center mb-4">
                {isWinner ? (
                  <>
                    <div className="text-4xl mb-1">🏆</div>
                    <h2 className="font-display text-2xl font-bold text-hawker-green">You Win!</h2>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-1">☕</div>
                    <h2 className="font-display text-2xl font-bold text-kopi-brown">Game Over</h2>
                  </>
                )}
              </div>

              {/* Standings table */}
              <div className="bg-white/60 rounded-2xl overflow-hidden mb-4 text-xs">
                {/* Header */}
                <div className="grid grid-cols-[1.5rem_1fr_2.5rem_2.5rem_3rem] font-display font-bold text-kopi-brown/50 uppercase tracking-wide px-2 py-1.5 border-b border-kopi-brown/10">
                  <span>#</span>
                  <span>Name</span>
                  <span className="text-right">☕</span>
                  <span className="text-right">−♥</span>
                  <span className="text-right">Avg</span>
                </div>
                {standings.map((p, i) => {
                  const isMe = p.device_id === deviceId
                  const hasFastestAvg = p.avg_time_ms > 0 && p.avg_time_ms === minAvgTimeMs && servingPlayers.length > 1
                  const hasFewestDrops = p.lives_lost === minLivesLost && standings.length > 1 && minLivesLost !== null
                  const avgSec = p.avg_time_ms > 0 ? (p.avg_time_ms / 1000).toFixed(1) + 's' : '—'

                  return (
                    <div
                      key={p.device_id}
                      className={`grid grid-cols-[1.5rem_1fr_2.5rem_2.5rem_3rem] items-center px-2 py-1.5 font-body ${
                        isMe ? 'bg-warm-yellow/30 font-bold' : ''
                      } ${i < standings.length - 1 ? 'border-b border-kopi-brown/5' : ''}`}
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
                    </div>
                  )
                })}
              </div>

              {/* Legend for highlights */}
              {(servingPlayers.length > 1 || standings.length > 1) && (
                <div className="flex gap-3 mb-3 text-[10px] font-body text-kopi-brown/50">
                  {standings.length > 1 && <span><span className="text-hawker-green font-bold">Green −♥</span> = fewest dropped</span>}
                  {servingPlayers.length > 1 && <span><span className="text-purple-600 font-bold">Purple avg</span> = fastest</span>}
                </div>
              )}

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
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
