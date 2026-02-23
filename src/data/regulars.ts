import type { CustomerAppearance } from '../hooks/useGameState'
import type { DrinkOrder, PoolType } from './drinkMatrix'
import { getDrinkPool } from './drinkMatrix'

export interface RegularCustomer {
  name: string
  appearance: CustomerAppearance
  correctReaction: string
  wrongReaction: string
}

export const REGULARS: RegularCustomer[] = [
  {
    name: 'Mr Rajan',
    appearance: {
      skinTone: '#8D5524',
      hairStyle: 0,
      shirtColor: '#F5F5F5',
      ethnicity: 'Indian',
    },
    correctReaction: 'Wah, you remember me ah!',
    wrongReaction: 'Aiyah, you forget me already?!',
  },
  {
    name: 'Makcik Siti',
    appearance: {
      skinTone: '#C68642',
      hairStyle: 3,
      shirtColor: '#2ECC71',
      ethnicity: 'Malay',
    },
    correctReaction: 'Terima kasih, sayang!',
    wrongReaction: 'Aduh, bukan ini lah!',
  },
  {
    name: 'Uncle Lim',
    appearance: {
      skinTone: '#D4A574',
      hairStyle: 0,
      shirtColor: '#34495E',
      ethnicity: 'Chinese',
    },
    correctReaction: 'Ho ah! Still got the touch!',
    wrongReaction: 'Wah lau, I come every day and you still wrong!',
  },
]

export interface RegularDrinkAssignment {
  regularIndex: number
  drink: DrinkOrder
  firstVisitDone: boolean
  secondVisitDone: boolean
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Create initial assignments for regulars with a random drink from the given pool.
 */
export function createRegularAssignments(poolType: PoolType): RegularDrinkAssignment[] {
  return REGULARS.map((_, i) => ({
    regularIndex: i,
    drink: pickRandom(getDrinkPool(poolType)),
    firstVisitDone: false,
    secondVisitDone: false,
  }))
}

/**
 * Try to get a regular for the current order based on the current level.
 * First visits happen in level 2 only (all three), second visits in levels 3-4.
 * Returns the assignment + visit type, or null if no regular should appear now.
 *
 * Uses a spacing counter to avoid back-to-back regulars.
 */
export function tryGetRegular(
  assignments: RegularDrinkAssignment[],
  currentLevel: number,
  ordersSinceLastRegular: number,
): { assignment: RegularDrinkAssignment; isSecondVisit: boolean } | null {
  // Minimum 2 orders between regulars
  if (ordersSinceLastRegular < 2) return null

  // ~40% chance per eligible order to trigger a regular
  if (Math.random() > 0.4) return null

  // First visits in level 2 only (all three regulars introduced here)
  if (currentLevel === 2) {
    const pending = shuffle(assignments.filter(a => !a.firstVisitDone))
    if (pending.length > 0) {
      pending[0].firstVisitDone = true
      return { assignment: pending[0], isSecondVisit: false }
    }
  }

  // Second visits in levels 3-4
  if (currentLevel >= 3 && currentLevel <= 4) {
    const pending = shuffle(assignments.filter(a => a.firstVisitDone && !a.secondVisitDone))
    if (pending.length > 0) {
      pending[0].secondVisitDone = true
      return { assignment: pending[0], isSecondVisit: true }
    }
  }

  return null
}
