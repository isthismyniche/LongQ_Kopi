import { POINTS_BASE, LEVELS } from '../data/gameConfig'

const BASE_TIMER = LEVELS[0].timerSeconds // 15s — reference for free points calculation

export function calculateScore(timerSeconds: number, secondsRemaining: number, scoreMultiplier: number = 1): number {
  const freePoints = BASE_TIMER - timerSeconds
  const base = freePoints + Math.floor(secondsRemaining) + POINTS_BASE
  return Math.ceil(base * scoreMultiplier)
}
