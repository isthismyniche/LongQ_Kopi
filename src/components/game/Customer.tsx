import { motion } from 'framer-motion'
import type { CustomerAppearance } from '../../hooks/useGameState'
import type { OrderResult } from '../../hooks/useGameState'

interface CustomerProps {
  appearance: CustomerAppearance
  orderText: string
  orderResult: OrderResult
  expletive: string
  correctReaction?: string
  regularName?: string
  isSecondVisit?: boolean
  isFirst?: boolean
  blur?: boolean
}

export default function Customer({
  appearance,
  orderText,
  orderResult,
  expletive,
  correctReaction = '',
  regularName = '',
  isSecondVisit = false,
  isFirst = false,
  blur = false,
}: CustomerProps) {
  const { skinTone, hairStyle, shirtColor } = appearance

  const animationVariant = orderResult === 'correct'
    ? { y: [0, -12, 0], transition: { duration: 0.4, times: [0, 0.5, 1] } }
    : orderResult === 'wrong' || orderResult === 'timeout'
    ? { x: [0, -6, 6, -6, 0], transition: { duration: 0.4 } }
    : {}

  // Determine speech text
  let speechText: string
  if (orderResult === 'correct') {
    speechText = correctReaction || 'Shiok ah!'
  } else if (orderResult === 'wrong' || orderResult === 'timeout') {
    speechText = expletive
  } else if (isSecondVisit) {
    speechText = 'The usual, please!'
  } else {
    speechText = orderText
  }

  const speechBg = orderResult === 'correct'
    ? 'bg-green-100 border-green-300'
    : orderResult === 'wrong' || orderResult === 'timeout'
    ? 'bg-red-100 border-red-300'
    : 'bg-white border-cream-dark'

  return (
    <motion.div
      className={`flex flex-col items-center ${blur ? 'blur-sm opacity-40 scale-75' : ''}`}
      initial={isFirst ? { x: 80, opacity: 0 } : {}}
      animate={isFirst ? { x: 0, opacity: 1, ...animationVariant } : animationVariant}
      transition={{ duration: 0.4, type: 'spring' }}
    >
      {/* Speech Bubble */}
      {isFirst && (
        <motion.div
          className={`relative mb-2 px-3 py-2 rounded-xl border-2 shadow-sm max-w-[180px] ${speechBg}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <p className="text-sm font-bold text-kopi-brown text-center leading-tight">
            {speechText}
          </p>
          {/* Bubble tail */}
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-b-2 border-r-2 ${speechBg}`} />
        </motion.div>
      )}

      {/* Regular customer label + name badge */}
      {isFirst && regularName && !orderResult && (
        <div className="flex flex-col items-center mb-1">
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: [0.7, 1, 0.7], y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[9px] font-display font-bold mb-0.5"
          >
            {isSecondVisit ? 'Remember me?' : 'Remember me!'}
          </motion.span>
          <span className="px-2 py-0.5 rounded-full bg-hawker-red/90 text-white text-[10px] font-display font-bold">
            {regularName}
          </span>
        </div>
      )}

      {/* Character SVG */}
      <svg width={isFirst ? 80 : 56} height={isFirst ? 110 : 77} viewBox="0 0 80 110">
        {/* Hair (behind head) */}
        {hairStyle === 0 && (
          <ellipse cx="40" cy="22" rx="22" ry="18" fill="#2C2C2C" />
        )}
        {hairStyle === 1 && (
          <rect x="18" y="8" width="44" height="22" rx="10" fill="#2C2C2C" />
        )}
        {hairStyle === 2 && (
          <path d="M18 30 Q18 6 40 6 Q62 6 62 30" fill="#4A3728" />
        )}
        {hairStyle === 3 && (
          <ellipse cx="40" cy="20" rx="24" ry="20" fill="#1A1A2E" />
        )}

        {/* Head */}
        <ellipse cx="40" cy="30" rx="18" ry="20" fill={skinTone} />

        {/* Eyes */}
        <ellipse cx="33" cy="28" rx="2.5" ry="3" fill="#2C2C2C" />
        <ellipse cx="47" cy="28" rx="2.5" ry="3" fill="#2C2C2C" />
        <circle cx="34" cy="27" r="0.8" fill="white" />
        <circle cx="48" cy="27" r="0.8" fill="white" />

        {/* Mouth */}
        {orderResult === 'correct' ? (
          <path d="M33 36 Q40 42 47 36" stroke="#2C2C2C" strokeWidth="1.5" fill="none" />
        ) : orderResult === 'wrong' || orderResult === 'timeout' ? (
          <path d="M33 40 Q40 34 47 40" stroke="#2C2C2C" strokeWidth="1.5" fill="none" />
        ) : (
          <ellipse cx="40" cy="37" rx="3" ry="1.5" fill="#2C2C2C" opacity="0.6" />
        )}

        {/* Body */}
        <path
          d={`M22 50 Q22 46 28 44 L40 42 L52 44 Q58 46 58 50 L60 90 L20 90 Z`}
          fill={shirtColor}
        />

        {/* Arms */}
        <path d="M22 52 L10 72 L16 74 L26 58" fill={skinTone} />
        <path d="M58 52 L70 72 L64 74 L54 58" fill={skinTone} />

        {/* Collar detail */}
        <path d="M34 44 L40 48 L46 44" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
      </svg>
    </motion.div>
  )
}
