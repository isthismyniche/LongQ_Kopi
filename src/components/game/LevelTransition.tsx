import { motion } from 'framer-motion'
import type { LevelConfig } from '../../data/gameConfig'

interface LevelTransitionProps {
  level: LevelConfig
  comment: string
}

export default function LevelTransition({ level, comment }: LevelTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.7, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="bg-cream rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl text-center"
      >
        {/* Level number with pulse */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 mx-auto mb-3 rounded-full bg-hawker-red flex items-center justify-center"
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

        {/* Timer info */}
        <p className="text-sm text-kopi-brown/60 mb-3">
          {level.timerSeconds}s per order
        </p>

        {/* Crowd comment */}
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
