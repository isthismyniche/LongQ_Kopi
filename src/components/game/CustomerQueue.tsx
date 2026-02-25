import { motion, AnimatePresence } from 'framer-motion'
import Customer from './Customer'
import type { CustomerAppearance, OrderResult } from '../../hooks/useGameState'

interface CustomerQueueProps {
  currentCustomer: CustomerAppearance
  queueCustomers: CustomerAppearance[]
  orderText: string
  orderResult: OrderResult
  expletive: string
  correctReaction: string
  regularName: string
  isSecondVisit: boolean
  timerUrgent?: boolean
}

export default function CustomerQueue({
  currentCustomer,
  queueCustomers,
  orderText,
  orderResult,
  expletive,
  correctReaction,
  regularName,
  isSecondVisit,
  timerUrgent = false,
}: CustomerQueueProps) {
  return (
    <div className="flex items-end justify-center gap-2 h-full pt-4">
      {/* Background queue — subtle staggered idle bob */}
      <div className="flex items-end gap-1 mr-4">
        {queueCustomers.slice(0, 3).map((c, i) => (
          <motion.div
            key={`queue-${i}`}
            animate={{ y: [0, -2, 0] }}
            transition={{
              duration: 2.8 + i * 0.35,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.55,
            }}
          >
            <Customer
              appearance={c}
              orderText=""
              orderResult={null}
              expletive=""
              blur
            />
          </motion.div>
        ))}
      </div>

      {/* Current customer */}
      <AnimatePresence mode="wait">
        <Customer
          key={`${orderText}-${regularName}-${isSecondVisit}`}
          appearance={currentCustomer}
          orderText={orderText}
          orderResult={orderResult}
          expletive={expletive}
          correctReaction={correctReaction}
          regularName={regularName}
          isSecondVisit={isSecondVisit}
          isFirst
          timerUrgent={timerUrgent}
        />
      </AnimatePresence>
    </div>
  )
}
