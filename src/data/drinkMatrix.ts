export type BaseType = 'Kopi' | 'Teh'
export type SugarLevel = 'Full' | 'Half' | 'None'
export type MilkType = 'Condensed' | 'Evaporated' | 'None'

export interface BaseDrink {
  name: string
  base: BaseType
  baseUnits: number
  sugar: SugarLevel
  milk: MilkType
  hotWater: boolean
}

export interface DrinkOrder extends BaseDrink {
  peng: boolean
  displayName: string
}

export const BASE_DRINKS: BaseDrink[] = [
  { name: 'Kopi', base: 'Kopi', baseUnits: 1, sugar: 'Full', milk: 'Condensed', hotWater: true },
  { name: 'Kopi O', base: 'Kopi', baseUnits: 1, sugar: 'Full', milk: 'None', hotWater: true },
  { name: 'Kopi C', base: 'Kopi', baseUnits: 1, sugar: 'Full', milk: 'Evaporated', hotWater: true },
  { name: 'Kopi Po', base: 'Kopi', baseUnits: 0.5, sugar: 'Full', milk: 'Condensed', hotWater: true },
  { name: 'Kopi Gau', base: 'Kopi', baseUnits: 2, sugar: 'Full', milk: 'Condensed', hotWater: true },
  { name: 'Kopi Di Lo', base: 'Kopi', baseUnits: 3, sugar: 'Full', milk: 'Condensed', hotWater: false },
  { name: 'Kopi Siu Dai', base: 'Kopi', baseUnits: 1, sugar: 'Half', milk: 'Condensed', hotWater: true },
  { name: 'Kopi O Siu Dai', base: 'Kopi', baseUnits: 1, sugar: 'Half', milk: 'None', hotWater: true },
  { name: 'Kopi C Siu Dai', base: 'Kopi', baseUnits: 1, sugar: 'Half', milk: 'Evaporated', hotWater: true },
  { name: 'Kopi O Kosong', base: 'Kopi', baseUnits: 1, sugar: 'None', milk: 'None', hotWater: true },
  { name: 'Kopi C Kosong', base: 'Kopi', baseUnits: 1, sugar: 'None', milk: 'Evaporated', hotWater: true },
  { name: 'Teh', base: 'Teh', baseUnits: 1, sugar: 'Full', milk: 'Condensed', hotWater: true },
  { name: 'Teh O', base: 'Teh', baseUnits: 1, sugar: 'Full', milk: 'None', hotWater: true },
  { name: 'Teh C', base: 'Teh', baseUnits: 1, sugar: 'Full', milk: 'Evaporated', hotWater: true },
  { name: 'Teh Po', base: 'Teh', baseUnits: 0.5, sugar: 'Full', milk: 'Condensed', hotWater: true },
  { name: 'Teh Gau', base: 'Teh', baseUnits: 2, sugar: 'Full', milk: 'Condensed', hotWater: true },
  { name: 'Teh Di Lo', base: 'Teh', baseUnits: 3, sugar: 'Full', milk: 'Condensed', hotWater: false },
  { name: 'Teh Siu Dai', base: 'Teh', baseUnits: 1, sugar: 'Half', milk: 'Condensed', hotWater: true },
  { name: 'Teh O Siu Dai', base: 'Teh', baseUnits: 1, sugar: 'Half', milk: 'None', hotWater: true },
  { name: 'Teh C Siu Dai', base: 'Teh', baseUnits: 1, sugar: 'Half', milk: 'Evaporated', hotWater: true },
  { name: 'Teh O Kosong', base: 'Teh', baseUnits: 1, sugar: 'None', milk: 'None', hotWater: true },
  { name: 'Teh C Kosong', base: 'Teh', baseUnits: 1, sugar: 'None', milk: 'Evaporated', hotWater: true },
]

export function expandWithPeng(drinks: BaseDrink[]): DrinkOrder[] {
  const result: DrinkOrder[] = []
  for (const drink of drinks) {
    result.push({ ...drink, peng: false, displayName: drink.name })
    result.push({ ...drink, peng: true, displayName: `${drink.name} Peng` })
  }
  return result
}

export const ALL_DRINKS: DrinkOrder[] = expandWithPeng(BASE_DRINKS)

// Difficulty pools
const EXCLUDED_STANDARD = ['Di Lo', 'Gau', 'Po', 'Peng', 'Siu Dai']
const EXCLUDED_MEDIUM = ['Di Lo', 'Gau', 'Po']

export type PoolType = 'standard' | 'medium' | 'full'

export function getDrinkPool(poolType: PoolType): DrinkOrder[] {
  if (poolType === 'standard') {
    return ALL_DRINKS.filter(
      d => !EXCLUDED_STANDARD.some(ex => d.displayName.includes(ex))
    )
  }
  if (poolType === 'medium') {
    return ALL_DRINKS.filter(
      d => !EXCLUDED_MEDIUM.some(ex => d.displayName.includes(ex))
    )
  }
  return ALL_DRINKS
}
