import { motion, AnimatePresence } from 'framer-motion'
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
  timerUrgent?: boolean
}

// Precomputed sparkle positions for consistent layout
const SPARKLE_POSITIONS = [
  { x: '-20%', y: '-2%',  delay: 0,    size: 13 },
  { x: '92%',  y: '1%',   delay: 0.07, size: 11 },
  { x: '-24%', y: '22%',  delay: 0.13, size: 10 },
  { x: '96%',  y: '19%',  delay: 0.04, size: 12 },
]

function Sparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {SPARKLE_POSITIONS.map((p, i) => (
        <motion.svg
          key={i}
          width={p.size} height={p.size} viewBox="0 0 14 14"
          style={{ position: 'absolute', left: p.x, top: p.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0], y: [-2, -16] }}
          transition={{ delay: p.delay, duration: 0.75, ease: 'easeOut' }}
        >
          <path d="M7 0 L8.2 5.5 L14 7 L8.2 8.5 L7 14 L5.8 8.5 L0 7 L5.8 5.5 Z" fill="#FFD700" />
        </motion.svg>
      ))}
    </div>
  )
}

function AngerMark() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ right: '2%', top: '4%' }}
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: [0, 1.4, 1.1], rotate: [-20, 8, 0] }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20">
        {/* Classic four-quadrant anger vein */}
        <path d="M10 2 Q12.5 6 10 10" stroke="#C41E3A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M18 10 Q14 12 10 10" stroke="#C41E3A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M10 18 Q7.5 14 10 10" stroke="#C41E3A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M2 10 Q6 8 10 10"  stroke="#C41E3A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </svg>
    </motion.div>
  )
}

