import { motion, AnimatePresence } from 'framer-motion'
import { STARTING_LIVES, type LevelConfig } from '../../data/gameConfig'

interface HUDProps {
  score: number
  lives: number
  secondsRemaining: number
  isTimerRunning: boolean
  lastPoints: number
  level: LevelConfig
  cupNumber: number
  onQuit?: () => void
}

export default function HUD({ score, lives, secondsRemaining, isTimerRunning, lastPoints, level, cupNumber, onQuit }: HUDProps) {
  const timerFraction = secondsRemaining / level.timerSeconds
  const isUrgent = secondsRemaining <= 5 && isTimerRunning

  return (
    <div className="relative">
      {/* Level + Cup counter */}
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-2">
          {onQuit && (
            <button
              onClick={onQuit}
              aria-label="Quit to main menu"
              className="w-6 h-6 flex items-center justify-center rounded-md
                bg-kopi-brown/15 hover:bg-kopi-brown/25 text-kopi-brown/50 hover:text-kopi-brown
                transition-colors cursor-pointer text-sm font-bold leading-none"
            >
              &times;
            </button>
          )}
          <span className="font-display text-xs font-bold text-kopi-brown/50">
            Lv.{level.level} {level.name}
          </span>
        </div>
        <span className="font-display text-xs font-bold text-kopi-brown/50">
          Cup #{cupNumber + 1}
        </span>
      </div>

      {/* Timer Bar */}
      <div className="w-full h-3 bg-kopi-brown/20 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isUrgent ? 'bg-hawker-red' : 'bg-hawker-green'}`}
          style={{ width: `${timerFraction * 100}%` }}
          animate={isUrgent ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
          transition={isUrgent ? { duration: 0.5, repeat: Infinity } : {}}
        />
      </div>

      {/* Score and Lives */}
      <div className="flex items-center justify-between mt-2 px-1">
        {/* Score */}
        <div className="relative flex items-center gap-2">
          <span className="font-display text-sm font-bold text-kopi-brown/60">SCORE</span>
          <motion.span
            key={score}
            initial={{ scale: 1.3, color: '#C41E3A' }}
            animate={{ scale: 1, color: '#5C3D2E' }}
            className="font-display text-2xl font-bold"
          >
            {score}
          </motion.span>

          {/* Score popup */}
          <AnimatePresence>
            {lastPoints > 0 && (
              <motion.span
                key={`pts-${score}`}
                initial={{ opacity: 1, y: 0, x: 0 }}
                animate={{ opacity: 0, y: -36, x: 8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute -top-1 left-16 font-display text-xl font-bold text-hawker-red pointer-events-none whitespace-nowrap"
              >
                +{lastPoints}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Timer text */}
        <span className={`font-mono text-lg font-bold ${isUrgent ? 'text-hawker-red' : 'text-kopi-brown/60'}`}>
          {Math.ceil(secondsRemaining)}s
        </span>

        {/* Lives */}
        <div className="flex items-center gap-1">
          <span className="font-display text-sm font-bold text-kopi-brown/60">LIVES</span>
          {Array.from({ length: STARTING_LIVES }).map((_, i) => (
            <svg
              key={i}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className={`transition-opacity ${i < lives ? 'opacity-100' : 'opacity-20'}`}
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill={i < lives ? '#C41E3A' : '#ccc'}
              />
            </svg>
          ))}
        </div>
      </div>
    </div>
  )
}
