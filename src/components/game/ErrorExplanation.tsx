import { motion } from 'framer-motion'
import type { OrderMismatch } from '../../utils/orderValidation'

interface ErrorExplanationProps {
  mismatches: OrderMismatch[]
}

export default function ErrorExplanation({ mismatches }: ErrorExplanationProps) {
  if (mismatches.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', duration: 0.4 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-sm
        rounded-2xl shadow-xl border-2 border-red-200 px-4 py-3 max-w-xs w-[90%]"
    >
      <p className="font-display text-xs font-bold text-hawker-red mb-1.5 text-center">
        What went wrong:
      </p>
      <ul className="space-y-1">
        {mismatches.map((m, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-1.5 text-xs text-kopi-brown"
          >
            <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-white
              ${m.type === 'wrong' ? 'bg-hawker-red' : 'bg-amber-500'}`}>
              {m.type === 'wrong' ? '✕' : '?'}
            </span>
            <span>{m.label}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}
