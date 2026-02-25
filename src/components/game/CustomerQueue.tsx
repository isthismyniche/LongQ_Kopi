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

      {/* Background crowd — absolutely centred on the same axis as the main customer.
          Each member is 28 px higher than the one in front, forming a depth-receding
          column directly behind the character at the counter. Rendered before (below in
          DOM order) the main customer so they're always behind it without needing an
          explicit z-index on the crowd itself. */}
      {queueCustomers.slice(0, 4).map((c, i) => (
        <motion.div
          key={`queue-${i}`}
          className="absolute left-1/2 pointer-events-none"
          style={{
            transform: 'translateX(-50%)',
            bottom: `${i * 28}px`,
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

      {/* Current customer — in-flow, flex bottom-aligned, rendered last so it sits in
          front of the crowd. z-index:10 ensures the speech bubble stays above the crowd
          even when the crowd customers overflow the outer div's bounds upward. */}
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
