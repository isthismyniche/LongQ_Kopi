import { motion } from 'framer-motion'
import type { PartyPlayer } from '../../hooks/usePartyRoom'

interface PartyProgressBarsProps {
  myDrinks: number
  myName: string
  topOpponents: Pick<PartyPlayer, 'device_id' | 'player_name' | 'drinks'>[]
  winTarget: number
}

function ProgressBar({
  name,
  drinks,
  winTarget,
  isSelf,
  isAlert,
}: {
  name: string
  drinks: number
  winTarget: number
  isSelf: boolean
  isAlert: boolean
}) {
  const pct = Math.min(100, (drinks / winTarget) * 100)

  return (
    <motion.div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${
        isSelf ? 'bg-amber-100/80' : 'bg-white/60'
      } ${isAlert ? 'ring-1 ring-hawker-red/40' : ''}`}
      animate={isAlert ? { scale: [1, 1.01, 1] } : {}}
      transition={isAlert ? { duration: 0.6, repeat: Infinity } : {}}
    >
      <span
        className={`text-xs font-display font-bold truncate w-16 flex-shrink-0 ${
          isSelf ? 'text-kopi-brown' : 'text-kopi-brown/70'
        }`}
      >
        {isSelf ? 'You' : name}
      </span>
      <div className="flex-1 h-2 bg-kopi-brown/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isSelf ? 'bg-amber-500' : isAlert ? 'bg-hawker-red' : 'bg-kopi-brown/40'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <span className="text-xs font-body text-kopi-brown/60 tabular-nums w-10 text-right flex-shrink-0">
        {drinks}/{winTarget}
      </span>
    </motion.div>
  )
}

export default function PartyProgressBars({
  myDrinks,
  myName,
  topOpponents,
  winTarget,
}: PartyProgressBarsProps) {
  const alertThreshold = winTarget - 5

  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      <ProgressBar
        name={myName}
        drinks={myDrinks}
        winTarget={winTarget}
        isSelf
        isAlert={false}
      />
      {topOpponents.map(opp => (
        <ProgressBar
          key={opp.device_id}
          name={opp.player_name}
          drinks={opp.drinks}
          winTarget={winTarget}
          isSelf={false}
          isAlert={opp.drinks >= alertThreshold}
        />
      ))}
    </div>
  )
}