function SweatDrop({ delay = 0, left = '4%' }: { delay?: number; left?: string }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left, top: '14%' }}
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.9, 0], y: [0, 18] }}
      exit={{ opacity: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeIn' }}
    >
      <svg width="9" height="13" viewBox="0 0 9 13">
        <path
          d="M4.5 0 Q7.5 4 7.5 7.5 Q7.5 11.5 4.5 12.5 Q1.5 11.5 1.5 7.5 Q1.5 4 4.5 0 Z"
          fill="#7EC8E3" opacity="0.85"
        />
        <path
          d="M3 5 Q2.5 7 3 8.5"
          stroke="white" strokeWidth="0.7" fill="none" opacity="0.5" strokeLinecap="round"
        />
      </svg>
    </motion.div>
  )
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
  timerUrgent = false,
}: CustomerProps) {
  const { skinTone, hairStyle, shirtColor, gender } = appearance
  const isMale = gender === 'male'

  const animationVariant = orderResult === 'correct'
    ? { y: [0, -14, 0], transition: { duration: 0.45, times: [0, 0.45, 1] } }
    : orderResult === 'wrong' || orderResult === 'timeout'
    ? { x: [0, -7, 7, -5, 5, 0], transition: { duration: 0.45 } }
    : {}

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

  // Tail colours matched exactly to the CSS classes above
  const tailFill  = orderResult === 'correct' ? '#dcfce7'
    : (orderResult === 'wrong' || orderResult === 'timeout') ? '#fee2e2'
    : '#ffffff'
  const tailBorder = orderResult === 'correct' ? '#86efac'
    : (orderResult === 'wrong' || orderResult === 'timeout') ? '#fca5a5'
    : '#E8D5B7'

  const isMakcikSiti = regularName === 'Makcik Siti'
  const isUncleLim   = regularName === 'Uncle Lim'
  const isMrRajan    = regularName === 'Mr Rajan'

  return (
    <motion.div
      className={`flex flex-col items-center ${blur ? 'blur-sm opacity-40 scale-75' : ''}`}
      initial={isFirst ? { x: 80, opacity: 0 } : {}}
      animate={isFirst ? { x: 0, opacity: 1, ...animationVariant } : animationVariant}
      exit={isFirst ? { x: -70, opacity: 0, transition: { duration: 0.28, ease: 'easeIn' } } : {}}
      transition={{ duration: 0.4, type: 'spring' }}
    >
      {/* ── Character SVG + emotion overlays ──────────────────────────── */}
      <div className="relative">

        {/* ── Speech Bubble + Labels ─────────────────────────────────────
            Absolutely positioned above the SVG so they contribute ZERO
            height to the flex column — the SVG is always the only layout
            item and is never pushed out of view by the bubble.          */}
        {isFirst && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center pb-3 z-10 pointer-events-none w-max">
            {/* Regular customer labels */}
            {regularName && !orderResult && (
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
            {/* Speech bubble */}
            <motion.div
              className={`relative px-3 py-2 rounded-xl border-2 shadow-md max-w-[180px] ${speechBg}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <p className="text-sm font-bold text-kopi-brown text-center leading-tight font-display">
                {speechText}
              </p>
              {/* Clean SVG triangle tail — no background bleed */}
              <svg
                className="absolute -bottom-[11px] left-1/2 -translate-x-1/2"
                width="16" height="12" viewBox="0 0 16 12"
              >
                <polygon points="0,0 16,0 8,12" fill={tailBorder} />
                <polygon points="2,0 14,0 8,9"  fill={tailFill}   />
              </svg>
            </motion.div>
          </div>
        )}

        {/* Correct sparkles */}
        {isFirst && orderResult === 'correct' && <Sparkles />}

        {/* Wrong/timeout emotion indicators */}
        <AnimatePresence>
          {isFirst && (orderResult === 'wrong' || orderResult === 'timeout') && (
            <>
              <AngerMark />
              <SweatDrop delay={0}    left="2%"  />
              <SweatDrop delay={0.18} left="10%" />
            </>
          )}
        </AnimatePresence>

        {/* Idle breathing wrapper — decoupled from reaction animations */}
        <motion.div
          animate={isFirst && !orderResult ? { y: [0, -1.8, 0] } : { y: 0 }}
          transition={
            isFirst && !orderResult
              ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
        >
          <svg
            width={isFirst ? 80 : 56}
            height={isFirst ? 110 : 77}
            viewBox="0 0 80 110"
            overflow="visible"
          >
            {/* ── Hair (behind head) ──────────────────────────────────── */}
            {isMakcikSiti ? (
              // Hijab — culturally authentic for Makcik Siti
              <>
                <ellipse cx="40" cy="26" rx="24" ry="23" fill="#27AE60" />
                {/* Side drapes over shoulders */}
                <path d="M18 52 Q13 65 16 80 Q22 76 28 66 Q25 57 30 52" fill="#27AE60" />
                <path d="M62 52 Q67 65 64 80 Q58 76 52 66 Q55 57 50 52" fill="#27AE60" />
                {/* Inner shadow for depth */}
                <ellipse cx="40" cy="27" rx="19" ry="20" fill="none" stroke="#1E8449" strokeWidth="0.8" opacity="0.4" />
              </>
            ) : hairStyle === 0 ? (
              <ellipse cx="40" cy="22" rx="22" ry="18" fill="#2C2C2C" />
            ) : hairStyle === 1 ? (
              <rect x="18" y="8" width="44" height="22" rx="10" fill="#2C2C2C" />
            ) : hairStyle === 2 ? (
              <path d="M18 30 Q18 6 40 6 Q62 6 62 30" fill="#4A3728" />
            ) : hairStyle === 3 ? (
              // Fixed: was cy=20 ry=20, top touched y=0 and clipped at SVG edge
              <ellipse cx="40" cy="24" rx="22" ry="19" fill="#1A1A2E" />
            ) : hairStyle === 4 ? (
              // Buzz cut / short crop
              <>
                <path d="M20 30 Q20 10 40 10 Q60 10 60 30" fill="#2C2C2C" />
                <rect x="20" y="10" width="40" height="5" fill="#2C2C2C" />
              </>
            ) : hairStyle === 5 ? (
              // Shoulder-length straight hair
              <>
                <path d="M18 30 Q18 6 40 6 Q62 6 62 30" fill="#8B5E3C" />
                <path d="M18 28 Q15 50 17 68" stroke="#8B5E3C" strokeWidth="9"  fill="none" strokeLinecap="round" />
                <path d="M62 28 Q65 50 63 68" stroke="#8B5E3C" strokeWidth="9"  fill="none" strokeLinecap="round" />
              </>
            ) : hairStyle === 6 ? (
              // Bun on top — cy moved from 9→11 so top is at y=2 (clear of SVG viewport edge)
              <>
                <ellipse cx="40" cy="23" rx="21" ry="16" fill="#5C3D2E" />
                <circle cx="40" cy="11" r="9"   fill="#5C3D2E" />
                <circle cx="40" cy="11" r="4.5" fill="#4A3020" opacity="0.45" />
              </>
            ) : hairStyle === 7 ? (
              // Baseball cap
              <>
                <path d="M20 28 Q20 8 40 8 Q60 8 60 28" fill="#3498DB" />
                <rect x="13" y="24" width="54" height="7" rx="3.5" fill="#2475A8" />
                <circle cx="40" cy="9" r="2.5" fill="#2475A8" />
              </>
            ) : null}

            {/* ── Head ─────────────────────────────────────────────────── */}
            {/* Male: wider/squarer (rx>ry).  Female: taller/rounder (ry>rx) */}
            {isMale
              ? <ellipse cx="40" cy="31" rx="20" ry="18" fill={skinTone} />
              : <ellipse cx="40" cy="30" rx="18" ry="20" fill={skinTone} />
            }

            {/* ── Eyebrows (state-reactive — the biggest expressiveness lever) ── */}
            {orderResult === 'correct' ? (
              // Raised happy arches
              <>
                <path d="M30 21 Q33 18 36 21" stroke="#2C2C2C" strokeWidth="1.7" fill="none" strokeLinecap="round" />
                <path d="M44 21 Q47 18 50 21" stroke="#2C2C2C" strokeWidth="1.7" fill="none" strokeLinecap="round" />
              </>
            ) : (orderResult === 'wrong' || orderResult === 'timeout') ? (
              // Furrowed inward — classic angry angle
              <>
                <path d="M30 24 Q33 21 36 23" stroke="#2C2C2C" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <path d="M44 23 Q47 21 50 24" stroke="#2C2C2C" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              </>
            ) : (
              // Neutral
              <>
                <path d="M30 23 Q33 21 36 23" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M44 23 Q47 21 50 23" stroke="#2C2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </>
            )}

            {/* ── Eyes ─────────────────────────────────────────────────── */}
            <ellipse cx="33" cy="28" rx="2.5" ry="3" fill="#2C2C2C" />
            <ellipse cx="47" cy="28" rx="2.5" ry="3" fill="#2C2C2C" />
            <circle  cx="34" cy="27" r="0.8"       fill="white" />
            <circle  cx="48" cy="27" r="0.8"       fill="white" />

            {/* Happy eye squint — curved lid covers pupils */}
            {orderResult === 'correct' && (
              <>
                <path d="M30.5 26.5 Q33 23.5 35.5 26.5" stroke="#2C2C2C" strokeWidth="2.2" fill={skinTone} strokeLinecap="round" />
                <path d="M44.5 26.5 Q47 23.5 49.5 26.5" stroke="#2C2C2C" strokeWidth="2.2" fill={skinTone} strokeLinecap="round" />
              </>
            )}

            {/* ── Glasses for Uncle Lim ────────────────────────────────── */}
            {isUncleLim && (
              <g opacity="0.7" stroke="#3A3A3A" fill="none" strokeWidth="1.1">
                <ellipse cx="33" cy="28" rx="5.5" ry="4.5" />
                <ellipse cx="47" cy="28" rx="5.5" ry="4.5" />
                <path d="M38.5 28 L41.5 28" />
                <path d="M27.5 27.5 L20 27" strokeLinecap="round" />
                <path d="M52.5 27.5 L60 27" strokeLinecap="round" />
              </g>
            )}

            {/* ── Mouth ────────────────────────────────────────────────── */}
            {orderResult === 'correct' ? (
              <path d="M33 36 Q40 44 47 36" stroke="#2C2C2C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            ) : (orderResult === 'wrong' || orderResult === 'timeout') ? (
              <path d="M33 40 Q40 33 47 40" stroke="#2C2C2C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            ) : (
              <ellipse cx="40" cy="37" rx="3" ry="1.5" fill="#2C2C2C" opacity="0.6" />
            )}

            {/* ── Mustache for Mr Rajan ────────────────────────────────── */}
            {isMrRajan && (
              <path
                d="M35.5 38.5 Q37.5 36 40 37 Q42.5 36 44.5 38.5"
                stroke="#1A0800" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"
              />
            )}

            {/* ── Body / Arms / Collar — gender-specific proportions ──── */}
            {isMale ? (
              <>
                {/* Neck — visible on males, bridges head and wider shoulders */}
                <rect x="35" y="46" width="10" height="8" fill={skinTone} />
                {/* Broad shoulders */}
                <path d="M16 54 Q16 47 24 44 L40 42 L56 44 Q64 47 64 54 L66 90 L14 90 Z" fill={shirtColor} />
                {/* Arms — start from the wider shoulder position */}
                <path d="M16 56 L4 77 L11 79 L22 63" fill={skinTone} />
                <path d="M64 56 L76 77 L69 79 L58 63" fill={skinTone} />
                {/* V-neck collar — slightly wider to match shoulders */}
                <path d="M33 44 L40 49 L47 44" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
              </>
            ) : (
              <>
                {/* Slimmer shoulders — original female silhouette */}
                <path d="M22 50 Q22 46 28 44 L40 42 L52 44 Q58 46 58 50 L60 90 L20 90 Z" fill={shirtColor} />
                <path d="M22 52 L10 72 L16 74 L26 58" fill={skinTone} />
                <path d="M58 52 L70 72 L64 74 L54 58" fill={skinTone} />
                <path d="M34 44 L40 48 L46 44" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
              </>
            )}

            {/* ── Timer urgency sweat bead ─────────────────────────────── */}
            {isFirst && timerUrgent && !orderResult && (
              <motion.ellipse
                cx="52" cy="17" rx="3.5" ry="2.5"
                fill="#7EC8E3"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.7, repeat: Infinity }}
              />
            )}
          </svg>
        </motion.div>
      </div>
    </motion.div>
  )
}
