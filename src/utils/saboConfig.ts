export const ALL_INGREDIENTS =
  ['kopi', 'teh', 'sugar', 'condensed', 'evaporated', 'ice', 'hotwater'] as const
export type SaboIngredient = typeof ALL_INGREDIENTS[number]

export const INGREDIENT_LABELS: Record<SaboIngredient, string> = {
  kopi: 'Kopi',
  teh: 'Teh',
  sugar: 'Sugar',
  condensed: 'Condensed Milk',
  evaporated: 'Evaporated Milk',
  ice: 'Ice',
  hotwater: 'Hot Water',
}

export function getSaboCharges(winTarget: number): number {
  if (winTarget <= 5) return 0
  if (winTarget <= 20) return 1
  return 2 // 25–50
}
