import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface OpponentTrackerProps {
  opponentDrinks: number
  winTarget: number
  opponentDisconnectedAt: string | null
  onOpponentForfeited: () => void
  guestJoined: boolean
}

export default function OpponentTracker({
  opponentDrinks,
  winTarget,
  opponentDisconnectedAt,
  onOpponentForfeited,
  guestJoined,
}: OpponentTrackerProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const isAlert = opponentDrinks >= winTarget - 5
  const drinksLeft = winTarget - opponentDrinks
  const progress = Math.min(opponentDrinks / winTarget, 1)

  useEffect(() => {
    if (!opponentDisconnectedAt) {
      setCountdown(null)
      return
    }
    const disconnectedMs = new Date(opponentDisconnectedAt).getTime()
    const FORFEIT_SECONDS = 15

    const update = () => {
      const remaining = FORFEIT_SECONDS - Math.floor((Date.now() - disconnectedMs) / 1000)
      if (remaining <= 0) {
        setCountdown(0)
        onOpponentForfeited()
      } else {
        setCountdown(remaining)
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [opponentDisconnectedAt, onOpponentForfeited])

  if (!guestJoined) {
    return (
      <div className="px-3 py-1.5 text-center">
        <span className="text-xs text-kopi-brown/40 font-body">Waiting for opponent to join...</span>
      </div>
    )
  }

  return (
    <motion.div
      className="px-3 py-1.5"
      animate={isAlert && countdown === null ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={isAlert && countdown === null ? { duration: 0.9, repeat: Infinity } : {}}
    >
      {countdown !== null ? (
        <div className="text-center">
          <p className="text-xs font-display font-bold text-hawker-red">
            Opponent disconnected — forfeits in {countdown}s
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-display font-bold whitespace-nowrap transition-colors ${
              isAlert ? 'text-hawker-red' : 'text-kopi-brown/60'
            }`}
          >
            {isAlert
              ? `⚠ Opp needs ${drinksLeft} more!`
              : `Opp: ${opponentDrinks} / ${winTarget}`}
          </span>
          <div className="flex-1 h-1.5 bg-kopi-brown/15 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors ${
                isAlert ? 'bg-hawker-red' : 'bg-kopi-brown/40'
              }`}
              style={{ width: `${progress * 100}%` }}
              layout
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}
