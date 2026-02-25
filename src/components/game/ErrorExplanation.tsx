import { motion } from 'framer-motion'
import type { OrderMismatch } from '../../utils/orderValidation'

interface ErrorExplanationProps {
  mismatches: OrderMismatch[]
  quote: string
  onDismiss: () => void
}

export default function ErrorExplanation({ mismatches, quote, onDismiss }: ErrorExplanationProps) {
  if (mismatches.length === 0) return null

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="absolute inset-0 z-10 bg-gradient-to-b from-amber-800 to-amber-950
        rounded-t-3xl flex flex-col px-4 pt-4 pb-3 shadow-2xl"
    >
      {/* Header */}
      <p className="font-display text-[10px] font-bold text-amber-300/60 uppercase tracking-widest mb-2.5">
        What went wrong
      </p>

      {/* Mismatch list */}
      <ul className="space-y-1.5 flex-1">
        {mismatches.map((m, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.07, type: 'spring', stiffness: 300 }}
            className="flex items-center gap-2 text-sm text-amber-100/90"
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
              text-[9px] font-black text-white shadow-sm
              ${m.type === 'wrong' ? 'bg-hawker-red' : 'bg-amber-500'}`}>
              {m.type === 'wrong' ? '✕' : '?'}
            </span>
            <span className="leading-tight">{m.label}</span>
          </motion.li>
        ))}
      </ul>

      {/* Quote dismiss button */}
      <motion.button
        onClick={onDismiss}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 + mismatches.length * 0.07 }}
        whileTap={{ scale: 0.97 }}
        className="mt-3 w-full rounded-2xl cursor-pointer
          bg-gradient-to-br from-amber-600/40 to-amber-800/60
          border border-amber-500/30 hover:border-amber-400/50
          px-4 py-3 text-center transition-colors group"
      >
        <p className="text-[10px] font-semibold text-amber-400/50 uppercase tracking-widest mb-1.5
          group-hover:text-amber-400/70 transition-colors">
          tap to continue
        </p>
        <p className="font-display text-sm font-bold text-amber-100/90 leading-snug italic">
          "{quote}"
        </p>
      </motion.button>
    </motion.div>
  )
}
