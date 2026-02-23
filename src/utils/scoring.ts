import { POINTS_BASE } from '../data/gameConfig'

export function calculateScore(secondsRemaining: number, scoreMultiplier: number = 1): number {
  const base = POINTS_BASE + Math.floor(secondsRemaining)
  return Math.ceil(base * scoreMultiplier)
}
