import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/ui/PageWrapper'
import HUD from '../components/game/HUD'
import CustomerQueue from '../components/game/CustomerQueue'
import Counter from '../components/game/Counter'
import GameOverModal from '../components/game/GameOverModal'
import LevelTransition from '../components/game/LevelTransition'
import ErrorExplanation from '../components/game/ErrorExplanation'
import { useGameState } from '../hooks/useGameState'
import { useSounds } from '../hooks/useSounds'
import { useMusicManager } from '../hooks/useMusicManager'
import { loadSettings } from './Settings'
import { loadShortcuts, type ShortcutEntry } from '../data/keyboardShortcuts'

export default function Game() {
  const navigate = useNavigate()
  const game = useGameState()
  const sounds = useSounds()
  const [soundEnabled] = useState(() => loadSettings().soundEnabled)
  const { setMusicState, play, stop, duck, unduck } = useMusicManager(soundEnabled)
  const prevPhaseRef = useRef(game.phase)
  const prevResultRef = useRef(game.orderResult)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [shortcuts, setShortcuts] = useState<ShortcutEntry[]>([])

  // Load shortcuts on mount
  useEffect(() => {
    setShortcuts(loadShortcuts())
  }, [])

  // Start game on mount
  useEffect(() => {
    game.startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sound effects on state changes
  useEffect(() => {
    if (game.orderResult !== prevResultRef.current) {
      if (game.orderResult === 'correct') sounds.playServeSuccess()
      else if (game.orderResult === 'wrong' || game.orderResult === 'timeout') sounds.playServeFail()
    }
    prevResultRef.current = game.orderResult
  }, [game.orderResult, sounds])

  useEffect(() => {
    const prev = prevPhaseRef.current

    if (game.phase === 'gameover' && prev !== 'gameover') {
      sounds.playGameOver()
      stop()
    }
    if (game.phase === 'playing' && (prev === 'idle' || prev === 'gameover')) {
      play()
    }
    if (game.phase === 'errorAck') {
      duck()
    }
    if (prev === 'errorAck' && game.phase === 'transition') {
      unduck()
    }
    if (game.phase === 'levelup') {
      duck()
    }
    if (prev === 'levelup' && game.phase === 'playing') {
      unduck()
      setMusicState(game.level.level as 1|2|3|4|5, game.lives === 1)
    }

    prevPhaseRef.current = game.phase
  }, [game.phase, game.level.level, game.lives, sounds, play, stop, duck, unduck, setMusicState])

  // Crossfade to danger track when lives drop to 1
  useEffect(() => {
    if (game.phase === 'playing' && game.lives === 1) {
      setMusicState(game.level.level as 1|2|3|4|5, true)
    }
  }, [game.lives, game.phase, game.level.level, setMusicState])

  // Keyboard shortcuts
  useEffect(() => {
    const settings = loadSettings()
    if (!settings.keyboardShortcutsEnabled) return
    if (shortcuts.length === 0) return

    const keyMap = new Map(shortcuts.map(s => [s.key.toLowerCase(), s.action]))

    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.phase !== 'playing') return
      if (showQuitModal) return
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
  }, [game, sounds, shortcuts, showQuitModal])

  // Sound on counter button clicks
  const withClick = <T extends unknown[]>(fn: (...args: T) => void) => {
    return (...args: T) => {
      sounds.playClick()
      fn(...args)
    }
  }

  // Quit modal handlers
  const handleQuitOpen = useCallback(() => {
    if (game.phase !== 'playing') return
    game.pauseTimer()
    setShowQuitModal(true)
  }, [game])

  const handleQuitCancel = useCallback(() => {
    setShowQuitModal(false)
    game.resumeTimer()
  }, [game])

  const handleQuitConfirm = useCallback(() => {
    setShowQuitModal(false)
    stop(500)
    navigate('/')
  }, [navigate, stop])

  if (game.phase === 'idle') {
    return (
      <PageWrapper className="flex items-center justify-center h-full bg-cream">
        <p className="font-display text-2xl text-kopi-brown/50">Loading...</p>
      </PageWrapper>
    )
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
          onQuit={handleQuitOpen}
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
          />
        )}
      </div>

      {/* Counter — error panel slides up over this when errorAck phase */}
      <div className="flex-shrink-0 relative">
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
        <AnimatePresence>
          {game.phase === 'errorAck' && game.mismatches.length > 0 && (
            <ErrorExplanation
              mismatches={game.mismatches}
              quote={game.currentQuote}
              onDismiss={game.acknowledgeError}
            />
          )}
        </AnimatePresence>
      </div>

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
              <h3 className="font-display text-xl font-bold text-kopi-brown mb-2">Quit to main menu?</h3>
              <p className="text-sm text-kopi-brown/60 mb-5">Your current score will not be saved.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleQuitConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-hawker-red hover:bg-hawker-red/90 text-white
                    font-display font-bold cursor-pointer transition-colors"
                >
                  Quit
                </button>
                <button
                  onClick={handleQuitCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-kopi-brown/20 hover:bg-kopi-brown/30 text-kopi-brown
                    font-display font-bold cursor-pointer transition-colors"
                >
                  Keep Playing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Transition Overlay */}
      <AnimatePresence>
        {game.phase === 'levelup' && (
          <LevelTransition
            level={game.level}
            comment={game.levelUpComment}
          />
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {game.phase === 'gameover' && (
          <GameOverModal
            score={game.score}
            drinksServed={game.drinksServed}
            avgTime={game.avgTime}
            level={game.level.level}
            levelName={game.level.name}
            onPlayAgain={() => game.startGame()}
            onMainMenu={() => navigate('/')}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
