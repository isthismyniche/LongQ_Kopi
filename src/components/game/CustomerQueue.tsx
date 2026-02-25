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
    <div className="relative h-full flex items-end justify-center pt-4">

      {/* Background crowd — stacked vertically on left, always behind current customer.
          Each customer is 28 px higher than the one in front, creating a depth-receding
          column effect without consuming any horizontal space. */}
      {queueCustomers.length > 0 && (
        <div className="absolute left-3 bottom-0 pointer-events-none w-14">
          {queueCustomers.slice(0, 4).map((c, i) => (
            <motion.div
              key={`queue-${i}`}
              className="absolute left-0 bottom-0"
              style={{
                bottom: `${i * 28}px`,
                zIndex: 4 - i,   // front customer (i=0) on top of the column
              }}
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
      )}

      {/* Current customer — centered, always in front of the crowd */}
      <div className="relative" style={{ zIndex: 10 }}>
        <AnimatePresence mode="sync">
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
    </div>
  )
}
