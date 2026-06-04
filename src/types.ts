export interface Inventory {
  wood: number
  copperOre: number
  copperBar: number
  forgeEmber: number
}

export type Screen = 'settlement' | 'forest' | 'mine' | 'forge' | 'inventory'

export interface DiceResult {
  roll: number
  loot: { item: keyof Inventory; amount: number } | null
}
