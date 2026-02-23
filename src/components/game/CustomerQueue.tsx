import { AnimatePresence } from 'framer-motion'
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
}: CustomerQueueProps) {
  return (
    <div className="flex items-end justify-center gap-2 h-full pt-4">
      {/* Background queue */}
      <div className="flex items-end gap-1 mr-4">
        {queueCustomers.slice(0, 3).map((c, i) => (
          <Customer
            key={`queue-${i}`}
            appearance={c}
            orderText=""
            orderResult={null}
            expletive=""
            blur
          />
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
        />
      </AnimatePresence>
    </div>
  )
}
