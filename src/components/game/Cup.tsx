import { motion } from 'framer-motion'
import type { CupContents } from '../../utils/orderValidation'

interface CupProps {
  contents: CupContents
}

export default function Cup({ contents }: CupProps) {
  const { base, baseUnits, milk, hasIce, hasHotWater } = contents
  const hasBase = base !== null && baseUnits > 0
  const hasMilk = milk !== 'None'
  const hasAnything = hasBase || hasMilk || hasHotWater

  // Cup interior: y 46 (brim) to y 88 (bottom) = 42 units total capacity
  const brim = 46
  const bottom = 88
  const capacity = bottom - brim // 42

  // Fixed heights for non-water ingredients
  const milkH = hasMilk ? 8 : 0
  const baseH = hasBase ? Math.min(baseUnits, 3) * 9 : 0
  const iceH = hasIce ? 6 : 0

  // Water fills remaining space to the brim when present
  const usedByOthers = milkH + baseH + iceH
  const waterH = hasHotWater ? Math.max(capacity - usedByOthers, 4) : 0

  // Stack layers from bottom up: milk → water → base → ice
  // Water sits between milk and base (visually it mixes with the base,
  // but we render it as a lighter layer underneath)
  const milkTop = bottom - milkH
  const waterTop = milkTop - waterH
  const baseTop = waterTop - baseH
  const iceTop = baseTop - iceH

  const baseColor = base === 'Teh' ? '#B8860B' : '#5C3D2E'
  const baseColorLight = base === 'Teh' ? '#D4A840' : '#8B6914'
  const milkColor = milk === 'Condensed' ? '#F5DEB3' : '#FDF0D5'

  return (
    <div className="relative w-24 h-24 md:w-28 md:h-28 mx-auto">
      <svg viewBox="0 0 110 105" className="w-full h-full">
        <defs>
          <clipPath id="cup-interior">
            <path d="M22 42 Q22 88 28 90 L72 90 Q78 88 78 42 Z" />
          </clipPath>
        </defs>

        {/* === Saucer === */}
        <ellipse cx="50" cy="96" rx="44" ry="8" fill="#E8DECE" stroke="#C8B8A0" strokeWidth="1" />
        <ellipse cx="50" cy="95" rx="40" ry="6" fill="#F0E6D8" />
        <ellipse cx="50" cy="95" rx="26" ry="4" fill="none" stroke="#D4C8B4" strokeWidth="0.5" />

        {/* === Cup body — squat rounded shape === */}
        <path
          d="M20 42 Q18 70 22 85 Q24 90 30 92 L70 92 Q76 90 78 85 Q82 70 80 42 Z"
          fill="#EDE4D4"
          stroke="#C8B8A0"
          strokeWidth="1.2"
        />
        {/* Left highlight */}
        <path d="M22 44 Q20 68 24 84 L26 84 Q22 68 24 44 Z" fill="white" opacity="0.3" />
        {/* Right shadow */}
        <path d="M76 44 Q80 68 76 84 L74 84 Q78 68 74 44 Z" fill="#B8A890" opacity="0.15" />

        {/* === Green floral motif === */}
        <g opacity="0.35">
          <circle cx="50" cy="64" r="6" fill="none" stroke="#3A7A3A" strokeWidth="0.8" />
          <ellipse cx="50" cy="57" rx="3" ry="4" fill="none" stroke="#3A7A3A" strokeWidth="0.6" />
          <ellipse cx="44" cy="62" rx="3" ry="4" fill="none" stroke="#3A7A3A" strokeWidth="0.6" transform="rotate(-40 44 62)" />
          <ellipse cx="56" cy="62" rx="3" ry="4" fill="none" stroke="#3A7A3A" strokeWidth="0.6" transform="rotate(40 56 62)" />
          <ellipse cx="46" cy="70" rx="3" ry="4" fill="none" stroke="#3A7A3A" strokeWidth="0.6" transform="rotate(-20 46 70)" />
          <ellipse cx="54" cy="70" rx="3" ry="4" fill="none" stroke="#3A7A3A" strokeWidth="0.6" transform="rotate(20 54 70)" />
          <path d="M38 58 Q34 54 36 50" stroke="#3A7A3A" strokeWidth="0.6" fill="none" />
          <path d="M36 50 Q40 52 38 58" stroke="#3A7A3A" strokeWidth="0.6" fill="none" />
          <path d="M62 58 Q66 54 64 50" stroke="#3A7A3A" strokeWidth="0.6" fill="none" />
          <path d="M64 50 Q60 52 62 58" stroke="#3A7A3A" strokeWidth="0.6" fill="none" />
          <path d="M40 76 Q36 78 34 76" stroke="#3A7A3A" strokeWidth="0.6" fill="none" />
          <path d="M60 76 Q64 78 66 76" stroke="#3A7A3A" strokeWidth="0.6" fill="none" />
        </g>

        {/* === Liquid contents (clipped to interior) === */}
        <g clipPath="url(#cup-interior)">
          {/* Milk layer at bottom */}
          {hasMilk && (
            <motion.rect
              x="18" width="64" rx="1"
              initial={{ y: bottom, height: 0 }}
              animate={{ y: milkTop, height: milkH }}
              transition={{ duration: 0.3 }}
              fill={milkColor}
            />
          )}

          {/* Hot water layer — fills remaining space to brim */}
          {hasHotWater && (
            <motion.rect
              x="18" width="64" rx="1"
              initial={{ y: milkTop, height: 0 }}
              animate={{ y: waterTop, height: waterH }}
              transition={{ duration: 0.3 }}
              fill={hasBase ? (base === 'Teh' ? '#C8963A' : '#7A5438') : '#D4ECFF'}
              opacity={hasBase ? 0.45 : 0.5}
            />
          )}

          {/* Base liquid — key on base+baseUnits so animation replays on every pour */}
          {hasBase && (
            <>
              <motion.g
                key={`base-${base}-${baseUnits}`}
                initial={{ y: 5, opacity: 0.6 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <rect x="18" width="64" y={baseTop} height={baseH} fill={baseColor} opacity="0.85" rx="1" />
                <rect x="28" width="44" y={baseTop} height="1.5" fill={baseColorLight} opacity="0.4" rx="1" />
              </motion.g>
              {/* Surface ripple — expands outward and fades on each pour */}
              <motion.ellipse
                key={`ripple-${base}-${baseUnits}`}
                cx="50"
                cy={baseTop + 1}
                rx="22"
                ry="2.5"
                fill={baseColorLight}
                initial={{ scaleX: 0.3, opacity: 0.55 }}
                animate={{ scaleX: 1, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </>
          )}

          {/* Ice cubes */}
          {hasIce && (
            <motion.g
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, type: 'spring' }}
            >
              <rect x="30" y={iceTop + 1} width="8" height="6" rx="1.5" fill="#E0F4FF" stroke="#B0D8F0" strokeWidth="0.5" opacity="0.8" />
              <rect x="42" y={iceTop} width="8" height="6" rx="1.5" fill="#D0ECFF" stroke="#B0D8F0" strokeWidth="0.5" opacity="0.7" />
              <rect x="54" y={iceTop + 2} width="7" height="5" rx="1.5" fill="#E8F6FF" stroke="#B0D8F0" strokeWidth="0.5" opacity="0.75" />
            </motion.g>
          )}
        </g>

        {/* === Rim === */}
        <ellipse cx="50" cy="42" rx="31" ry="7" fill="#EDE4D4" stroke="#C8B8A0" strokeWidth="1.2" />
        <ellipse cx="50" cy="42" rx="28" ry="5.5" fill="#F5EDE0" />
        <ellipse cx="50" cy="42.5" rx="26" ry="4.5" fill="#E8DECE" opacity="0.5" />

        {/* === Handle === */}
        <path d="M80 52 Q92 52 92 66 Q92 80 80 80" stroke="#C8B8A0" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* === Steam (three wisps, more visible) === */}
        {hasAnything && !hasIce && (
          <>
            <motion.path
              d="M40 34 Q43 24 40 14" stroke="#8B6914" strokeWidth="1.3" fill="none"
              animate={{ y: [-1, -7, -1], opacity: [0.12, 0.32, 0.12] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.path
              d="M54 34 Q57 24 54 14" stroke="#8B6914" strokeWidth="1.3" fill="none"
              animate={{ y: [-1, -7, -1], opacity: [0.12, 0.32, 0.12] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
            />
            <motion.path
              d="M47 36 Q50 26 47 15" stroke="#8B6914" strokeWidth="1.1" fill="none"
              animate={{ y: [-1, -6, -1], opacity: [0.08, 0.22, 0.08] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: 1.3 }}
            />
          </>
        )}

        {/* Empty label */}
        {!hasAnything && (
          <text x="50" y="70" textAnchor="middle" fontSize="9" fill="#C8B8A0" opacity="0.5" fontFamily="sans-serif">empty</text>
        )}
      </svg>
    </div>
  )
}
