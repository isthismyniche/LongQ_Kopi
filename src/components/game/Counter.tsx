import { motion } from 'framer-motion'
import type { MilkType } from '../../data/drinkMatrix'
import type { CupContents } from '../../utils/orderValidation'
import { formatKeyDisplay, type ShortcutEntry } from '../../data/keyboardShortcuts'
import Cup from './Cup'

interface CounterProps {
  cup: CupContents
  lessToggle: boolean
  sugarLessToggle: boolean
  condensedLessToggle: boolean
  shortcuts: ShortcutEntry[]
  onAddBase: (base: 'Kopi' | 'Teh') => void
  onToggleLess: () => void
  onSetMilk: (milk: MilkType) => void
  onToggleCondensedLess: () => void
  onAddSugar: () => void
  onToggleSugarLess: () => void
  onAddIce: () => void
  onAddHotWater: () => void
  onDiscard: () => void
  onServe: () => void
  disabled: boolean
}

function getKey(shortcuts: ShortcutEntry[], action: string): string {
  const s = shortcuts.find(s => s.action === action)
  return s ? formatKeyDisplay(s.key) : ''
}

// --- SVG Icons ---

function KopiPotIcon() {
  return (
    <svg width="36" height="40" viewBox="0 0 36 40" aria-hidden="true">
      {/* Tall conical body — narrow at top, wide at bottom */}
      <path d="M13 6 L8 34 L28 34 L23 6 Z" fill="#8A8A8A" />
      {/* Right-side highlight */}
      <path d="M21 6 L26 34 L28 34 L23 6 Z" fill="#A0A0A0" opacity="0.6" />
      {/* Left-side shadow */}
      <path d="M15 6 L10 34 L8 34 L13 6 Z" fill="#6A6A6A" opacity="0.5" />
      {/* Top rim — narrow */}
      <ellipse cx="18" cy="6" rx="6" ry="2" fill="#999" stroke="#777" strokeWidth="0.5" />
      <ellipse cx="18" cy="6" rx="4.5" ry="1.3" fill="#7A7A7A" opacity="0.5" />
      {/* Bottom rim — wide */}
      <ellipse cx="18" cy="34" rx="10.5" ry="2.5" fill="#888" stroke="#777" strokeWidth="0.5" />
      {/* Spout — starts from lower-right body, angles diagonally up-right */}
      <path d="M26 28 L34 14 L32.5 13 L25 26" fill="#8A8A8A" stroke="#777" strokeWidth="0.4" />
      <ellipse cx="33.2" cy="13.5" rx="1.2" ry="0.7" fill="#777" />
      {/* Handle on left side — mug-style loop */}
      <path d="M13 10 Q4 10 4 20 Q4 30 13 30" stroke="#777" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Kopi-brown liquid visible at rim */}
      <ellipse cx="18" cy="6.5" rx="3.5" ry="0.9" fill="#5C3D2E" opacity="0.7" />
    </svg>
  )
}

function TehPotIcon() {
  return (
    <svg width="36" height="40" viewBox="0 0 36 40" aria-hidden="true">
      {/* Tall conical body — narrow at top, wide at bottom */}
      <path d="M13 6 L8 34 L28 34 L23 6 Z" fill="#8A8A8A" />
      {/* Right-side highlight */}
      <path d="M21 6 L26 34 L28 34 L23 6 Z" fill="#A0A0A0" opacity="0.6" />
      {/* Left-side shadow */}
      <path d="M15 6 L10 34 L8 34 L13 6 Z" fill="#6A6A6A" opacity="0.5" />
      {/* Top rim — narrow */}
      <ellipse cx="18" cy="6" rx="6" ry="2" fill="#999" stroke="#777" strokeWidth="0.5" />
      <ellipse cx="18" cy="6" rx="4.5" ry="1.3" fill="#7A7A7A" opacity="0.5" />
      {/* Bottom rim — wide */}
      <ellipse cx="18" cy="34" rx="10.5" ry="2.5" fill="#888" stroke="#777" strokeWidth="0.5" />
      {/* Spout — starts from lower-right body, angles diagonally up-right */}
      <path d="M26 28 L34 14 L32.5 13 L25 26" fill="#8A8A8A" stroke="#777" strokeWidth="0.4" />
      <ellipse cx="33.2" cy="13.5" rx="1.2" ry="0.7" fill="#777" />
      {/* Handle on left side — mug-style loop */}
      <path d="M13 10 Q4 10 4 20 Q4 30 13 30" stroke="#777" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Teh-amber liquid visible at rim */}
      <ellipse cx="18" cy="6.5" rx="3.5" ry="0.9" fill="#B8860B" opacity="0.7" />
      {/* Tea leaf motif on body */}
      <path d="M16 20 Q18 16 20 20 Q18 24 16 20 Z" fill="#2D5A27" opacity="0.4" />
      <line x1="18" y1="17" x2="18" y2="24" stroke="#2D5A27" strokeWidth="0.4" opacity="0.35" />
    </svg>
  )
}

function CondensedCanIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      {/* Squat can body */}
      <rect x="8" y="10" width="20" height="22" rx="3" fill="#F5E6C8" stroke="#C9A96E" strokeWidth="1" />
      {/* Label band */}
      <rect x="8" y="16" width="20" height="10" fill="#C41E3A" opacity="0.8" />
      {/* Label text simulation */}
      <rect x="11" y="19" width="14" height="1.5" rx="0.5" fill="white" opacity="0.7" />
      <rect x="13" y="22" width="10" height="1" rx="0.5" fill="white" opacity="0.5" />
      {/* Can top rim */}
      <rect x="10" y="9" width="16" height="3" rx="1.5" fill="#D4B896" />
    </svg>
  )
}

function EvaporatedCanIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      {/* Taller can body */}
      <rect x="10" y="6" width="16" height="26" rx="2" fill="#FDF0D5" stroke="#B8A88A" strokeWidth="1" />
      {/* Label band */}
      <rect x="10" y="12" width="16" height="12" fill="#3498DB" opacity="0.7" />
      {/* Label text */}
      <rect x="13" y="15" width="10" height="1.5" rx="0.5" fill="white" opacity="0.7" />
      <rect x="14" y="18" width="8" height="1" rx="0.5" fill="white" opacity="0.5" />
      <rect x="14" y="20" width="8" height="1" rx="0.5" fill="white" opacity="0.4" />
      {/* Can top */}
      <rect x="11" y="5" width="14" height="3" rx="1.5" fill="#E8DCC8" />
    </svg>
  )
}

function SugarDispenserIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      {/* Jar body */}
      <rect x="10" y="12" width="16" height="20" rx="3" fill="#FFF8E7" stroke="#D4B896" strokeWidth="1" />
      {/* Sugar visible inside */}
      <rect x="11" y="20" width="14" height="11" rx="2" fill="#F5C542" opacity="0.5" />
      {/* Lid */}
      <rect x="8" y="8" width="20" height="6" rx="3" fill="#D4B896" />
      {/* Holes in lid */}
      <circle cx="14" cy="11" r="1" fill="#A0855C" />
      <circle cx="18" cy="11" r="1" fill="#A0855C" />
      <circle cx="22" cy="11" r="1" fill="#A0855C" />
    </svg>
  )
}

function IceBucketIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      {/* Bucket */}
      <path d="M6 14 L10 32 L26 32 L30 14 Z" fill="#E0F4FF" stroke="#90CAF9" strokeWidth="1" />
      {/* Bucket rim */}
      <rect x="5" y="12" width="26" height="4" rx="2" fill="#B0D8F0" />
      {/* Ice cubes */}
      <rect x="10" y="16" width="7" height="6" rx="1.5" fill="#D0ECFF" stroke="#90CAF9" strokeWidth="0.5" />
      <rect x="19" y="17" width="6" height="5" rx="1.5" fill="#E8F6FF" stroke="#90CAF9" strokeWidth="0.5" />
      <rect x="13" y="23" width="6" height="5" rx="1.5" fill="#D8EFFF" stroke="#90CAF9" strokeWidth="0.5" />
      {/* Handle */}
      <path d="M10 12 Q18 4 26 12" stroke="#90CAF9" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function HotWaterTapIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      {/* Tap base / pipe */}
      <rect x="14" y="4" width="8" height="10" rx="2" fill="#888" />
      {/* Spout */}
      <path d="M14 14 L14 20 L10 20 L10 24 L26 24 L26 20 L22 20 L22 14" fill="#999" />
      {/* Knob */}
      <circle cx="18" cy="8" r="3" fill="#C0C0C0" stroke="#888" strokeWidth="1" />
      {/* Water drops */}
      <ellipse cx="16" cy="28" rx="1.5" ry="2" fill="#6CF" opacity="0.6" />
      <ellipse cx="20" cy="30" rx="1.5" ry="2" fill="#6CF" opacity="0.4" />
    </svg>
  )
}

function LessToggleIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      {active ? (
        <>
          <rect x="2" y="2" width="16" height="16" rx="4" fill="#C41E3A" />
          <path d="M6 10 L9 13 L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      ) : (
        <rect x="2" y="2" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      )}
    </svg>
  )
}

