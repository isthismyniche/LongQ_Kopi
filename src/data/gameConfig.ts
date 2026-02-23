import type { PoolType } from './drinkMatrix'

export const STARTING_LIVES = 2
export const POINTS_BASE = 5
export const TRANSITION_DURATION_MS = 1500
export const LEVEL_TRANSITION_MS = 3000

export interface LevelConfig {
  level: number
  name: string
  timerSeconds: number
  cupsToComplete: number // correct cups needed to advance past this level
  queueSize: number
  drinkPool: PoolType
  scoreMultiplier: number
}

export const LEVELS: LevelConfig[] = [
  { level: 1, name: 'Morning Shift', timerSeconds: 15, cupsToComplete: 6, queueSize: 2, drinkPool: 'standard', scoreMultiplier: 1 },
  { level: 2, name: 'Breakfast Rush', timerSeconds: 15, cupsToComplete: 13, queueSize: 3, drinkPool: 'medium', scoreMultiplier: 1.2 },
  { level: 3, name: 'Lunch Hour', timerSeconds: 12, cupsToComplete: 10, queueSize: 4, drinkPool: 'full', scoreMultiplier: 1.5 },
  { level: 4, name: 'Tea Time', timerSeconds: 8, cupsToComplete: 10, queueSize: 5, drinkPool: 'full', scoreMultiplier: 1.8 },
  { level: 5, name: 'Supper Crowd', timerSeconds: 5, cupsToComplete: Infinity, queueSize: 6, drinkPool: 'full', scoreMultiplier: 2.5 },
]

// Kept for backwards compat — default timer is level 1
export const ORDER_TIME_SECONDS = LEVELS[0].timerSeconds

export const CROWD_COMMENTS = [
  'Wah, the queue damn long!',
  'This stall famous one!',
  'Boss, faster leh!',
  'The kopi here is shiok!',
  'Auntie say this one best!',
  'Queue since 6am sia!',
  'Must try the kopi gau!',
  'My friend recommend this stall!',
  'The uncle here very power!',
  'Worth the wait lah!',
  'Eh, got seat or not?',
  'Wah, smell so good!',
  'This one Michelin star stall!',
  'Can I dabao also?',
  'Steady, business booming!',
]

export function getLevelForCup(cupNumber: number): LevelConfig {
  let cupsRemaining = cupNumber
  for (const level of LEVELS) {
    if (cupsRemaining < level.cupsToComplete) return level
    cupsRemaining -= level.cupsToComplete
  }
  return LEVELS[LEVELS.length - 1]
}

export function getCupThresholdForLevel(targetLevel: number): number {
  let total = 0
  for (const level of LEVELS) {
    if (level.level >= targetLevel) return total
    total += level.cupsToComplete
  }
  return total
}
