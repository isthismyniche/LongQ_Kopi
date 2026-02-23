import type { DrinkOrder, SugarLevel, MilkType, BaseType } from '../data/drinkMatrix'

export interface CupContents {
  base: BaseType | null
  baseUnits: number
  sugar: SugarLevel
  milk: MilkType
  hasIce: boolean
  hasHotWater: boolean
}

export function createEmptyCup(): CupContents {
  return {
    base: null,
    baseUnits: 0,
    sugar: 'None',
    milk: 'None',
    hasIce: false,
    hasHotWater: false,
  }
}

export function validateOrder(cup: CupContents, order: DrinkOrder): boolean {
  return (
    cup.base === order.base &&
    cup.baseUnits === order.baseUnits &&
    cup.sugar === order.sugar &&
    cup.milk === order.milk &&
    cup.hasIce === order.peng &&
    cup.hasHotWater === order.hotWater
  )
}

export interface OrderMismatch {
  label: string
  type: 'wrong' | 'missed'
}

export function getOrderMismatches(cup: CupContents, order: DrinkOrder): OrderMismatch[] {
  const mismatches: OrderMismatch[] = []

  // Base type
  if (cup.base !== order.base) {
    if (cup.base === null) {
      mismatches.push({ label: `Missed: ${order.base} base`, type: 'missed' })
    } else {
      mismatches.push({ label: `Wrong base: used ${cup.base} instead of ${order.base}`, type: 'wrong' })
    }
  }

  // Base units
  if (cup.base === order.base && cup.baseUnits !== order.baseUnits) {
    if (cup.baseUnits > order.baseUnits) {
      mismatches.push({ label: `Too much base: ${cup.baseUnits}u instead of ${order.baseUnits}u`, type: 'wrong' })
    } else {
      mismatches.push({ label: `Not enough base: ${cup.baseUnits}u instead of ${order.baseUnits}u`, type: 'missed' })
    }
  }

  // Sugar
  if (cup.sugar !== order.sugar) {
    if (order.sugar === 'None' && cup.sugar !== 'None') {
      mismatches.push({ label: `Added sugar (should be Kosong)`, type: 'wrong' })
    } else if (cup.sugar === 'None' && order.sugar !== 'None') {
      mismatches.push({ label: `Missed: ${order.sugar === 'Half' ? 'half' : 'full'} sugar`, type: 'missed' })
    } else {
      mismatches.push({ label: `Wrong sugar: ${cup.sugar} instead of ${order.sugar}`, type: 'wrong' })
    }
  }

  // Milk
  if (cup.milk !== order.milk) {
    if (order.milk === 'None' && cup.milk !== 'None') {
      mismatches.push({ label: `Added ${cup.milk} milk (not needed)`, type: 'wrong' })
    } else if (cup.milk === 'None' && order.milk !== 'None') {
      mismatches.push({ label: `Missed: ${order.milk} milk`, type: 'missed' })
    } else {
      mismatches.push({ label: `Wrong milk: ${cup.milk} instead of ${order.milk}`, type: 'wrong' })
    }
  }

  // Ice
  if (cup.hasIce !== order.peng) {
    if (cup.hasIce) {
      mismatches.push({ label: 'Added ice (not Peng)', type: 'wrong' })
    } else {
      mismatches.push({ label: 'Missed: Ice (Peng)', type: 'missed' })
    }
  }

  // Hot water
  if (cup.hasHotWater !== order.hotWater) {
    if (cup.hasHotWater) {
      mismatches.push({ label: 'Added hot water (not needed)', type: 'wrong' })
    } else {
      mismatches.push({ label: 'Missed: Hot water', type: 'missed' })
    }
  }

  return mismatches
}