function IconButton({
  onClick,
  icon,
  label,
  active,
  disabled,
  ariaLabel,
  shortcut,
  className = '',
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  active?: boolean
  disabled?: boolean
  ariaLabel: string
  shortcut?: string
  className?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.88, filter: 'brightness(1.4)' }}
      aria-label={ariaLabel}
      className={`relative flex flex-col items-center justify-center rounded-xl p-1.5 min-w-[56px] h-[68px] md:min-w-[68px] md:h-[76px]
        font-display font-bold shadow-md transition-all cursor-pointer
        ${active ? 'ring-2 ring-hawker-red ring-offset-1' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:shadow-sm hover:brightness-110'}
        ${className}`}
    >
      {icon}
      <span className="text-[9px] md:text-[10px] leading-tight mt-0.5 text-center">{label}</span>
      {shortcut && (
        <span className="absolute top-0.5 right-1 text-[7px] opacity-40 font-mono">{shortcut}</span>
      )}
    </motion.button>
  )
}

function LessButton({
  onClick,
  active,
  disabled,
  ariaLabel,
  shortcut,
}: {
  onClick: () => void
  active: boolean
  disabled?: boolean
  ariaLabel: string
  shortcut?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.9 }}
      aria-label={ariaLabel}
      className={`relative flex items-center gap-1 rounded-lg px-2 py-1 h-[28px]
        font-display font-bold text-[10px] shadow-sm transition-all cursor-pointer
        ${active ? 'bg-hawker-red text-white' : 'bg-white/20 text-white/70 hover:bg-white/30'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <LessToggleIcon active={active} />
      <span>Less</span>
      {shortcut && (
        <span className="text-[7px] opacity-50 font-mono ml-0.5">{shortcut}</span>
      )}
    </motion.button>
  )
}

export default function Counter({
  cup,
  lessToggle,
  sugarLessToggle,
  condensedLessToggle,
  shortcuts,
  onAddBase,
  onToggleLess,
  onSetMilk,
  onToggleCondensedLess,
  onAddSugar,
  onToggleSugarLess,
  onAddIce,
  onAddHotWater,
  onDiscard,
  onServe,
  disabled,
}: CounterProps) {
  const sugarLabel = cup.sugar === 'None' ? 'Sugar' : cup.sugar === 'Half' ? 'Sugar (½)' : 'Sugar (1)'

  return (
    <div className="relative bg-gradient-to-b from-amber-800 to-amber-900 rounded-t-3xl p-3 md:p-4 shadow-2xl">
      {/* Counter top surface */}
      <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-3xl" />

      {/* Main counter layout — bounded width so buttons don't hit screen edges */}
      <div className="flex items-start justify-between gap-1.5 md:gap-3 max-w-xl mx-auto">
        {/* Left: Dispensers + Less */}
        <div className="flex flex-col gap-1.5 items-center">
          <div className="flex gap-1">
            <IconButton
              onClick={() => onAddBase('Kopi')}
              icon={<KopiPotIcon />}
              label={lessToggle ? 'Kopi (½)' : 'Kopi'}
              className="bg-kopi-brown text-white"
              disabled={disabled}
              ariaLabel="Add Kopi base"
              shortcut={getKey(shortcuts, 'kopi')}
            />
            <IconButton
              onClick={() => onAddBase('Teh')}
              icon={<TehPotIcon />}
              label={lessToggle ? 'Teh (½)' : 'Teh'}
              className="bg-teh-amber text-white"
              disabled={disabled}
              ariaLabel="Add Teh base"
              shortcut={getKey(shortcuts, 'teh')}
            />
          </div>
          <LessButton
            onClick={onToggleLess}
            active={lessToggle}
            disabled={disabled}
            ariaLabel="Toggle less for Kopi/Teh pour"
            shortcut={getKey(shortcuts, 'lessBase')}
          />
        </div>

        {/* Center: Hot water tap above cup */}
        <div className="flex flex-col items-center gap-0">
          {/* Hot water tap — sits above the cup */}
          <IconButton
            onClick={onAddHotWater}
            icon={<HotWaterTapIcon />}
            label="Hot Water"
            className={cup.hasHotWater ? 'bg-blue-400 text-white ring-2 ring-blue-300' : 'bg-gray-500 text-white'}
            disabled={disabled || cup.hasHotWater}
            ariaLabel="Add hot water"
            shortcut={getKey(shortcuts, 'hotWater')}
          />

          <Cup contents={cup} />

          {/* Cup info badges — fixed height to prevent layout shift */}
          <div className="flex flex-wrap gap-1 justify-center min-h-[24px] items-start">
            {cup.base && (
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-cream/70 font-semibold">
                {cup.baseUnits}u {cup.base}
              </span>
            )}
            {cup.milk !== 'None' && (
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-cream/70 font-semibold">
                {cup.milk === 'Condensed' && cup.milkUnits === 0.5 ? 'Condensed (½)' : cup.milk}
              </span>
            )}
            {cup.sugar !== 'None' && (
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-cream/70 font-semibold">
                {cup.sugar === 'Full' ? 'Sugar' : '½ Sugar'}
              </span>
            )}
            {cup.hasIce && (
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-cream/70 font-semibold">Ice</span>
            )}
            {cup.hasHotWater && (
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-cream/70 font-semibold">H₂O</span>
            )}
          </div>
        </div>

        {/* Right: Ingredients */}
        <div className="flex flex-col gap-1.5 items-center">
          <div className="flex gap-1 items-end">
            <div className="flex flex-col items-center gap-0.5">
              <LessButton
                onClick={onToggleCondensedLess}
                active={condensedLessToggle}
                disabled={disabled || cup.milk !== 'None'}
                ariaLabel="Toggle less for condensed milk"
                shortcut={getKey(shortcuts, 'lessCondensed')}
              />
              <IconButton
                onClick={() => onSetMilk('Condensed')}
                icon={<CondensedCanIcon />}
                label={condensedLessToggle ? 'Condensed (½)' : 'Condensed'}
                className={cup.milk === 'Condensed' ? 'bg-condensed text-kopi-brown ring-2 ring-kopi-brown' : 'bg-condensed text-kopi-brown'}
                disabled={disabled || cup.milk !== 'None'}
                ariaLabel="Add condensed milk"
                shortcut={getKey(shortcuts, 'condensedMilk')}
              />
            </div>
            <IconButton
              onClick={() => onSetMilk('Evaporated')}
              icon={<EvaporatedCanIcon />}
              label="Evaporated"
              className={cup.milk === 'Evaporated' ? 'bg-evaporated text-kopi-brown ring-2 ring-kopi-brown' : 'bg-evaporated text-kopi-brown'}
              disabled={disabled || cup.milk !== 'None'}
              ariaLabel="Add evaporated milk"
              shortcut={getKey(shortcuts, 'evaporatedMilk')}
            />
          </div>
          {/* Sugar + its Less toggle grouped together, Ice aligned to top */}
          <div className="flex gap-1 items-start">
            <div className="flex flex-col items-center gap-0.5">
              <IconButton
                onClick={onAddSugar}
                icon={<SugarDispenserIcon />}
                label={sugarLabel}
                className={cup.sugar !== 'None' ? 'bg-warm-yellow text-kopi-brown ring-2 ring-kopi-brown' : 'bg-warm-yellow/80 text-kopi-brown'}
                disabled={disabled || cup.sugar !== 'None'}
                ariaLabel="Add sugar"
                shortcut={getKey(shortcuts, 'sugar')}
              />
              <LessButton
                onClick={onToggleSugarLess}
                active={sugarLessToggle}
                disabled={disabled || cup.sugar !== 'None'}
                ariaLabel="Toggle less for sugar"
                shortcut={getKey(shortcuts, 'lessSugar')}
              />
            </div>
            <IconButton
              onClick={onAddIce}
              icon={<IceBucketIcon />}
              label="Ice"
              className={cup.hasIce ? 'bg-blue-300 text-blue-900 ring-2 ring-blue-500' : 'bg-blue-200 text-blue-800'}
              disabled={disabled || cup.hasIce}
              ariaLabel="Add ice"
              shortcut={getKey(shortcuts, 'ice')}
            />
          </div>
        </div>
      </div>

      {/* Bottom row: Discard + Serve */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <motion.button
          onClick={onDiscard}
          disabled={disabled}
          whileTap={disabled ? {} : { scale: 0.9 }}
          aria-label="Discard cup contents"
          className="px-4 py-2 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-display font-bold text-sm
            shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Discard
        </motion.button>

        <motion.button
          onClick={onServe}
          disabled={disabled}
          whileTap={disabled ? {} : { scale: 0.95 }}
          whileHover={disabled ? {} : { scale: 1.05 }}
          aria-label="Serve the drink"
          className="px-8 py-3 rounded-2xl bg-hawker-red hover:bg-hawker-red/90 text-white font-display font-bold text-lg
            shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          SERVE
        </motion.button>

        {/* Takeaway bag stack (cosmetic) */}
        <div className="opacity-30" aria-label="Takeaway bags (decorative)">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <path d="M6 10 L6 26 L22 26 L22 10 Z" fill="#F5E6C8" stroke="#C9A96E" strokeWidth="1" />
            <path d="M10 10 Q10 4 14 4 Q18 4 18 10" stroke="#C9A96E" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
      </div>
    </div>
  )
}
