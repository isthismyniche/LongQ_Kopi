import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { LevelConfig } from '../../data/gameConfig'

interface LevelTransitionProps {
  level: LevelConfig
  comment: string
}

// Deterministic confetti pieces — computed once per component type, not per render
const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => {
  const angle   = (i / 24) * 360
  const dist    = 80 + (i % 4) * 28
  const colors  = ['#C41E3A', '#F5C542', '#2ECC71', '#3498DB', '#9B59B6', '#E67E22']
  return {
    x:      Math.cos(angle * Math.PI / 180) * dist,
    y:      Math.sin(angle * Math.PI / 180) * dist,
    color:  colors[i % colors.length],
    delay:  (i % 6) * 0.04,
    size:   5 + (i % 3) * 2,
    rotate: i * 31,
  }
})

function ConfettiBurst() {
  // useMemo keeps the array stable across re-renders (though the component only mounts once per level-up)
  const pieces = useMemo(() => CONFETTI_PIECES, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: p.rotate, scale: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: [1, 1, 0],
            rotate: p.rotate + 200,
            scale: [0, 1, 0.7],
          }}
          transition={{ delay: p.delay, duration: 0.9, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

export default function LevelTransition({ level, comment }: LevelTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      {/* Confetti bursts from centre */}
      <ConfettiBurst />

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="bg-cream rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl text-center relative"
      >
        {/* Level number with pulse */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 mx-auto mb-3 rounded-full bg-hawker-red flex items-center justify-center shadow-lg"
        >
          <span className="font-display text-3xl font-bold text-white">
            {level.level}
          </span>
        </motion.div>

        <h2 className="font-display text-2xl font-bold text-kopi-brown mb-1">
          Level {level.level}
        </h2>
        <p className="font-display text-lg text-hawker-red font-semibold mb-3">
          {level.name}
        </p>

        <p className="text-sm text-kopi-brown/60 mb-3">
          {level.timerSeconds}s per order
        </p>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-kopi-brown/70 italic"
        >
          &ldquo;{comment}&rdquo;
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
